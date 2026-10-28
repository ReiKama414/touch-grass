import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  SKY_VERTEX_SHADER,
  SKY_FRAGMENT_SHADER,
  CLOUD_VERTEX_SHADER,
  CLOUD_FRAGMENT_SHADER
} from '../shaders/skyCloudShaders';

interface SkyAndCloudsProps {
  nightMixRef: React.MutableRefObject<{ value: number }>;
}

export const SkyAndClouds: React.FC<SkyAndCloudsProps> = ({ nightMixRef }) => {
  const skyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNightMix: { value: 0.0 },
      uSunPos: { value: new THREE.Vector3(38, 42, -75) },
      uMoonPos: { value: new THREE.Vector3(-28, 36, -78) },
      uDayZenith: { value: new THREE.Color('#3b86e0') },
      uDayHorizon: { value: new THREE.Color('#cbe8fa') },
      uNightZenith: { value: new THREE.Color('#040b18') },
      uNightHorizon: { value: new THREE.Color('#0e223d') }
    }),
    []
  );

  const cloudUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNightMix: { value: 0.0 }
    }),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const nightMix = nightMixRef.current.value;
    skyUniforms.uTime.value = elapsed;
    skyUniforms.uNightMix.value = nightMix;
    cloudUniforms.uTime.value = elapsed;
    cloudUniforms.uNightMix.value = nightMix;
  });

  return (
    <group>
      {/* Atmospheric Sky Dome */}
      <mesh scale={[140, 140, 140]}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* High Volumetric-Style Drifting Cloud Layer */}
      <mesh position={[0, 34, -26]} rotation={[-Math.PI * 0.47, 0, 0]}>
        <planeGeometry args={[185, 130, 1, 1]} />
        <shaderMaterial
          vertexShader={CLOUD_VERTEX_SHADER}
          fragmentShader={CLOUD_FRAGMENT_SHADER}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
