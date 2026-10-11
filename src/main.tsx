import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/hooks/useAuth.js";
import { TerminalContainer } from "./features/terminal/TerminalContainer.js";
import { AuthModal } from "./features/auth/components/AuthModal.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TerminalContainer />
      <AuthModal open={false} onOpenChange={() => {}} />
    </AuthProvider>
  </QueryClientProvider>,
);
