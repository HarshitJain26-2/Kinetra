import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { sanitizeAuthError } from '../utils/authErrors';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Fallback simulated sign-in for testing/development when credentials not injected
        const mockUser: any = { id: 'mock-athlete-id', email: email.trim() };
        setUser(mockUser);
        setSession({ user: mockUser } as any);
        setLoading(false);
        return true;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(sanitizeAuthError(signInError));
        setLoading(false);
        return false;
      }

      setUser(data.user);
      setSession(data.session);
      setLoading(false);
      return true;
    } catch (err) {
      setError(sanitizeAuthError(err));
      setLoading(false);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const mockUser: any = { id: 'mock-athlete-id', email: email.trim(), user_metadata: { full_name: fullName.trim() } };
        setUser(mockUser);
        setSession({ user: mockUser } as any);
        setLoading(false);
        return true;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(sanitizeAuthError(signUpError));
        setLoading(false);
        return false;
      }

      setUser(data.user);
      setSession(data.session);
      setLoading(false);
      return true;
    } catch (err) {
      setError(sanitizeAuthError(err));
      setLoading(false);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return true;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetError) {
        setError(sanitizeAuthError(resetError));
        setLoading(false);
        return false;
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError(sanitizeAuthError(err));
      setLoading(false);
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        resetPassword,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
