import React from 'react';
import { QualityLevel, ThemeMode } from '../types/scene';

interface UIProps {
  mode: ThemeMode;
  onChangeMode: (mode: ThemeMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  quality: QualityLevel;
  onChangeQuality: (q: QualityLevel) => void;
  immersiveMode: boolean;
  onToggleImmersive: () => void;
}

export const UI: React.FC<UIProps> = ({
  mode,
  onChangeMode,
  soundEnabled,
  onToggleSound,
  quality,
  onChangeQuality,
  immersiveMode,
  onToggleImmersive
}) => {
  return (
    <div className={`ui-layer ${mode === 'night' ? 'is-night' : 'is-day'}`}>
      {/* Top Bar */}
      <header className="top-nav">
        <button
          type="button"
          className="brand-mark"
          onClick={() => immersiveMode && onToggleImmersive()}
          title="Return to overview"
        >
          touch grass
        </button>

        <div className="quality-switcher" role="group" aria-label="Graphics Quality">
          {(['low', 'medium', 'high'] as QualityLevel[]).map((q) => (
            <button
              key={q}
              type="button"
              className={`quality-btn ${quality === q ? 'active' : ''}`}
              onClick={() => onChangeQuality(q)}
            >
              {q === 'low' ? 'Low' : q === 'medium' ? 'Med' : 'High'}
            </button>
          ))}
        </div>
      </header>

      {/* Center Hero Title */}
      <main className={`hero-center ${immersiveMode ? 'is-minimized' : ''}`}>
        <h1 className="hero-title">touch grass</h1>
        <p className="hero-subtitle">without leaving your desk</p>
        <button
          type="button"
          className="cta-button"
          onClick={onToggleImmersive}
        >
          {immersiveMode ? 'back to view' : 'try it now'}
        </button>
      </main>

      {/* Bottom Control Bar */}
      <footer className="bottom-controls">
        <div className="control-pill">
          <button
            type="button"
            className={`pill-btn ${mode === 'day' ? 'active' : ''}`}
            onClick={() => onChangeMode('day')}
          >
            Day
          </button>
          <span className="pill-divider" aria-hidden="true" />
          <button
            type="button"
            className={`pill-btn ${mode === 'night' ? 'active' : ''}`}
            onClick={() => onChangeMode('night')}
          >
            Night
          </button>
          <span className="pill-divider" aria-hidden="true" />
          <button
            type="button"
            className={`pill-btn sound-btn ${soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
          >
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
      </footer>
    </div>
  );
};
