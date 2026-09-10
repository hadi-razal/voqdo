import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AuthButton, AuthField, AuthScreen, PasswordToggle, authStyles } from '../../../components/authForm';
import { useAuth } from '@/context/auth';

type Focused = 'name' | 'login' | 'password' | 'confirm' | null;

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<Focused>(null);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => Boolean(name.trim() && login.trim() && password && confirm),
    [name, login, password, confirm]
  );

  const submit = () => {
    if (!canSubmit) return;
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const message = register(name, login, password);
    if (message) setError(message);
  };

  return (
    <AuthScreen
      heading="Create your account"
      subtitle="A calmer way to plan the work that matters."
      footerText="Already have an account?"
      footerAction="Sign in"
      onFooterPress={() => router.replace('/login')}
    >
      <View style={authStyles.form}>
        <AuthField
          label="Name"
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError('');
          }}
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          focused={focused === 'name'}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
        />

        <AuthField
          label="Login"
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          value={login}
          onChangeText={(value) => {
            setLogin(value);
            setError('');
          }}
          placeholder="Choose a login"
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          focused={focused === 'login'}
          onFocus={() => setFocused('login')}
          onBlur={() => setFocused(null)}
        />

        <AuthField
          label="Password"
          icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          placeholder="Create a password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="next"
          focused={focused === 'password'}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          trailing={
            <PasswordToggle visible={showPassword} onPress={() => setShowPassword((value) => !value)} />
          }
        />

        <AuthField
          label="Confirm password"
          icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            setError('');
          }}
          placeholder="Repeat password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          focused={focused === 'confirm'}
          onFocus={() => setFocused('confirm')}
          onBlur={() => setFocused(null)}
        />
      </View>

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <AuthButton label="Create account" disabled={!canSubmit} onPress={submit} />
    </AuthScreen>
  );
}
