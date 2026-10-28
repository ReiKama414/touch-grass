# touch grass

**English** · [繁體中文](./README.zh-TW.md)

> An immersive **3D WebGL meadow** — GPU grass, day/night cycle, fireflies, and a procedural nature soundscape, without leaving your desk.

<p align="center">
  <a href="https://github.com/ReiKama414/touch-grass">Star</a>
  ·
  <a href="https://reikama414.vercel.app/">Portfolio</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#license--rights">License</a>
</p>

---

## Why

A calm interactive meadow for the browser: sweep the grass with the pointer, switch day and night, and listen to a synthesized breeze — no external audio files required.

## Highlights

- **GPU-instanced grass** — up to 130,000 curved blades in a custom GLSL vertex shader: rolling wind, per-blade variation, SSS rim light, cloud shadows, and distance LOD
- **Pointer interaction** — ground raycasting feeds a displacement trail so the grass parts under mouse or touch, then springs back
- **Shared terrain** — one multi-octave hill function drives terrain, grass roots, the distant tree, fireflies, and raycasting
- **Solitary tree** — procedural trunk, boughs, and wind-swaying canopy on the horizon hill
- **Day / night (GSAP)** — sunlit sky and drifting clouds ↔ indigo night, stars, and blinking fireflies
- **Procedural soundscape** — Web Audio breeze, daytime birdsong, and nighttime crickets with zero audio assets
- **Adaptive quality** — Low / Medium / High blade presets, device detection, adaptive DPR, and WebGL context recovery

## Tech stack

| Area | Choice |
| --- | --- |
| App | Vite · React · TypeScript |
| 3D | Three.js · React Three Fiber · Drei |
| Shaders | Custom GLSL (grass, sky/clouds, fireflies) |
| Motion | GSAP |
| Audio | Web Audio API (procedural) |

## Quick start

Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (default port `5173`).

Production:

```bash
npm run build
npm run preview
```

You can also open `standalone-preview.html` in a modern browser without a build server.

## Controls

| Action | Effect |
| --- | --- |
| Move pointer / finger over the meadow | Parts the grass along a velocity trail |
| **try it now** | Immersive view (starts sound if it was off) |
| **Day** / **Night** | Smooth GSAP theme transition |
| **Sound On** / **Off** | Toggle the procedural soundscape |
| **Low** / **Med** / **High** | Graphics quality (blade and firefly counts) |

## Quality presets

| Level | Blades | Fireflies |
| --- | --- | --- |
| Low | 38,000 | 75 |
| Medium | 78,000 | 140 |
| High | 130,000 | 220 |

## Project structure

| Path | Role |
| --- | --- |
| `src/App.tsx` | Canvas scene, day/night mix, soundscape wiring |
| `src/components/GrassField.tsx` | Instanced grass + pointer trail |
| `src/components/Terrain.tsx` | Rolling hills mesh |
| `src/components/SolitaryTree.tsx` | Distant procedural tree |
| `src/components/SkyAndClouds.tsx` | Sky, clouds, stars |
| `src/components/Fireflies.tsx` | Night firefly particles |
| `src/components/CameraRig.tsx` | Camera framing |
| `src/components/UI.tsx` | Brand, CTA, quality and theme controls |
| `src/shaders/` | GLSL for grass, sky/clouds, fireflies |
| `src/utils/soundscape.ts` | Procedural Web Audio nature mix |
| `src/utils/terrain.ts` | Shared hill height function |
| `src/types/scene.ts` | Theme, quality presets, device detection |

## Third-party notes

Runtime fonts load from Google Fonts (Cormorant Garamond · Inter). npm dependencies (React, Three.js, and related packages) remain under their respective upstream licenses. This does not change the All Rights Reserved terms for original code and assets in this repository.

## Links

| | |
| --- | --- |
| Repository | [touch-grass](https://github.com/ReiKama414/touch-grass) |
| Author | [ReiKama414](https://github.com/ReiKama414) |
| Portfolio | [Personal site](https://reikama414.vercel.app/) |
| License text | [LICENSE](./LICENSE) |

## License / rights

Copyright (c) ReiKama414. All rights reserved.

This project is for personal viewing and learning only. Without the copyright holder’s written consent, you may not use, copy, modify, distribute, or incorporate it into other projects (including non-commercial use).

- [GitHub](https://github.com/ReiKama414/touch-grass)
- [Personal site](https://reikama414.vercel.app/)
- [Full license text](./LICENSE)

---

<sub>Interactive meadow · ReiKama414 · 2026</sub>
