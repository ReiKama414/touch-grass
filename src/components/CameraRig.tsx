import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getTerrainHeight } from '../utils/terrain';

interface CameraRigProps {
  immersiveMode: boolean;
}

export const CameraRig: React.FC<CameraRigProps> = ({ immersiveMode }) => {
  const { camera, pointer } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0, 0));
  const currentPos = useRef(new THREE.Vector3(0, 2.35, 14.0));
  const currentLookAt = useRef(new THREE.Vector3(0, 3.1, -34.0));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.getElapsedTime();

    // Very soft, cinematic pointer parallax
    smoothPointer.current.x = THREE.MathUtils.lerp(smoothPointer.current.x, pointer.x, dt * 2.4);
    smoothPointer.current.y = THREE.MathUtils.lerp(smoothPointer.current.y, pointer.y, dt * 2.4);

    const baseZ = immersiveMode ? 11.4 : 14.0;
    const baseYOffset = immersiveMode ? 1.85 : 2.25;

    const targetX = smoothPointer.current.x * 1.35 + Math.sin(elapsed * 0.22) * 0.12;
    const targetZ = baseZ - smoothPointer.current.y * 0.45;
    const groundY = getTerrainHeight(targetX, targetZ);
    // Strictly prevent camera from ever clipping below the meadow surface
    const targetY = Math.max(groundY + 1.25, groundY + baseYOffset + smoothPointer.current.y * 0.32);

    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 2.2);
    camera.position.copy(currentPos.current);

    const lookTarget = new THREE.Vector3(
      smoothPointer.current.x * 2.2,
      3.15 + smoothPointer.current.y * 0.85,
      -36.0
    );
    currentLookAt.current.lerp(lookTarget, dt * 2.5);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
