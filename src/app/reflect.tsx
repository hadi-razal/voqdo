import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Card, Display, Kicker, PrimaryButton, Screen, TextButton, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { requestReflection } from '@/lib/remoteAnalysis';
import type { ReflectionMode, SavedReflection } from '@/lib/reflections';
import { colors, font, gutter } from '@/theme';

const MODES: { id: ReflectionMode; label: string; description: string }[] = [
  { id: 'recap', label: 'Weekly recap', description: 'Connect the moments in the entries you choose.' },
  { id: 'next-step', label: 'One small step', description: 'Find one gentle, practical idea to try next.' },
  { id: 'question', label: 'Ask my journal', description: 'Ask a question using only your chosen entries.' },
];

export default function Reflect() {
  const router = useRouter();
  const { entries, reflections, saveReflection, entryById } = useJournal();
  const { toast } = useToast();
  const [mode, setMode] = useState<ReflectionMode>('recap');
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<SavedReflection | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [readingSaved, setReadingSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const sources = entries.filter((entry) => selected.includes(entry.id));
  const body = JSON.stringify({ entries: sources.map(({ id, title, body }) => ({ id, title, body })), question: mode === 'question' ? question : '' });
  const tooLong = body.length > 6000;
  const canGenerate = sources.length > 0 && !tooLong && (mode !== 'question' || !!question.trim());
  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current);
  };
  const generate = async () => {
    if (request.current || !canGenerate) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError('');
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await requestReflection(body, mode, controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      setResult({ ...response.reflection, model: response.model, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now(), sourceIds: sources.map((entry) => entry.id), mode });
    } catch (err) {
      if (mounted.current) setError(controller.signal.aborted ? 'This took too long. Your entries and previous reflection are unchanged.' : err instanceof Error ? err.message : 'Could not generate a reflection.');
    } finally {
      clearTimeout(timer); request.current = null;
      if (mounted.current) setBusy(false);
    }
  };
  const save = async () => {
    if (!result || saving) return;
    setSaving(true);
    try { await saveReflection(result); toast('Reflection saved on this device'); }
    catch { toast('Could not save. Please try again.'); }
    finally { if (mounted.current) setSaving(false); }
  };
  return <Screen scrollRef={scrollRef} contentStyle={styles.content}>
    <TopBar onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
    <View style={styles.section}><Kicker color={colors.accent}>A LITTLE PERSPECTIVE</Kicker><Display size={28}>Reflection room</Display><Body>Small-model AI to help you revisit what matters. You choose the words it sees.</Body></View>
    {readingSaved && <View style={styles.section}><TextButton label="Create a new reflection" onPress={() => { setReadingSaved(false); setResult(null); }} /></View>}
    {!readingSaved && <>
    <View style={[styles.section, styles.modes]}>{MODES.map((item) => <Pressable key={item.id} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: mode === item.id }} onPress={() => setMode(item.id)} style={[styles.pill, mode === item.id && { backgroundColor: colors.accent }]}><Text style={[styles.pillText, mode === item.id && { color: colors.accentInk }]}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.section}><Body>{MODES.find((item) => item.id === mode)?.description}</Body>
      {mode === 'question' && <TextInput accessibilityLabel="Question for your journal" value={question} onChangeText={setQuestion} editable={!busy} maxLength={500} multiline placeholder="What seems to help me feel more settled?" placeholderTextColor={colors.faint} style={styles.input} />}
      <Kicker>CHOOSE UP TO 5 ENTRIES · {sources.length} SELECTED</Kicker>
      <Body>Nothing is sent until you tap Generate. Only selected entry titles and text, plus your question, go to OpenRouter and its model provider.</Body>
      {entries.length > 0 && <TextButton label="Select this week’s recent entries (up to 5)" onPress={() => { if (!busy) setSelected(entries.filter((entry) => entry.createdAt >= Date.now() - 7 * 86400000).slice(0, 5).map((entry) => entry.id)); }} />}
      {entries.length === 0 && <PrimaryButton label="Write your first entry" onPress={() => router.push('/write')} />}
      {(showAll ? entries : entries.slice(0, 10)).map((entry) => <Pressable key={entry.id} disabled={busy || (!selected.includes(entry.id) && selected.length >= 5)} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(entry.id) }} accessibilityLabel={`Select ${entry.title}`} onPress={() => toggle(entry.id)} style={[styles.entry, selected.includes(entry.id) && { borderColor: colors.accent }]}>
        <View style={styles.row}><Text style={styles.title}>{selected.includes(entry.id) ? '✓ ' : '○ '}{entry.title}</Text><Text style={styles.date}>{new Date(entry.createdAt).toLocaleDateString()}</Text></View><Body numberOfLines={2}>{entry.body}</Body>
      </Pressable>)}
      {entries.length > 10 && <TextButton label={showAll ? 'Show recent entries' : 'Show all entries'} onPress={() => setShowAll(!showAll)} />}
      {tooLong && <Body style={{ color: colors.warn }}>Your selection exceeds the 6,000-character AI limit. Choose fewer or shorter entries; nothing will be silently cut off.</Body>}
      {!!error && <Body style={{ color: colors.warn }}>{error}</Body>}
      <PrimaryButton label={busy ? 'Reflecting…' : 'Generate reflection'} disabled={busy || !canGenerate} onPress={generate} />
    </View>
    </>}
    {result && <Card style={styles.result}>
      <Kicker color={colors.success}>{MODES.find((item) => item.id === result.mode)?.label} · AI REFLECTION</Kicker>
      <Body>{result.summary}</Body>
      {result.observations.map((item, i) => <View key={i} style={{ gap: 5 }}><Body>{item.text}</Body><View style={styles.modes}>{item.entryIds.map((id) => <TextButton key={id} label={entryById(id)?.title ?? 'Source entry removed'} onPress={() => entryById(id) && router.push(`/entry/${id}`)} />)}</View></View>)}
      <Kicker>ONE SMALL POSSIBILITY</Kicker><Body>{result.action}</Body>
      <Kicker>A QUESTION TO KEEP</Kicker><Body>{result.question}</Body>
      <PrimaryButton label="Write about this question" onPress={() => router.push({ pathname: '/write', params: { prompt: result.question } })} />
      <TextButton label={reflections.some((item) => item.id === result.id) ? 'Saved on this device' : saving ? 'Saving…' : 'Save reflection'} onPress={() => !reflections.some((item) => item.id === result.id) && save()} />
      <Body>Based on {result.sourceIds.length} selected {result.sourceIds.length === 1 ? 'entry' : 'entries'}. These are suggestions, not conclusions about you.</Body>
    </Card>}
    {reflections.length > 0 && <View style={styles.section}><Kicker>SAVED REFLECTIONS · {reflections.length}</Kicker>{reflections.map((item) => <Card key={item.id} onPress={() => { setResult(item); setReadingSaved(true); scrollRef.current?.scrollTo({ y: 0, animated: true }); }} style={{ padding: 15, gap: 8 }}><Text style={styles.title}>{MODES.find((mode) => mode.id === item.mode)?.label} · {new Date(item.createdAt).toLocaleDateString()}</Text><Body numberOfLines={2}>{item.summary}</Body></Card>)}</View>}
  </Screen>;
}
const styles = StyleSheet.create({ content: { paddingBottom: 44, gap: 20 }, section: { marginHorizontal: gutter, gap: 12 }, modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, pill: { borderRadius: 25, padding: 12, backgroundColor: colors.surfaceRaised }, pillText: { color: colors.muted, fontFamily: font.medium, fontSize: 12 }, input: { color: colors.text, backgroundColor: colors.surface, padding: 14, borderRadius: 14, minHeight: 85, fontFamily: font.body, lineHeight: 22 }, entry: { padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 14 }, row: { flexDirection: 'row', gap: 8 }, title: { color: colors.text, fontFamily: font.medium, fontSize: 14, flex: 1 }, date: { color: colors.faint, fontSize: 11 }, result: { marginHorizontal: gutter, padding: 18, gap: 16 } });
