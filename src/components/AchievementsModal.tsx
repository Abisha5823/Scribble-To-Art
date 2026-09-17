import React from 'react';
import {
  X,
  Sparkles,
  Palette,
  Sun,
  Brush,
  Layers,
  Award,
  Trophy,
  Infinity,
  Calendar,
  Frame,
  CheckCircle2,
} from 'lucide-react';
import { getAchievements } from '../utils/storage';
import { Achievement } from '../types';

interface AchievementsModalProps {
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Palette,
  Sun,
  Brush,
  Layers,
  Award,
  Trophy,
  Infinity,
  Calendar,
  Frame,
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const achievements = getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div
      id="achievements-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-400 font-mono font-semibold">
              Creative Milestones
            </span>
            <h2 className="text-xl font-serif text-stone-100 font-bold">
              Artistic Achievements
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white bg-stone-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="py-3">
          <div className="flex justify-between text-xs text-stone-400 mb-1.5">
            <span>Progress</span>
            <span className="font-mono text-amber-400 font-bold">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Badges List */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 my-2">
          {achievements.map((ach: Achievement) => {
            const isUnlocked = Boolean(ach.unlockedAt);
            const Icon = ICON_MAP[ach.iconName] || Award;

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  isUnlocked
                    ? 'bg-stone-800/80 border-amber-500/30'
                    : 'bg-stone-950/60 border-stone-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-md'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isUnlocked ? 'text-stone-100' : 'text-stone-400'
                      }`}
                    >
                      {ach.title}
                    </h4>
                    {isUnlocked && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-400 leading-snug mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-stone-800 text-center">
          <p className="text-[11px] text-stone-500">
            Every drawing you create expands your artistic expression.
          </p>
        </div>
      </div>
    </div>
  );
};
