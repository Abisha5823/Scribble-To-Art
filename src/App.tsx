/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Eye,
  Infinity as InfinityIcon,
  Calendar,
  Volume2,
  VolumeX,
  Music,
  Award,
  ArrowLeft,
  Check,
  Undo2,
  Redo2,
  RotateCcw,
  Palette,
} from 'lucide-react';
import {
  DrawingTool,
  ScribbleChallenge,
  GameMode,
} from './types';
import {
  generateScribbleChallenge,
  generateRandomSeed,
  getDailySeed,
} from './utils/proceduralGenerator';
import {
  getUnlockedLevel,
  setUnlockedLevel,
  getGalleryArtworks,
} from './utils/storage';
import { soundEngine } from './utils/audio';

import { DrawingCanvas } from './components/DrawingCanvas';
import { Toolbar } from './components/Toolbar';
import { ColorPalette } from './components/ColorPalette';
import { FramedArtworkView } from './components/FramedArtworkView';
import { GalleryView } from './components/GalleryView';
import { LevelSelectView } from './components/LevelSelectView';
import { AchievementsModal } from './components/AchievementsModal';

type AppScreen = 'home' | 'level-select' | 'drawing' | 'framed' | 'gallery';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [challenge, setChallenge] = useState<ScribbleChallenge>(() =>
    generateScribbleChallenge(1, generateRandomSeed())
  );

  // Drawing tools state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('brush');
  const [currentColor, setCurrentColor] = useState<string>('#3b82f6');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [opacity, setOpacity] = useState<number>(1.0);
  const [recentColors, setRecentColors] = useState<string[]>(['#3b82f6', '#1e293b', '#ef4444']);
  const [colorsUsedInDrawing, setColorsUsedInDrawing] = useState<string[]>([]);

  // Canvas Action Register
  const canvasActionsRef = useRef<{
    undo: () => void;
    redo: () => void;
    clear: () => void;
    getArtworkDataUrl: (format?: 'png' | 'jpeg') => string;
  } | null>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [finishedArtworkDataUrl, setFinishedArtworkDataUrl] = useState<string>('');

  // Audio toggles
  const [soundOn, setSoundOn] = useState(soundEngine.getSoundEnabled());
  const [musicOn, setMusicOn] = useState(soundEngine.getMusicEnabled());
  const [showAchievements, setShowAchievements] = useState(false);

  // Track color usage
  const handleColorUsed = (col: string) => {
    setColorsUsedInDrawing((prev) => (prev.includes(col) ? prev : [...prev, col]));
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== col);
      return [col, ...filtered].slice(0, 10);
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    soundEngine.setSoundEnabled(next);
    setSoundOn(next);
    if (next) soundEngine.playClick(500);
  };

  const toggleMusic = () => {
    const next = !musicOn;
    soundEngine.setMusicEnabled(next);
    setMusicOn(next);
  };

  // Start Level with fresh procedural seed
  const startLevel = (level: number, isDaily: boolean = false) => {
    setCurrentLevel(level);
    setIsDailyChallenge(isDaily);
    setColorsUsedInDrawing([]);

    let newChallenge: ScribbleChallenge;
    if (isDaily) {
      const { seed, dateKey } = getDailySeed();
      newChallenge = generateScribbleChallenge(1, seed, true, dateKey);
    } else {
      newChallenge = generateScribbleChallenge(level, generateRandomSeed(), false);
    }

    setChallenge(newChallenge);
    setScreen('drawing');
    soundEngine.playClick(550);
  };

  // Replay Current Level with BRAND NEW procedural pattern
  const replayCurrentLevel = () => {
    startLevel(currentLevel, isDailyChallenge);
  };

  // Finish Artwork
  const handleFinishArtwork = () => {
    if (!canvasActionsRef.current) return;
    soundEngine.playClick(600);

    const dataUrl = canvasActionsRef.current.getArtworkDataUrl('png');
    setFinishedArtworkDataUrl(dataUrl);

    // Unlock next level if in normal mode
    if (!isDailyChallenge && currentLevel < 8) {
      setUnlockedLevel(currentLevel + 1);
    }

    setScreen('framed');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans select-none">
      {/* SCREEN 1: HOME SCREEN */}
      {screen === 'home' && (
        <div
          id="home-screen"
          className="min-h-screen flex flex-col justify-between items-center p-6 sm:p-12 relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black text-center"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar with Audio & Badges */}
          <div className="w-full max-w-4xl flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                A Creative Drawing Game
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="home-btn-sound"
                onClick={toggleSound}
                className={`p-2.5 rounded-xl border transition-colors ${
                  soundOn
                    ? 'bg-stone-900 border-stone-800 text-amber-400'
                    : 'bg-stone-900 border-stone-800 text-stone-600'
                }`}
                title={soundOn ? 'Sound ON' : 'Sound OFF'}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                id="home-btn-music"
                onClick={toggleMusic}
                className={`p-2.5 rounded-xl border transition-colors ${
                  musicOn
                    ? 'bg-stone-900 border-stone-800 text-amber-400'
                    : 'bg-stone-900 border-stone-800 text-stone-600'
                }`}
                title={musicOn ? 'Ambient Music ON' : 'Ambient Music OFF'}
              >
                <Music className="w-4 h-4" />
              </button>

              <button
                id="home-btn-achievements"
                onClick={() => setShowAchievements(true)}
                className="p-2.5 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-amber-400 rounded-xl transition-colors"
                title="Achievements"
              >
                <Award className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Hero Block strictly honoring user prompt */}
          <div className="my-auto max-w-xl w-full flex flex-col items-center relative z-10 py-8">
            {/* Animated Decorative Scribble Emblem */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-2xl relative group">
              <svg
                viewBox="0 0 100 100"
                className="w-12 h-12 text-amber-400 stroke-current fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round animate-pulse"
              >
                <path d="M 20,50 Q 35,20 50,50 T 80,50 Q 80,80 50,75 Q 30,70 40,40 Q 45,25 60,35 Q 75,45 60,65" />
              </svg>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-stone-100 font-bold mb-3">
              SCRIBBLE TO ART
            </h1>

            <p className="text-base sm:text-lg text-stone-300 font-serif italic mb-10 max-w-md">
              Turn a line into anything.
            </p>

            {/* Main Action Buttons */}
            <div className="w-full max-w-xs space-y-3">
              <button
                id="btn-main-play"
                onClick={() => {
                  soundEngine.playClick(600);
                  setScreen('level-select');
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-semibold rounded-2xl shadow-xl hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base hover:scale-102"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>PLAY</span>
              </button>

              <button
                id="btn-main-gallery"
                onClick={() => {
                  soundEngine.playClick(500);
                  setScreen('gallery');
                }}
                className="w-full py-3 px-6 bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-700 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm hover:scale-101"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>MY GALLERY</span>
              </button>

              <button
                id="btn-main-infinite"
                onClick={() => {
                  soundEngine.playClick(650);
                  startLevel(8, false);
                }}
                className="w-full py-3 px-6 bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-700 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm hover:scale-101"
              >
                <InfinityIcon className="w-4 h-4 text-indigo-400" />
                <span>INFINITE MODE</span>
              </button>

              {/* Daily Challenge Quick Button */}
              <button
                id="btn-main-daily"
                onClick={() => {
                  soundEngine.playClick(550);
                  startLevel(1, true);
                }}
                className="w-full py-2.5 px-4 bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border border-amber-900/50 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Today's Daily Challenge</span>
              </button>
            </div>
          </div>

          {/* Footer Quote */}
          <div className="w-full max-w-md text-center relative z-10 pt-4 border-t border-stone-900">
            <p className="text-xs text-stone-400 italic font-serif">
              “There are no wrong drawings. The player's imagination is the solution.”
            </p>
          </div>
        </div>
      )}

      {/* SCREEN 2: LEVEL PROGRESSION & MODES */}
      {screen === 'level-select' && (
        <LevelSelectView
          onBackToHome={() => setScreen('home')}
          onSelectLevel={startLevel}
          onOpenAchievements={() => setShowAchievements(true)}
        />
      )}

      {/* SCREEN 3: DRAWING SCREEN */}
      {screen === 'drawing' && (
        <div
          id="drawing-screen"
          className="min-h-screen flex flex-col justify-between bg-[#121110] text-stone-100 p-2 sm:p-4 overflow-x-hidden"
        >
          {/* Top Bar: Back | Level Name & Seed | Finish Artwork */}
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 py-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <button
                id="drawing-btn-back"
                onClick={() => {
                  soundEngine.playClick(400);
                  setScreen('level-select');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Levels</span>
              </button>

              <button
                id="drawing-btn-regenerate"
                onClick={replayCurrentLevel}
                className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded-xl transition-colors"
                title="Generate a new starting scribble"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Level Title and Creative Hint */}
            <div className="text-center px-2">
              <h2 className="text-sm sm:text-base font-serif font-bold text-stone-100 flex items-center justify-center gap-2">
                <span>{challenge.levelName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-800 text-stone-400 rounded">
                  #{challenge.seed}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-serif italic line-clamp-1 max-w-sm sm:max-w-md mx-auto">
                {challenge.promptHint}
              </p>
            </div>

            {/* Finish Artwork Button */}
            <button
              id="btn-finish-artwork"
              onClick={handleFinishArtwork}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-102"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Finish Artwork</span>
            </button>
          </div>

          {/* Middle: Canvas Stage */}
          <div className="flex-1 flex items-center justify-center my-auto py-2">
            <DrawingCanvas
              challenge={challenge}
              currentTool={currentTool}
              currentColor={currentColor}
              brushSize={brushSize}
              opacity={opacity}
              onCanUndoChange={setCanUndo}
              onCanRedoChange={setCanRedo}
              onColorUsed={handleColorUsed}
              onRegisterActions={(actions) => {
                canvasActionsRef.current = actions;
              }}
            />
          </div>

          {/* Bottom Controls: Primary Toolbar & Color Palette */}
          <div className="w-full max-w-5xl mx-auto space-y-2 pt-2">
            {/* Artistic Tools Bar */}
            <Toolbar
              currentTool={currentTool}
              onToolSelect={(tool) => {
                setCurrentTool(tool);
                soundEngine.playClick(500);
              }}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={() => canvasActionsRef.current?.undo()}
              onRedo={() => canvasActionsRef.current?.redo()}
              onClear={() => canvasActionsRef.current?.clear()}
            />

            {/* Color Palette & Brush Sizing Bar */}
            <ColorPalette
              currentColor={currentColor}
              onColorChange={(col) => {
                setCurrentColor(col);
                if (currentTool === 'eraser') setCurrentTool('brush');
                soundEngine.playClick(540);
              }}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              opacity={opacity}
              onOpacityChange={setOpacity}
              recentColors={recentColors}
            />
          </div>
        </div>
      )}

      {/* SCREEN 4: FRAMED ARTWORK VIEW */}
      {screen === 'framed' && (
        <FramedArtworkView
          imageDataUrl={finishedArtworkDataUrl}
          challenge={challenge}
          colorsUsed={colorsUsedInDrawing}
          onPlayAnother={() => {
            // If completed level N, proceed to level N+1 or next random scribble
            const nextLvl = currentLevel < 7 ? currentLevel + 1 : 8;
            startLevel(nextLvl, false);
          }}
          onGoToGallery={() => setScreen('gallery')}
        />
      )}

      {/* SCREEN 5: PERSONAL GALLERY */}
      {screen === 'gallery' && (
        <GalleryView
          onBackToHome={() => setScreen('home')}
          onStartDrawing={(lvl = 1) => startLevel(lvl, false)}
        />
      )}

      {/* ACHIEVEMENTS MODAL */}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}
    </div>
  );
}
