import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Display, NoteCard, PrimaryButton, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { colors, font, gutter, tabularNums } from '@/theme';

/** Typed counterpart to the recorder — same analysis, no microphone. */
export default function Write() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { composeDraft } = useJournal();
  const [text, setText] = useState('');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSave = words >= 3;

  const submit = () => {
    if (!canSave) return;
    composeDraft({ body: text.trim(), source: 'text', durationMs: 0 });
    router.replace('/review');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 8 }]}
    >
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <Display size={23}>Write Journal</Display>
        <Body>Say it however it comes out. Nothing here is graded.</Body>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        placeholder="Today was…"
        placeholderTextColor={colors.faint}
        style={styles.input}
        textAlignVertical="top"
        selectionColor={colors.accent}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.meta}>
          <Text style={[styles.count, tabularNums]}>
            {words} {words === 1 ? 'word' : 'words'}
          </Text>
          {!canSave && <Text style={styles.hint}>A few more words and it&rsquo;s ready.</Text>}
        </View>

        <NoteCard icon="lock">Everything you write stays on this device.</NoteCard>
        <PrimaryButton label="Continue" icon="arrowRight" onPress={submit} disabled={!canSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: gutter, gap: 6, marginTop: 4, marginBottom: 12 },
  input: {
    flex: 1,
    marginHorizontal: gutter,
    fontFamily: font.displayRegular,
    fontSize: 16.5,
    lineHeight: 28,
    color: colors.text,
  },
  footer: { paddingHorizontal: gutter, paddingTop: 12, gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  hint: { fontFamily: font.body, fontSize: 12, color: colors.faint },
});
