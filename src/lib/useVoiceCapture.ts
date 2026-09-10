import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CapturePhase = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export type VoiceCapture = {
  phase: CapturePhase;
  /** Best transcript so far — interim while speaking, final once settled. */
  transcript: string;
  /** Milliseconds since recording began. */
  elapsedMs: number;
  audioUri?: string;
  error?: string;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

/**
 * Wraps on-device speech recognition: one call to start, live interim text
 * while the user talks, and a final transcript once everything settles.
 *
 * Audio is persisted to the app cache so an entry can keep its recording; it
 * never leaves the device.
 */

/** How long to wait for the audio file after recognition ends before giving up. */
const AUDIO_SETTLE_MS = 1500;

export function useVoiceCapture(): VoiceCapture {
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards the cancel path so a late event cannot revive the screen. */
  const cancelled = useRef(false);
  /** Recognition is in flight; a second start() must not restart it. */
  const running = useRef(false);
  /** Recognition ended; waiting only on the audio file now. */
  const awaitingAudio = useRef(false);

  const clearTimers = useCallback(() => {
    if (ticker.current) {
      clearInterval(ticker.current);
      ticker.current = null;
    }
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Both the transcript and the audio file are in — the draft can be built. */
  const settle = useCallback(() => {
    if (cancelled.current) return;
    awaitingAudio.current = false;
    running.current = false;
    clearTimers();
    setPhase((current) => (current === 'error' ? current : 'done'));
  }, [clearTimers]);

  useSpeechRecognitionEvent('start', () => {
    if (cancelled.current) return;
    startedAt.current = Date.now();
    setPhase('listening');
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 250);
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (cancelled.current) return;
    // Interim results carry the whole utterance so far, not a delta.
    const best = event.results?.[0]?.transcript ?? '';
    if (best) setTranscript(best);
  });

  useSpeechRecognitionEvent('audiostart', (event) => {
    if (event.uri) setAudioUri(event.uri);
  });

  useSpeechRecognitionEvent('audioend', (event) => {
    if (event.uri) setAudioUri(event.uri);
    // `end` often lands before the file is closed; this is the real finish.
    if (awaitingAudio.current) settle();
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (cancelled.current) return;
    clearTimers();
    running.current = false;
    awaitingAudio.current = false;

    // Staying quiet is not a failure — there is simply nothing to file.
    if (event.error === 'no-speech') {
      setPhase('done');
      return;
    }

    setError(messageFor(event.error));
    setPhase('error');
  });

  useSpeechRecognitionEvent('end', () => {
    if (cancelled.current) return;
    if (ticker.current) {
      clearInterval(ticker.current);
      ticker.current = null;
    }

    // Give the recorder a moment to hand over the file, then finish anyway.
    awaitingAudio.current = true;
    settleTimer.current = setTimeout(settle, AUDIO_SETTLE_MS);
  });

  const start = useCallback(async () => {
    if (running.current) return;
    running.current = true;

    cancelled.current = false;
    awaitingAudio.current = false;
    clearTimers();
    setTranscript('');
    setElapsedMs(0);
    setAudioUri(undefined);
    setError(undefined);
    setPhase('processing');

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      running.current = false;
      setError('VOQDO needs microphone and speech access to hear your day.');
      setPhase('error');
      return;
    }

    if (cancelled.current) {
      running.current = false;
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      recordingOptions: { persist: true },
    });
  }, [clearTimers]);

  const stop = useCallback(() => {
    if (ticker.current) {
      clearInterval(ticker.current);
      ticker.current = null;
    }
    setPhase('processing');
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelled.current = true;
    running.current = false;
    awaitingAudio.current = false;
    clearTimers();
    ExpoSpeechRecognitionModule.abort();
    setPhase('idle');
    setTranscript('');
    setElapsedMs(0);
  }, [clearTimers]);

  return { phase, transcript, elapsedMs, audioUri, error, start, stop, cancel };
}

function messageFor(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is off. Turn it on in Settings to record.';
    case 'network':
      return 'Speech recognition needs a connection for this language.';
    case 'language-not-supported':
      return 'This language is not available for on-device recognition.';
    case 'audio-capture':
      return 'The microphone is unavailable right now.';
    default:
      return 'Something went wrong while listening. Try again.';
  }
}
