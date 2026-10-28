import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, getTerrainNormal, smoothNoise2D } from '../utils/terrain';

interface TerrainProps {
  segments: number;
  nightMix: number;
}

export const Terrain: React.FC<TerrainProps> = ({ segments, nightMix }) => {
  const geometry = useMemo(() => {
    const size = 190;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position;
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);
    const normal = new THREE.Vector3();

    const lowColor = new THREE.Color('#1d4b1e');
    const midColor = new THREE.Color('#2c6927');
    const highColor = new THREE.Color('#478932');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = getTerrainHeight(x, z);
      posAttr.setY(i, y);

      getTerrainNormal(x, z, normal);
      geo.attributes.normal.setXYZ(i, normal.x, normal.y, normal.z);

      // Subtle natural green gradient based on elevation and organic noise
      const hNorm = THREE.MathUtils.clamp((y + 1.5) / 7.0, 0, 1);
      const patch = smoothNoise2D(x * 0.06, z * 0.06);
      tempColor.copy(lowColor).lerp(midColor, THREE.MathUtils.smoothstep(hNorm, 0.0, 0.55));
      tempColor.lerp(highColor, THREE.MathUtils.smoothstep(hNorm, 0.45, 1.0) * (0.6 + 0.4 * patch));

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [segments]);

  const terrainEmissive = useMemo(() => {
    return new THREE.Color('#07121e').multiplyScalar(nightMix * 0.4);
  }, [nightMix]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial
        vertexColors
        emissive={terrainEmissive}
      />
    </mesh>
  );
};
