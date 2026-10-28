export type ThemeMode = 'day' | 'night';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityPreset {
  label: string;
  bladeCount: number;
  fireflyCount: number;
  terrainSegments: number;
  maxDpr: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    label: 'Low',
    bladeCount: 38000,
    fireflyCount: 75,
    terrainSegments: 120,
    maxDpr: 1.25
  },
  medium: {
    label: 'Medium',
    bladeCount: 78000,
    fireflyCount: 140,
    terrainSegments: 168,
    maxDpr: 1.75
  },
  high: {
    label: 'High',
    bladeCount: 130000,
    fireflyCount: 220,
    terrainSegments: 220,
    maxDpr: 2.0
  }
};

export function detectOptimalQuality(): QualityLevel {
  if (typeof window === 'undefined') return 'medium';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  if (isMobile) {
    return cores >= 6 ? 'medium' : 'low';
  }
  if (cores >= 8) return 'high';
  return 'medium';
}
