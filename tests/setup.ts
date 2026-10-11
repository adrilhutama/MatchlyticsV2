import { vi } from "vitest";

// Mock React hooks that depend on DOM
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: vi.fn((init: unknown) => [init, vi.fn()]),
    useEffect: vi.fn(),
    useContext: vi.fn(() => null),
    useMemo: vi.fn((fn: () => unknown) => fn()),
    useCallback: vi.fn((fn: unknown) => fn),
    useRef: vi.fn(() => ({ current: null })),
    createContext: vi.fn((val: unknown) => ({
      Provider: ({ children }: { children: unknown }) => children,
      Consumer: () => null,
      defaultValue: val,
    })),
  };
});

// Mock matchMedia for jsdom
if (typeof window !== "undefined") {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock Supabase
vi.mock("../src/services/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));
