import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  name: string;
  login: string;
};

type Account = AuthUser & {
  password: string;
};

type AuthContextValue = {
  isSignedIn: boolean;
  user: AuthUser | null;
  signIn: (login: string, password: string) => boolean;
  register: (name: string, login: string, password: string) => string | null;
  signOut: () => void;
};

const DEMO_ACCOUNT: Account = {
  name: 'Demo',
  login: '123',
  password: '123',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([DEMO_ACCOUNT]);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isSignedIn: Boolean(user),
      user,
      signIn: (login, password) => {
        const match = accounts.find(
          (account) => account.login === login.trim() && account.password === password
        );
        if (!match) return false;
        setUser({ name: match.name, login: match.login });
        return true;
      },
      register: (name, login, password) => {
        const trimmedLogin = login.trim();
        const trimmedName = name.trim();
        if (!trimmedName || !trimmedLogin || !password) {
          return 'Fill in every field to continue.';
        }
        if (accounts.some((account) => account.login === trimmedLogin)) {
          return 'That login is already taken.';
        }

        const next: Account = { name: trimmedName, login: trimmedLogin, password };
        setAccounts((current) => [...current, next]);
        setUser({ name: next.name, login: next.login });
        return null;
      },
      signOut: () => setUser(null),
    }),
    [accounts, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
