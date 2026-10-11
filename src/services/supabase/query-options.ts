/**
 * TanStack Query v5 query option factories.
 *
 * Each factory captures the right staleTime / refetch policy so components
 * can simply call `useQuery(queries.league.all())` without repeating config.
 */

import { queryOptions } from "@tanstack/react-query";

import {
  fetchLeagues,
  fetchMatchById,
  fetchMatches,
  fetchUserProfile,
} from "./queries.js";

export const leagueQueries = {
  /** All leagues — cached for 1 hour; rarely changes. */
  all: () =>
    queryOptions({
      queryKey: ["leagues"],
      queryFn: fetchLeagues,
      staleTime: 1000 * 60 * 60,
     gcTime: 1000 * 60 * 60,
    }),
};

export const matchQueries = {
  /**
   * Match list, optionally filtered by league.
   * Stale after 10 minutes; no refetch on window focus to respect free-tier quotas.
   */
  list: (leagueId?: string) =>
    queryOptions({
      queryKey: ["matches", leagueId ?? null],
      queryFn: () => fetchMatches(leagueId),
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    }),

  /**
   * Single match detail.
   * Stale after 5 minutes — sufficient for pre-match and in-play updates.
   */
  detail: (matchId: string) =>
    queryOptions({
      queryKey: ["match", matchId],
      queryFn: () => fetchMatchById(matchId),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    }),
};

export const profileQueries = {
  /**
   * Current user profile.
   * Stale after 30 minutes; profiles change very rarely.
   */
  detail: (userId: string) =>
    queryOptions({
      queryKey: ["profile", userId],
      queryFn: () => fetchUserProfile(userId),
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    }),
};
