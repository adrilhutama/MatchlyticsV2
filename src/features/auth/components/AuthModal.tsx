import { useState } from "react";
import { Sparkles, Mail } from "lucide-react";
import { Dialog, DialogContent } from "../../../shared/components/ui/dialog.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/components/ui/tabs.js";
import { Button } from "../../../shared/components/ui/button.js";
import { Badge } from "../../../shared/components/ui/badge.js";
import { useAuth } from "../hooks/useAuth.js";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithEmail, user } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSent(false);
    const { error: err } = await signInWithEmail(email);
    if (err) {
      setError(err.message ?? "Failed to send login link.");
    } else {
      setSent(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Matchlytics Terminal">
        <div className="flex flex-col items-center gap-4">
          {/* Branding header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-700/50 bg-emerald-950/40">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <p className="text-xs font-mono text-zinc-400">
              Quantitative sports analytics terminal
            </p>
          </div>

          {user ? (
            /* Signed-in state */
            <div className="w-full space-y-3">
              <Badge variant="emerald" className="w-full justify-center">
                Signed in as {user.email}
              </Badge>
              <p className="text-center text-xs font-mono text-zinc-500">
                You are already authenticated. Close this dialog to continue.
              </p>
            </div>
          ) : (
            /* Auth tabs */
            <Tabs value="magic-link" onValueChange={() => {}}>
              <TabsList>
                <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
                <TabsTrigger value="guest">Guest Mode</TabsTrigger>
              </TabsList>

              <TabsContent value="magic-link">
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="text-xs font-mono text-zinc-400">
                      Email address
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                      />
                      <Button variant="default" onClick={handleSend}>
                        <Mail size={14} />
                        Send
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs font-mono text-rose-400">{error}</p>
                  )}
                  {sent && (
                    <p className="text-xs font-mono text-emerald-400">
                      Check your inbox for the login link.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="guest">
                <div className="space-y-3 mt-4">
                  <p className="text-xs font-mono text-zinc-400">
                    Browse scheduled matches and basic odds in guest mode.
                    Upgrade to Pro for Dixon-Coles heatmaps, Kelly sizing, and
                    golden-edge signals.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Continue as Guest
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
