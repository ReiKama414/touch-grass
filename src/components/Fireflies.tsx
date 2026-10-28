import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FIREFLY_VERTEX_SHADER, FIREFLY_FRAGMENT_SHADER } from '../shaders/fireflyShaders';
import { getTerrainHeight } from '../utils/terrain';

interface FirefliesProps {
  count: number;
  nightMixRef: React.MutableRefObject<{ value: number }>;
}

export const Fireflies: React.FC<FirefliesProps> = ({ count, nightMixRef }) => {
  const { geometry, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const basePos = new Float32Array(count * 3);
    const orbits = new Float32Array(count * 4);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread fireflies across foreground and mid-ground meadow for rich depth parallax
      const depthT = Math.pow(Math.random(), 1.15);
      const z = 12.5 - depthT * 48.0;
      const spreadX = 9.0 + depthT * 26.0;
      const x = (Math.random() * 2.0 - 1.0) * spreadX;
      const y = getTerrainHeight(x, z) + 0.55 + Math.random() * 2.2;

      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;

      orbits[i * 4] = 0.45 + Math.random() * 0.75; // speed
      orbits[i * 4 + 1] = 0.65 + Math.random() * 1.45; // horizontal orbit radius
      orbits[i * 4 + 2] = 0.25 + Math.random() * 0.65; // vertical float amplitude
      orbits[i * 4 + 3] = Math.random() * Math.PI * 2.0; // phase

      sizes[i] = 1.4 + Math.random() * 2.1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(basePos, 3));
    geo.setAttribute('aBasePos', new THREE.BufferAttribute(basePos, 3));
    geo.setAttribute('aOrbit', new THREE.BufferAttribute(orbits, 4));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const u = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    };

    return { geometry: geo, uniforms: u };
  }, [count]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uOpacity.value = THREE.MathUtils.smoothstep(nightMixRef.current.value, 0.15, 0.95);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={FIREFLY_VERTEX_SHADER}
        fragmentShader={FIREFLY_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
