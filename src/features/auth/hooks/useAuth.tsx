import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@services/supabase/client";
import { fetchUserProfile } from "@services/supabase/queries";
import type { ProfileRow } from "@core/types/database";
import { useDevTierStore } from "@features/auth/stores/useDevTierStore";
import { AuthContext } from "@features/auth/context/AuthContext";

/**
 * useAuth — consumes AuthContext.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// Re-export provider so consumers can import from this barrel
export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const isDevEnabled = useDevTierStore((s) => s.isDevModeEnabled);
  const simulatedTier = useDevTierStore((s) => s.simulatedTier);

  /** Resolve effective tier: dev simulation wins when active. */
  const tier = isDevEnabled
    ? simulatedTier
    : ((profile?.tier ?? "free") as "free" | "pro");
  const isPro = tier === "pro";

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) {
      setIsAuthModalOpen(false);
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // Initialise session and listen for auth changes
  useEffect(() => {
    setIsLoading(true);

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null }; error: unknown }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    cleanupRef.current = () => subscription.unsubscribe();

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Sync profile whenever user changes
  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchUserProfile(user.id)
      .then((p: ProfileRow | null) => {
        setProfile(p);
        setIsLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setIsLoading(false);
      });
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        tier,
        isPro,
        isDev: isDevEnabled,
        signInWithEmail,
        signOut,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
