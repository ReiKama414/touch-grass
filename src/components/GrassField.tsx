import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { GRASS_VERTEX_SHADER, GRASS_FRAGMENT_SHADER } from '../shaders/grassShaders';
import { getTerrainHeight } from '../utils/terrain';

interface TrailNode {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  strength: number;
}

interface GrassFieldProps {
  bladeCount: number;
  nightMixRef: React.MutableRefObject<{ value: number }>;
  onRustle?: (intensity: number) => void;
}

const TRAIL_SIZE = 16;

export const GrassField: React.FC<GrassFieldProps> = ({
  bladeCount,
  nightMixRef,
  onRustle
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, pointer, raycaster } = useThree();

  const trailRef = useRef<TrailNode[]>(
    Array.from({ length: TRAIL_SIZE }, () => ({
      x: 9999,
      z: 9999,
      vx: 0,
      vz: 0,
      radius: 3.4,
      strength: 0
    }))
  );
  const trailHeadRef = useRef(0);
  const lastWorldHitRef = useRef(new THREE.Vector2(9999, 9999));
  const lastSpawnTimeRef = useRef(0);

  const uniforms = useMemo(() => {
    const trailVecs = Array.from({ length: TRAIL_SIZE }, () => new THREE.Vector4(9999, 9999, 3.2, 0));
    const velVecs = Array.from({ length: TRAIL_SIZE }, () => new THREE.Vector2(0, 0));

    return {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector2(0.86, 0.51).normalize() },
      uWindStrength: { value: 1.0 },
      uTrail: { value: trailVecs },
      uTrailVel: { value: velVecs },
      uNightMix: { value: 0.0 },
      uSunDir: { value: new THREE.Vector3(0.42, 0.68, -0.58).normalize() },
      uDayBaseColor: { value: new THREE.Color('#184319') },
      uDayMidColor: { value: new THREE.Color('#398529') },
      uDayTipColor: { value: new THREE.Color('#97d145') },
      uNightBaseColor: { value: new THREE.Color('#071722') },
      uNightMidColor: { value: new THREE.Color('#133642') },
      uNightTipColor: { value: new THREE.Color('#38747c') },
      uFogColor: { value: new THREE.Color('#b8e0f7') },
      uFogNear: { value: 26.0 },
      uFogFar: { value: 88.0 }
    };
  }, []);

  const instancedGeometry = useMemo(() => {
    // 5-segment tapered ribbon blade (11 vertices, 9 triangles)
    const segments = 5;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      positions.push(-0.5, t, 0);
      positions.push(0.5, t, 0);
    }
    // Pointed organic apex
    positions.push(0.0, 1.0, 0);

    for (let i = 0; i < segments - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }
    const lastBase = (segments - 1) * 2;
    indices.push(lastBase, lastBase + 1, lastBase + 2);

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);

    const offsets = new Float32Array(bladeCount * 3);
    const scales = new Float32Array(bladeCount * 4);
    const phases = new Float32Array(bladeCount * 2);

    // Distribute grass blades with higher concentration in the camera frustum cone
    // from foreground (z ~ 15) out to the distant hill (z ~ -56)
    for (let i = 0; i < bladeCount; i++) {
      const u = Math.random();
      const v = Math.random();

      let x: number;
      let z: number;

      if (i < bladeCount * 0.78) {
        // Frustum-focused trapezoid for ultra-lush foreground & mid-ground
        const depthT = Math.pow(u, 1.25); // denser near camera
        z = 14.5 - depthT * 68.0; // from +14.5 to -53.5
        const halfSpread = 10.5 + depthT * 38.0;
        x = (v * 2.0 - 1.0) * halfSpread + (Math.random() - 0.5) * 1.4;
      } else {
        // Broad surrounding meadow coverage
        x = (u * 2.0 - 1.0) * 52.0;
        z = 15.0 - v * 72.0;
      }

      const y = getTerrainHeight(x, z);

      offsets[i * 3] = x;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = z;

      // Natural variation in height, width, resting curvature, and yaw
      const clumpFactor = Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.5 + 0.5;
      const height = 0.72 + Math.random() * 0.62 + clumpFactor * 0.28;
      const width = 0.068 + Math.random() * 0.042;
      const restingBend = 0.22 + Math.random() * 0.36;
      const yaw = Math.random() * Math.PI * 2.0;

      scales[i * 4] = height;
      scales[i * 4 + 1] = width;
      scales[i * 4 + 2] = restingBend;
      scales[i * 4 + 3] = yaw;

      phases[i * 2] = Math.random() * Math.PI * 2.0;
      phases[i * 2 + 1] = Math.random();
    }

    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 4));
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 2));

    // Generous bounding sphere so Three.js never prematurely culls the instanced batch
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, -20), 95);
    return geo;
  }, [bladeCount]);

  const dayFog = useMemo(() => new THREE.Color('#bce2f7'), []);
  const nightFog = useMemo(() => new THREE.Color('#071324'), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Slowly breathing wind angle & speed
    const windAngle = 0.52 + Math.sin(elapsed * 0.14) * 0.28 + Math.cos(elapsed * 0.07) * 0.15;
    uniforms.uWindDir.value.set(Math.cos(windAngle), Math.sin(windAngle)).normalize();
    uniforms.uWindStrength.value = 0.92 + Math.sin(elapsed * 0.31) * 0.24;

    const nightMix = nightMixRef.current.value;
    uniforms.uNightMix.value = nightMix;
    uniforms.uFogColor.value.copy(dayFog).lerp(nightFog, nightMix);

    // Raycast pointer onto the analytical terrain surface
    raycaster.setFromCamera(pointer, camera);
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;

    if (dir.y < -0.01) {
      // Iterative march against analytical heightfield for exact terrain intersection
      let tEst = (origin.y - 1.0) / -dir.y;
      tEst = THREE.MathUtils.clamp(tEst, 1.5, 58.0);
      for (let step = 0; step < 4; step++) {
        const px = origin.x + dir.x * tEst;
        const pz = origin.z + dir.z * tEst;
        const py = origin.y + dir.y * tEst;
        const h = getTerrainHeight(px, pz);
        tEst += (py - h) / Math.max(0.08, -dir.y);
      }

      const hitX = origin.x + dir.x * tEst;
      const hitZ = origin.z + dir.z * tEst;

      if (tEst > 1.0 && tEst < 54.0) {
        const dx = hitX - lastWorldHitRef.current.x;
        const dz = hitZ - lastWorldHitRef.current.y;
        const moveDist = Math.hypot(dx, dz);

        if (moveDist > 0.18 && elapsed - lastSpawnTimeRef.current > 0.022) {
          const idx = trailHeadRef.current % TRAIL_SIZE;
          trailHeadRef.current++;

          const speed = Math.min(3.5, moveDist / Math.max(0.016, delta) * 0.08);
          const node = trailRef.current[idx];
          node.x = hitX;
          node.z = hitZ;
          node.vx = moveDist > 0.001 ? dx / moveDist : 0;
          node.vz = moveDist > 0.001 ? dz / moveDist : 0;
          node.radius = 2.8 + Math.min(1.8, speed * 0.65);
          node.strength = Math.min(1.0, 0.55 + speed * 0.35);

          lastWorldHitRef.current.set(hitX, hitZ);
          lastSpawnTimeRef.current = elapsed;

          if (onRustle && speed > 0.45) {
            onRustle(speed);
          }
        }
      }
    }

    // Decay all trail nodes smoothly
    const trailUniform = uniforms.uTrail.value;
    const velUniform = uniforms.uTrailVel.value;
    for (let i = 0; i < TRAIL_SIZE; i++) {
      const node = trailRef.current[i];
      if (node.strength > 0.001) {
        node.strength = Math.max(0, node.strength - delta * 0.72);
      }
      trailUniform[i].set(node.x, node.z, node.radius, node.strength);
      velUniform[i].set(node.vx, node.vz);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[instancedGeometry, undefined, bladeCount]}
      frustumCulled={false}
    >
      <shaderMaterial
        vertexShader={GRASS_VERTEX_SHADER}
        fragmentShader={GRASS_FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
