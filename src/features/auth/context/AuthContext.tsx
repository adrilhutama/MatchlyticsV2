import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { ProfileRow } from "../../../core/types/database.js";

export interface AuthContextValue {
  user: User | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  /** Effective tier: dev simulation overrides live tier when active. */
  tier: "free" | "pro";
  isPro: boolean;
  isDev: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

/** Null context — components outside provider receive this and should guard. */
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
