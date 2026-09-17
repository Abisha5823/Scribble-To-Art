import React, { useState } from 'react';
import { Pipette, Sparkles } from 'lucide-react';

interface ColorPaletteProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  recentColors: string[];
}

const PALETTE_CATEGORIES = {
  Essentials: [
    '#1e293b', // Deep Charcoal
    '#475569', // Slate Gray
    '#94a3b8', // Cool Silver
    '#78350f', // Warm Umber
    '#451a03', // Espresso
    '#f8fafc', // Soft Canvas White
  ],
  Pastels: [
    '#fbcfe8', // Soft Rose Pink
    '#fde68a', // Buttercup Yellow
    '#bbf7d0', // Mint Foam
    '#bae6fd', // Powder Sky
    '#ddd6fe', // Lavender Mist
    '#fed7aa', // Peach Cream
  ],
  Vibrant: [
    '#ef4444', // Crimson
    '#f97316', // Bright Orange
    '#eab308', // Radiant Gold
    '#10b981', // Vivid Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Cobalt Blue
    '#8b5cf6', // Violet
    '#ec4899', // Hot Pink
  ],
  Earthy: [
    '#b45309', // Terracotta
    '#854d0e', // Ochre Sand
    '#3f6212', // Olive Moss
    '#14532d', // Pine Forest
    '#1e3a8a', // Midnight Indigo
    '#831843', // Wine Plum
  ],
};

const BRUSH_SIZE_PRESETS = [3, 8, 16, 28, 48];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  opacity,
  onOpacityChange,
  recentColors,
}) => {
  const [activeTab, setActiveTab] = useState<keyof typeof PALETTE_CATEGORIES>('Pastels');

  return (
    <div
      id="color-palette-bar"
      className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-lg p-3 sm:p-4 transition-all"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Palette Category Tabs & Swatches */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl gap-1 text-xs font-medium text-stone-600">
            {(Object.keys(PALETTE_CATEGORIES) as Array<keyof typeof PALETTE_CATEGORIES>).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white text-stone-900 shadow-sm font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Swatches */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {PALETTE_CATEGORIES[activeTab].map((color) => {
              const isSelected = currentColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  id={`swatch-${color.replace('#', '')}`}
                  onClick={() => onColorChange(color)}
                  aria-label={`Select color ${color}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform border ${
                    color === '#f8fafc' ? 'border-stone-300' : 'border-black/10'
                  } ${
                    isSelected
                      ? 'scale-115 ring-2 ring-stone-900 ring-offset-2 shadow-md'
                      : 'hover:scale-108 hover:shadow'
                  }`}
                  style={{ backgroundColor: color }}
                />
              );
            })}

            {/* Custom Native Color Picker */}
            <label
              id="custom-color-picker-label"
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-stone-400 flex items-center justify-center cursor-pointer hover:border-stone-700 transition-colors group"
              title="Pick custom color"
            >
              <Pipette className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-900" />
              <input
                id="native-color-picker"
                type="color"
                value={currentColor.startsWith('#') ? currentColor : '#1f2937'}
                onChange={(e) => onColorChange(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Middle: Recent Palette Swatches */}
        {recentColors.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-stone-200">
            <span className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">
              Used
            </span>
            <div className="flex gap-1">
              {recentColors.slice(0, 6).map((col, idx) => (
                <button
                  key={`recent-${col}-${idx}`}
                  onClick={() => onColorChange(col)}
                  className="w-5 h-5 rounded-full border border-black/10 hover:scale-115 transition-transform"
                  style={{ backgroundColor: col }}
                  title={`Recent: ${col}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right: Brush Size & Opacity Controls */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full lg:w-auto justify-end">
          {/* Brush Size Presets and Preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Size</span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {BRUSH_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  id={`brush-preset-${preset}`}
                  onClick={() => onBrushSizeChange(preset)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    brushSize === preset
                      ? 'bg-white shadow-sm text-stone-900 font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={`${preset}px`}
                >
                  <span
                    className="rounded-full bg-stone-800"
                    style={{
                      width: Math.min(16, Math.max(3, preset * 0.45)),
                      height: Math.min(16, Math.max(3, preset * 0.45)),
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Range Slider for Fine Adjustment */}
            <input
              id="brush-size-slider"
              type="range"
              min="2"
              max="64"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-16 sm:w-20 accent-stone-800 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              title={`Brush size: ${brushSize}px`}
            />
            <span className="text-xs font-mono text-stone-600 min-w-[28px]">{brushSize}px</span>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Flow</span>
            <input
              id="brush-opacity-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="w-16 sm:w-20 accent-stone-800 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              title={`Opacity: ${Math.round(opacity * 100)}%`}
            />
            <span className="text-xs font-mono text-stone-600 min-w-[32px]">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {/* Active Color Preview Badge */}
          <div
            id="active-color-badge"
            className="hidden sm:flex items-center gap-2 pl-3 border-l border-stone-200"
          >
            <div
              className="w-6 h-6 rounded-full border border-stone-300 shadow-inner flex items-center justify-center"
              style={{ backgroundColor: currentColor }}
            >
              <Sparkles className="w-3 h-3 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
