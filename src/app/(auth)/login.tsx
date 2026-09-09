import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AuthButton, AuthField, AuthScreen, PasswordToggle, authStyles } from '../../../components/authForm';
import { useAuth } from '@/context/auth';

type Focused = 'login' | 'password' | null;

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<Focused>(null);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => Boolean(login.trim() && password), [login, password]);

  const submit = () => {
    if (!canSubmit) return;
    const ok = signIn(login, password);
    if (!ok) {
      setError('Wrong login or password.');
    }
  };

  return (
    <AuthScreen
      heading="Welcome back"
      subtitle="Sign in to pick up today’s list."
      footerText="New to Voqdo?"
      footerAction="Create account"
      onFooterPress={() => router.push('/register')}
    >
      <View style={authStyles.form}>
        <AuthField
          label="Login"
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          value={login}
          onChangeText={(value) => {
            setLogin(value);
            setError('');
          }}
          placeholder="123"
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
          placeholder="123"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          focused={focused === 'password'}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          trailing={
            <PasswordToggle visible={showPassword} onPress={() => setShowPassword((value) => !value)} />
          }
        />
      </View>

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <AuthButton label="Sign in" disabled={!canSubmit} onPress={submit} />
    </AuthScreen>
  );
}
