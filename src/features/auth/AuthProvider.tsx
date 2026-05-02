import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpAndCreateWorkspace: (
    input: SignUpInput
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.warn("Failed to load Supabase session:", error.message);
      }

      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,

      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw error;
        }
      },

      async signUpAndCreateWorkspace({
        email,
        password,
        fullName,
        organizationName,
      }: SignUpInput) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              organization_name: organizationName.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          return { needsEmailConfirmation: true };
        }

        const { error: workspaceError } = await supabase.rpc(
          "create_initial_workspace",
          {
            full_name_input: fullName.trim(),
            organization_name_input: organizationName.trim(),
          }
        );

        if (workspaceError) {
          throw workspaceError;
        }

        return { needsEmailConfirmation: false };
      },

      async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase()
        );

        if (error) {
          throw error;
        }
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
