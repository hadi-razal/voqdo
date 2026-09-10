import { Alert, Platform } from 'react-native';

/**
 * Destructive confirmation that works on every platform the app builds for.
 *
 * `Alert.alert` is a no-op in react-native-web, which would let a delete run
 * (or silently not run) with no prompt at all — so the web build falls back to
 * the browser's own confirm dialog.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
