import * as THREE from 'three';

/**
 * Deterministic 2D smooth value noise for organic terrain undulation.
 */
function hash2(x: number, z: number): number {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

export function smoothNoise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/**
 * Shared analytical terrain height function used across:
 * - Terrain mesh geometry
 * - GPU Instanced Grass root placement
 * - Distant Solitary Tree placement
 * - Firefly elevation above meadow
 * - Interactive mouse/touch raycast height lookup
 */
export function getTerrainHeight(x: number, z: number): number {
  // Gentle broad rolling waves across the meadow
  const broadWave =
    Math.sin(x * 0.045 + 0.4) * Math.cos(z * 0.038 - 0.3) * 1.45 +
    Math.sin(x * 0.022 - z * 0.028 + 1.1) * 1.15;

  // Subtle mid-frequency organic undulation
  const midWave =
    (smoothNoise2D(x * 0.08 + 14.2, z * 0.08 + 7.9) - 0.5) * 1.1 +
    (smoothNoise2D(x * 0.18 - 5.1, z * 0.18 + 3.4) - 0.5) * 0.32;

  // Central focal hill in the distance (around x = 0, z = -38) where the solitary tree stands
  const dxTree = x - 0.0;
  const dzTree = z + 38.0;
  const centralHill = 5.4 * Math.exp(-(dxTree * dxTree) / 620.0 - (dzTree * dzTree) / 480.0);

  // Left flanking ridge (around x = -34, z = -30)
  const dxLeft = x + 34.0;
  const dzLeft = z + 30.0;
  const leftHill = 3.8 * Math.exp(-(dxLeft * dxLeft) / 520.0 - (dzLeft * dzLeft) / 460.0);

  // Right distant ridge (around x = 36, z = -44)
  const dxRight = x - 36.0;
  const dzRight = z + 44.0;
  const rightHill = 4.3 * Math.exp(-(dxRight * dxRight) / 680.0 - (dzRight * dzRight) / 540.0);

  // Foreground gentle cradle so the camera at (0, ~2.3, 14) looks slightly across a lush dip
  const dxFg = x;
  const dzFg = z - 6.0;
  const foregroundCradle = -0.65 * Math.exp(-(dxFg * dxFg) / 220.0 - (dzFg * dzFg) / 140.0);

  return broadWave + midWave + centralHill + leftHill + rightHill + foregroundCradle;
}

export function getTerrainNormal(x: number, z: number, target = new THREE.Vector3()): THREE.Vector3 {
  const eps = 0.25;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  return target.set(hL - hR, 2.0 * eps, hD - hU).normalize();
}

export const TREE_POSITION = new THREE.Vector3(0.0, getTerrainHeight(0.0, -38.0), -38.0);
