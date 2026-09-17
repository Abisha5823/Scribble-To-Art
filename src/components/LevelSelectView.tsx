import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Sparkles,
  Infinity,
  Calendar,
  Volume2,
  VolumeX,
  Music,
  Award,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LEVELS_CONFIG } from '../utils/proceduralGenerator';
import { getUnlockedLevel, getGalleryArtworks } from '../utils/storage';
import { soundEngine } from '../utils/audio';

interface LevelSelectViewProps {
  onBackToHome: () => void;
  onSelectLevel: (level: number, isDaily?: boolean) => void;
  onOpenAchievements: () => void;
}

export const LevelSelectView: React.FC<LevelSelectViewProps> = ({
  onBackToHome,
  onSelectLevel,
  onOpenAchievements,
}) => {
  const unlockedLevel = getUnlockedLevel();
  const artworks = getGalleryArtworks();

  const [soundOn, setSoundOn] = useState(soundEngine.getSoundEnabled());
  const [musicOn, setMusicOn] = useState(soundEngine.getMusicEnabled());

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

  return (
    <div
      id="level-select-screen"
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-4 sm:p-8"
    >
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-home"
            onClick={onBackToHome}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">Select Level</h1>
            <p className="text-xs text-stone-400">
              Each attempt generates a new, never-before-seen starting scribble
            </p>
          </div>
        </div>

        {/* Audio Toggles and Achievements */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-colors ${
              soundOn
                ? 'bg-stone-800 text-amber-400 hover:bg-stone-700'
                : 'bg-stone-900 text-stone-500 hover:bg-stone-800'
            }`}
            title={soundOn ? 'Sound Effects ON' : 'Sound Effects OFF'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-toggle-music"
            onClick={toggleMusic}
            className={`p-2 rounded-xl transition-colors ${
              musicOn
                ? 'bg-stone-800 text-amber-400 hover:bg-stone-700'
                : 'bg-stone-900 text-stone-500 hover:bg-stone-800'
            }`}
            title={musicOn ? 'Ambient Music ON' : 'Ambient Music OFF'}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            id="btn-open-achievements"
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-xl border border-stone-800 transition-colors"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Badges</span>
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="w-full max-w-5xl mx-auto flex-1 py-8 space-y-8">
        {/* Special Modes: Daily Challenge & Infinite Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Challenge Card */}
          <div
            id="card-daily-challenge"
            onClick={() => {
              soundEngine.playClick(550);
              onSelectLevel(1, true);
            }}
            className="group cursor-pointer bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border border-amber-900/40 hover:border-amber-500/60 p-5 rounded-2xl transition-all hover:scale-101 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Daily Challenge
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full">
                  Today's Canvas
                </span>
              </div>
              <h3 className="text-xl font-serif text-stone-100 font-bold group-hover:text-amber-300 transition-colors">
                The Universal Scribble
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Every artist in the world receives the exact same starting pattern today. How will your imagination interpret it?
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Start Daily Challenge</span>
              <Play className="w-4 h-4 fill-current group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Infinite Mode Card */}
          <div
            id="card-infinite-mode"
            onClick={() => {
              soundEngine.playClick(600);
              onSelectLevel(8, false);
            }}
            className="group cursor-pointer bg-gradient-to-br from-indigo-950/40 via-stone-900 to-stone-900 border border-indigo-900/40 hover:border-indigo-500/60 p-5 rounded-2xl transition-all hover:scale-101 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-semibold flex items-center gap-1.5">
                  <Infinity className="w-3.5 h-3.5" />
                  Infinite Mode
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full">
                  Boundless
                </span>
              </div>
              <h3 className="text-xl font-serif text-stone-100 font-bold group-hover:text-indigo-300 transition-colors">
                Unconstrained Freedom
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Completely randomized line configurations, spirals, and scribbles. Endless prompts for endless curiosity.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Enter Infinite Mode</span>
              <Play className="w-4 h-4 fill-current group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Sequential Level Progress Track */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif tracking-wide text-stone-200">The Guided Journey</h2>
            <span className="text-xs text-stone-500">
              {Math.min(unlockedLevel, LEVELS_CONFIG.length)} of {LEVELS_CONFIG.length} unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEVELS_CONFIG.map((lvl) => {
              const isUnlocked = lvl.level <= unlockedLevel;
              const isCompleted = lvl.level < unlockedLevel || artworks.some((a) => a.level === lvl.level);
              const countDone = artworks.filter((a) => a.level === lvl.level).length;

              return (
                <div
                  key={lvl.level}
                  id={`level-card-${lvl.level}`}
                  onClick={() => {
                    if (isUnlocked) {
                      soundEngine.playClick(500);
                      onSelectLevel(lvl.level, false);
                    }
                  }}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isUnlocked
                      ? 'bg-stone-900 border-stone-800 hover:border-amber-500/60 hover:bg-stone-850 cursor-pointer hover:scale-101 shadow-md'
                      : 'bg-stone-950 border-stone-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-stone-800 flex items-center justify-center font-mono text-xs font-bold text-amber-400">
                      {lvl.level}
                    </span>

                    {isCompleted ? (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    ) : isUnlocked ? (
                      <span className="text-[11px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-medium">
                        Available
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-stone-500">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-100 mb-1">
                    {lvl.name}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed min-h-[36px]">
                    {lvl.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[10px]">
                      {countDone > 0 ? `${countDone} created` : 'No drawings yet'}
                    </span>

                    {isUnlocked && (
                      <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:underline">
                        {countDone > 0 ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Replay</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
