import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthScreen({
  heading,
  subtitle,
  children,
  footerText,
  footerAction,
  onFooterPress,
}: {
  heading: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerAction: string;
  onFooterPress: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.frame}>
              <View style={styles.brand}>
                <View style={styles.mark}>
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={20}
                    tintColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.brandName}>Voqdo</Text>
              </View>

              <View style={styles.copy}>
                <Text style={styles.heading}>{heading}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              {children}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
            <Pressable onPress={onFooterPress} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.footerAction}>{footerAction}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function AuthField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  action,
  trailing,
  autoCapitalize,
  autoComplete,
  textContentType,
  returnKeyType,
  secureTextEntry,
  onSubmitEditing,
}: {
  label: string;
  icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  action?: ReactNode;
  trailing?: ReactNode;
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'username' | 'name' | 'password' | 'password-new';
  textContentType?: 'username' | 'name' | 'password' | 'newPassword';
  returnKeyType?: 'next' | 'go';
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {action}
      </View>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <SymbolView name={icon} size={16} tintColor={focused ? '#2563EB' : '#9CA3AF'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCorrect={false}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          onSubmitEditing={onSubmitEditing}
        />
        {trailing}
      </View>
    </View>
  );
}

export function PasswordToggle({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
    >
      <SymbolView
        name={
          visible
            ? { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' }
            : { ios: 'eye.fill', android: 'visibility', web: 'visibility' }
        }
        size={18}
        tintColor="#9CA3AF"
      />
    </Pressable>
  );
}

export function AuthButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export const authStyles = StyleSheet.create({
  form: {
    gap: 14,
  },
  error: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  glowOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#DBEAFE',
    top: -120,
    right: -80,
    opacity: 0.9,
  },
  glowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#EFF6FF',
    top: 80,
    left: -70,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  frame: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  copy: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputShellFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FBFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
  },
  primaryButton: {
    marginTop: 22,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 16px rgba(37, 99, 235, 0.22)',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
    boxShadow: 'none',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  footerAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.72,
  },
});
