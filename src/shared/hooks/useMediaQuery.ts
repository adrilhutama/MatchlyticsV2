/**
 * useMediaQuery — responsive breakpoint hook.
 *
 * Listens to a CSS media query via matchMedia API with proper
 * addEventListener/cleanup.  Returns `false` in test / SSR
 * environments where window is unavailable.
 */

import { useEffect, useState } from "react";

/**
 * Returns true when the current viewport matches `query`.
 * Defaults to desktop breakpoint (1024 px) to drive the
 * TerminalContainer split between desktop and mobile views.
 */
export function useMediaQuery(query: string = "(min-width: 1024px)"): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(query);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers: addEventListener
    if (mql.addEventListener) {
      mql.addEventListener("change", listener);
    } else {
      // Fallback for older environments
      mql.addListener(listener as unknown as (e: Event) => void);
    }

    setMatches(mql.matches);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", listener);
      } else {
        mql.removeListener(listener as unknown as (e: Event) => void);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Shorthand for the desktop breakpoint used by TerminalContainer.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/**
 * Shorthand for the mobile breakpoint.
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("(min-width: 1024px)");
}
