import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  detectOptimalQuality,
  QUALITY_PRESETS,
  QualityLevel,
  ThemeMode
} from './types/scene';
import { Terrain } from './components/Terrain';
import { GrassField } from './components/GrassField';
import { SolitaryTree } from './components/SolitaryTree';
import { SkyAndClouds } from './components/SkyAndClouds';
import { Fireflies } from './components/Fireflies';
import { CameraRig } from './components/CameraRig';
import { UI } from './components/UI';
import { NatureSoundscape } from './utils/soundscape';

export default function App() {
  const [mode, setMode] = useState<ThemeMode>('day');
  const [quality, setQuality] = useState<QualityLevel>(() => detectOptimalQuality());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [immersiveMode, setImmersiveMode] = useState<boolean>(false);
  const [nightMixState, setNightMixState] = useState<number>(0);

  const nightMixRef = useRef({ value: 0 });
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const soundscape = useMemo(() => new NatureSoundscape(), []);

  useEffect(() => {
    return () => {
      soundscape.dispose();
    };
  }, [soundscape]);

  // Smooth GSAP Day / Night transition
  const handleModeChange = (nextMode: ThemeMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    soundscape.setMode(nextMode);

    const targetMix = nextMode === 'night' ? 1.0 : 0.0;
    gsap.to(nightMixRef.current, {
      value: targetMix,
      duration: 2.3,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = nightMixRef.current.value;
        setNightMixState(v);
        if (dirLightRef.current) {
          dirLightRef.current.intensity = THREE.MathUtils.lerp(1.45, 0.38, v);
          dirLightRef.current.color.setHSL(
            THREE.MathUtils.lerp(0.11, 0.59, v),
            THREE.MathUtils.lerp(0.75, 0.55, v),
            THREE.MathUtils.lerp(0.95, 0.72, v)
          );
        }
        if (hemiLightRef.current) {
          hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.85, 0.28, v);
        }
      }
    });
  };

  const handleToggleSound = () => {
    const next = soundscape.toggle();
    setSoundEnabled(next);
  };

  const handleToggleImmersive = () => {
    const next = !immersiveMode;
    setImmersiveMode(next);
    if (next && !soundEnabled) {
      const started = soundscape.toggle(true);
      setSoundEnabled(started);
    }
  };

  const preset = QUALITY_PRESETS[quality];

  return (
    <div className="app-shell">
      <Canvas
        dpr={[1, preset.maxDpr]}
        camera={{ position: [0, 2.35, 14], fov: 46, near: 0.2, far: 220 }}
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          const dom = gl.domElement;
          dom.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
          });
        }}
      >
        <hemisphereLight
          ref={hemiLightRef}
          args={['#cfeaff', '#274c22', 0.85]}
        />
        <directionalLight
          ref={dirLightRef}
          position={[38, 42, -75]}
          intensity={1.45}
          color="#fff6e0"
        />

        <SkyAndClouds nightMixRef={nightMixRef} />
        <Terrain segments={preset.terrainSegments} nightMix={nightMixState} />
        <GrassField
          bladeCount={preset.bladeCount}
          nightMixRef={nightMixRef}
          onRustle={(speed) => soundscape.triggerRustle(speed)}
        />
        <SolitaryTree nightMixRef={nightMixRef} />
        <Fireflies count={preset.fireflyCount} nightMixRef={nightMixRef} />
        <CameraRig immersiveMode={immersiveMode} />
      </Canvas>

      <UI
        mode={mode}
        onChangeMode={handleModeChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        quality={quality}
        onChangeQuality={setQuality}
        immersiveMode={immersiveMode}
        onToggleImmersive={handleToggleImmersive}
      />
    </div>
  );
}
