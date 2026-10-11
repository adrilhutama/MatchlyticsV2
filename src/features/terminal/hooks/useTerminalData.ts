import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildBivariatePoisson,
  devigShin,
  calculateEV,
  calculateKellyStake,
} from "@core/math/index.js";
import type { SanitizedMatch } from "@core/types/domain.js";
import { matchQueries } from "@services/supabase/query-options.js";
import { useTerminalFilterStore } from "../stores/useTerminalFilterStore.js";

export interface MatchEdge {
  homeEV: number;
  drawEV: number;
  awayEV: number;
  bestSide: "home" | "draw" | "away";
  bestEV: number;
  kellyStake: number;
}

export interface UseTerminalDataReturn {
  matches: SanitizedMatch[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  edges: Map<string, MatchEdge>;
}

/**
 * Use terminal data hook.
 *
 * Fetches matches via TanStack Query, reads filter state from Zustand,
 * computes on-the-fly Dixon-Coles probabilities and +EV edges.
 */
export function useTerminalData(): UseTerminalDataReturn {
  const selectedLeagueId = useTerminalFilterStore((s) => s.selectedLeagueId);
  const minEV = useTerminalFilterStore((s) => s.minEV);
  const selectedBookmakerId = useTerminalFilterStore((s) => s.selectedBookmakerId);

  const {
    data: matches = [],
    isLoading,
    error,
    refetch,
  } = useQuery(matchQueries.list(selectedLeagueId ?? undefined));

  // Compute quant edges for each match
  const edges = useMemo(() => {
    const edgeMap = new Map<string, MatchEdge>();

    for (const match of matches) {
      if (!match.hasValidOdds) {
        edgeMap.set(match.id, {
          homeEV: 0, drawEV: 0, awayEV: 0,
          bestSide: "home", bestEV: 0, kellyStake: 0,
        });
        continue;
      }

      // Find selected bookmaker's 1X2 odds
      const bookmaker = match.bookmakers.find(
        (b) => b.id === selectedBookmakerId,
      );
      const odds = bookmaker?.h2h;

      if (!odds) {
        edgeMap.set(match.id, {
          homeEV: 0, drawEV: 0, awayEV: 0,
          bestSide: "home", bestEV: 0, kellyStake: 0,
        });
        continue;
      }

      // Dixon-Coles probabilities
      const matrix = buildBivariatePoisson(
        match.lambdas.home,
        match.lambdas.away,
        match.lambdas.cov,
      );

      // De-vig fair odds from bookmaker prices
      const fair = devigShin([odds.home, odds.draw, odds.away]);

      // EV for each outcome
      const homeEV = calculateEV(fair.pHome, odds.home);
      const drawEV = calculateEV(fair.pDraw, odds.draw);
      const awayEV = calculateEV(fair.pAway, odds.away);

      // Best side
      let bestSide: "home" | "draw" | "away" = "home";
      let bestEV = homeEV;
      if (drawEV > bestEV) { bestSide = "draw"; bestEV = drawEV; }
      if (awayEV > bestEV) { bestSide = "away"; bestEV = awayEV; }

      // Quarter Kelly on best edge
      const kellyStake = bestEV > 0
        ? calculateKellyStake(
            bestSide === "home" ? fair.pHome : bestSide === "draw" ? fair.pDraw : fair.pAway,
            bestSide === "home" ? odds.home : bestSide === "draw" ? odds.draw : odds.away,
            0.25,
          )
        : 0;

      edgeMap.set(match.id, {
        homeEV, drawEV, awayEV, bestSide, bestEV, kellyStake,
      });
    }

    return edgeMap;
  }, [matches, selectedBookmakerId]);

  // Filter matches by minEV threshold
  const filtered = useMemo(() => {
    if (minEV === 0) return matches;
    return matches.filter((m) => {
      const edge = edges.get(m.id);
      return edge ? edge.bestEV >= minEV : false;
    });
  }, [matches, edges, minEV]);

  return {
    matches: filtered,
    isLoading,
    error,
    refetch,
    edges,
  };
}
