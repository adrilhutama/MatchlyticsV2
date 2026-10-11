/**
 * 6-partition sharded pipeline configuration.
 *
 * Each partition maps one or two Football-Data.org competition codes
 * to their corresponding The Odds API sport identifiers.
 * Partition numbers are 1-based (1–6) and correspond to CLI --partition=N.
 */

export interface PartitionEntry {
  /** Partition number (1–6) */
  readonly partition: number;
  /** Football-Data.org competition codes served by this partition */
  readonly footballDataCodes: string[];
  /** The Odds API sport key (e.g. "soccer_epl") */
  readonly oddsSportKey: string;
  /** Internal league IDs as stored in public.leagues */
  readonly leagueIds: string[];
}

export const PARTITIONS: PartitionEntry[] = [
  {
    partition: 1,
    footballDataCodes: ['PL', 'ELC'],
    oddsSportKey: 'soccer_epl',
    leagueIds: ['PL', 'ELC'],
  },
  {
    partition: 2,
    footballDataCodes: ['PD', 'FL1'],
    oddsSportKey: 'soccer_spain_la_liga',
    leagueIds: ['PD', 'FL1'],
  },
  {
    partition: 3,
    footballDataCodes: ['SA', 'BL1'],
    oddsSportKey: 'soccer_italy_serie_a',
    leagueIds: ['SA', 'BL1'],
  },
  {
    partition: 4,
    footballDataCodes: ['CL', 'DED'],
    oddsSportKey: 'soccer_uefa_champs_league',
    leagueIds: ['CL', 'DED'],
  },
  {
    partition: 5,
    footballDataCodes: ['PPL', 'BSA'],
    oddsSportKey: 'soccer_brazil_campeonato',
    leagueIds: ['PPL', 'BSA'],
  },
  {
    partition: 6,
    footballDataCodes: ['EC', 'WC'],
    oddsSportKey: 'soccer_uefa_european_championship',
    leagueIds: ['EC', 'WC'],
  },
];

/** Resolve a partition by its 1-based number. Returns undefined if invalid. */
export function getPartition(partitionNum: number): PartitionEntry | undefined {
  return PARTITIONS.find((p) => p.partition === partitionNum);
}

/** All partition numbers in order. */
export const ALL_PARTITION_NUMBERS: number[] = PARTITIONS.map((p) => p.partition);
