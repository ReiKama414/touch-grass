import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FOLIAGE_VERTEX_SHADER, FOLIAGE_FRAGMENT_SHADER } from '../shaders/skyCloudShaders';
import { TREE_POSITION } from '../utils/terrain';

interface SolitaryTreeProps {
  nightMixRef: React.MutableRefObject<{ value: number }>;
}

interface BranchSpec {
  pos: [number, number, number];
  rot: [number, number, number];
  radiusTop: number;
  radiusBottom: number;
  length: number;
}

export const SolitaryTree: React.FC<SolitaryTreeProps> = ({ nightMixRef }) => {
  const branches = useMemo<BranchSpec[]>(() => [
    // Main trunk & root flare
    { pos: [0, 1.5, 0], rot: [0.03, 0, -0.05], radiusTop: 0.38, radiusBottom: 0.66, length: 3.4 },
    { pos: [-0.08, 3.6, 0.05], rot: [0.06, 0.2, 0.08], radiusTop: 0.26, radiusBottom: 0.40, length: 2.2 },
    // Primary boughs
    { pos: [-0.85, 4.7, 0.22], rot: [0.18, 0.3, 0.62], radiusTop: 0.13, radiusBottom: 0.24, length: 2.6 },
    { pos: [0.78, 4.9, -0.18], rot: [-0.15, -0.2, -0.55], radiusTop: 0.12, radiusBottom: 0.23, length: 2.5 },
    { pos: [0.12, 5.2, 0.72], rot: [0.56, 0.1, -0.12], radiusTop: 0.11, radiusBottom: 0.21, length: 2.2 },
    { pos: [-0.15, 5.1, -0.68], rot: [-0.52, -0.1, 0.14], radiusTop: 0.11, radiusBottom: 0.21, length: 2.1 },
    // Secondary upper branches
    { pos: [-1.65, 5.8, 0.45], rot: [0.28, 0.4, 0.85], radiusTop: 0.07, radiusBottom: 0.13, length: 1.7 },
    { pos: [1.55, 6.0, -0.35], rot: [-0.22, -0.3, -0.78], radiusTop: 0.07, radiusBottom: 0.13, length: 1.6 }
  ], []);

  const foliageCount = 340;

  const { foliageGeo, foliageUniforms } = useMemo(() => {
    const baseGeo = new THREE.IcosahedronGeometry(1.0, 2);
    // Slightly flatten and roughen the base foliage cluster so it looks organic, never like a plastic sphere
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const bump = 0.86 + 0.24 * Math.sin(vx * 3.7 + vy * 2.9) * Math.cos(vz * 3.3);
      pos.setXYZ(i, vx * bump, vy * 0.76 * bump, vz * bump);
    }
    baseGeo.computeVertexNormals();

    const geo = new THREE.InstancedBufferGeometry();
    geo.index = baseGeo.index;
    geo.attributes.position = baseGeo.attributes.position;
    geo.attributes.normal = baseGeo.attributes.normal;

    const offsets = new Float32Array(foliageCount * 3);
    const scales = new Float32Array(foliageCount);
    const phases = new Float32Array(foliageCount);

    // Multi-dome organic oak/elm crown centers
    const crownCenters = [
      [0.0, 6.9, 0.0, 2.6, 1.8],
      [-1.85, 6.1, 0.35, 2.1, 1.4],
      [1.75, 6.2, -0.25, 2.0, 1.4],
      [-0.65, 6.4, 1.35, 1.8, 1.3],
      [0.65, 6.3, -1.25, 1.8, 1.3],
      [0.15, 7.6, 0.1, 1.9, 1.25]
    ];

    for (let i = 0; i < foliageCount; i++) {
      const c = crownCenters[i % crownCenters.length];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.55);

      const ox = c[0] + Math.sin(phi) * Math.cos(theta) * c[3] * r;
      const oy = c[1] + Math.cos(phi) * c[4] * r;
      const oz = c[2] + Math.sin(phi) * Math.sin(theta) * c[3] * r;

      offsets[i * 3] = ox;
      offsets[i * 3 + 1] = oy;
      offsets[i * 3 + 2] = oz;

      scales[i] = 0.52 + Math.random() * 0.58 * (1.0 - r * 0.25);
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6.5, 0), 8.0);

    const uniforms = {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector2(0.86, 0.51).normalize() },
      uWindStrength: { value: 1.0 },
      uNightMix: { value: 0.0 },
      uSunDir: { value: new THREE.Vector3(0.42, 0.68, -0.58).normalize() },
      uFogColor: { value: new THREE.Color('#bce2f7') },
      uFogNear: { value: 26.0 },
      uFogFar: { value: 88.0 }
    };

    return { foliageGeo: geo, foliageUniforms: uniforms };
  }, []);

  const dayFog = useMemo(() => new THREE.Color('#bce2f7'), []);
  const nightFog = useMemo(() => new THREE.Color('#071324'), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const nightMix = nightMixRef.current.value;
    foliageUniforms.uTime.value = elapsed;
    foliageUniforms.uNightMix.value = nightMix;
    foliageUniforms.uFogColor.value.copy(dayFog).lerp(nightFog, nightMix);
  });

  return (
    <group position={[TREE_POSITION.x, TREE_POSITION.y - 0.25, TREE_POSITION.z]}>
      {branches.map((b, idx) => (
        <mesh key={idx} position={b.pos} rotation={b.rot} castShadow receiveShadow>
          <cylinderGeometry args={[b.radiusTop, b.radiusBottom, b.length, 9]} />
          <meshLambertMaterial color="#3c2b21" />
        </mesh>
      ))}
      <instancedMesh args={[foliageGeo, undefined, foliageCount]} frustumCulled={false}>
        <shaderMaterial
          vertexShader={FOLIAGE_VERTEX_SHADER}
          fragmentShader={FOLIAGE_FRAGMENT_SHADER}
          uniforms={foliageUniforms}
        />
      </instancedMesh>
    </group>
  );
};
