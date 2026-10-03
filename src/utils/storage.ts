/**
 * Persistent Records via localStorage
 * 高分 / 最远折数 / 累计击杀 / 场次 / 胜利次数
 */

import { PersistentRecords, RunStats } from '../types/game';

export type { PersistentRecords };

const STORAGE_KEY = 'ink_martial_records_v1';

const DEFAULT_RECORDS: PersistentRecords = {
  highScore: 0,
  bestWave: 0,
  totalKills: 0,
  totalRuns: 0,
  victories: 0,
  lastPlayedAt: 0,
};

export function loadRecords(): PersistentRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RECORDS };
    const parsed = JSON.parse(raw) as Partial<PersistentRecords>;
    return {
      ...DEFAULT_RECORDS,
      ...parsed,
      highScore: Math.max(0, Number(parsed.highScore) || 0),
      bestWave: Math.max(0, Number(parsed.bestWave) || 0),
      totalKills: Math.max(0, Number(parsed.totalKills) || 0),
      totalRuns: Math.max(0, Number(parsed.totalRuns) || 0),
      victories: Math.max(0, Number(parsed.victories) || 0),
    };
  } catch {
    return { ...DEFAULT_RECORDS };
  }
}

export function saveRunStats(stats: RunStats, isVictory: boolean): PersistentRecords {
  const records = loadRecords();
  const updated: PersistentRecords = {
    highScore: Math.max(records.highScore, stats.score),
    bestWave: Math.max(records.bestWave, stats.wave),
    totalKills: records.totalKills + stats.kills,
    totalRuns: records.totalRuns + 1,
    victories: records.victories + (isVictory ? 1 : 0),
    lastPlayedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // storage unavailable (private mode etc.) — silently ignore
  }
  return updated;
}

export function resetRecords(): PersistentRecords {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ...DEFAULT_RECORDS };
}

/** 格式化生存时长 mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
