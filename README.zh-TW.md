# touch grass

[English](./README.md) · **繁體中文**

> 沉浸式 **3D WebGL 草地** — GPU 草葉、日夜循環、螢火蟲與程序化自然聲景，不用離開書桌也能摸草

<p align="center">
  <a href="https://github.com/ReiKama414/touch-grass">Star</a>
  ·
  <a href="https://reikama414.vercel.app/">個人網站</a>
  ·
  <a href="#快速開始">快速開始</a>
  ·
  <a href="#license--權限">授權</a>
</p>

---

## 為什麼做

在瀏覽器裡放一片安靜的互動草地：用指標撥開草葉、切換日夜、聽合成微風 — 不依賴外部音訊檔

## 亮點

- **GPU 實例化草葉** — 最多約 130,000 根彎曲草葉，自訂 GLSL 頂點著色：滾動風場、每葉變化、次表面散射邊緣光、雲影與距離 LOD
- **指標互動** — 地面射線偵測餵給位移軌跡緩衝，滑鼠或觸控撥開草葉後以彈簧回復
- **共用地形** — 同一組多八度丘陵函式驅動地形、草根、遠樹、螢火蟲與射線
- **遠方孤樹** — 程序化樹幹、枝椏與隨風搖曳的樹冠，作為地平線錨點
- **日夜切換（GSAP）** — 晴空與漂移雲層 ↔ 靛藍夜空、星光與閃爍螢火蟲
- **程序化聲景** — Web Audio 微風、日間鳥鳴與夜間蟲鳴，零外部音檔
- **自適應畫質** — Low / Medium / High 草葉預設、裝置偵測、自適應 DPR 與 WebGL 情境復原

## 技術棧

| 範圍 | 選用 |
| --- | --- |
| 應用 | Vite · React · TypeScript |
| 3D | Three.js · React Three Fiber · Drei |
| 著色器 | 自訂 GLSL（草葉、天空／雲、螢火蟲） |
| 動效 | GSAP |
| 音訊 | Web Audio API（程序化） |

## 快速開始

建議 Node.js 20+

```bash
npm install
npm run dev
```

開啟 Vite 印出的本機網址（預設埠 `5173`）

正式建置：

```bash
npm run build
npm run preview
```

也可直接在現代瀏覽器開啟 `standalone-preview.html`，不必先跑建置伺服器

## 操作

| 動作 | 效果 |
| --- | --- |
| 在草地上移動指標／手指 | 沿速度軌跡撥開草葉 |
| **try it now** | 進入沉浸視角（若聲音關閉會一併開啟） |
| **Day** / **Night** | GSAP 平滑日夜轉場 |
| **Sound On** / **Off** | 切換程序化聲景 |
| **Low** / **Med** / **High** | 畫質（草葉與螢火蟲數量） |

## 畫質預設

| 等級 | 草葉 | 螢火蟲 |
| --- | --- | --- |
| Low | 38,000 | 75 |
| Medium | 78,000 | 140 |
| High | 130,000 | 220 |

## 專案結構

| 路徑 | 用途 |
| --- | --- |
| `src/App.tsx` | Canvas 場景、日夜混合、聲景接線 |
| `src/components/GrassField.tsx` | 實例化草葉與指標軌跡 |
| `src/components/Terrain.tsx` | 丘陵地形網格 |
| `src/components/SolitaryTree.tsx` | 遠方程序化樹 |
| `src/components/SkyAndClouds.tsx` | 天空、雲層、星空 |
| `src/components/Fireflies.tsx` | 夜間螢火蟲粒子 |
| `src/components/CameraRig.tsx` | 鏡頭構圖 |
| `src/components/UI.tsx` | 品牌、CTA、畫質與主題控制 |
| `src/shaders/` | 草葉、天空／雲、螢火蟲 GLSL |
| `src/utils/soundscape.ts` | 程序化 Web Audio 自然聲景 |
| `src/utils/terrain.ts` | 共用丘陵高度函式 |
| `src/types/scene.ts` | 主題、畫質預設、裝置偵測 |

## 第三方說明

執行時字型由 Google Fonts 載入（Cormorant Garamond · Inter）。npm 依賴（React、Three.js 等）仍受各自上游授權約束。上述不改變本倉庫原創程式與素材的 All Rights Reserved 條款

## 連結

| | |
| --- | --- |
| 倉庫 | [touch-grass](https://github.com/ReiKama414/touch-grass) |
| 作者 | [ReiKama414](https://github.com/ReiKama414) |
| 作品集 | [個人網站](https://reikama414.vercel.app/) |
| 授權全文 | [LICENSE](./LICENSE) |

## License / 權限

Copyright (c) ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，
不得使用、複製、修改、散布或併入其他專案（含非商業用途）

- [GitHub](https://github.com/ReiKama414/touch-grass)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<sub>互動草地 · ReiKama414 · 2026</sub>
