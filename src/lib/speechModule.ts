import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModuleType } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';

// Expo Go does not include this module. Do not crash the route registry.
export const ExpoSpeechRecognitionModule =
  requireOptionalNativeModule<ExpoSpeechRecognitionModuleType>('ExpoSpeechRecognition');
