import React, { useState } from 'react';
import {
  Pencil,
  Brush,
  Highlighter,
  Eraser,
  PaintBucket,
  Shapes,
  Type,
  Undo2,
  Redo2,
  RotateCcw,
  Minus,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
} from 'lucide-react';
import { DrawingTool } from '../types';

interface ToolbarProps {
  currentTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const PRIMARY_TOOLS: Array<{ id: DrawingTool; label: string; icon: React.ElementType }> = [
  { id: 'pencil', label: 'Pencil', icon: Pencil },
  { id: 'brush', label: 'Brush', icon: Brush },
  { id: 'marker', label: 'Marker', icon: Highlighter },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'bucket', label: 'Fill', icon: PaintBucket },
  { id: 'text', label: 'Text', icon: Type },
];

const SHAPE_OPTIONS: Array<{ id: DrawingTool; label: string; icon: React.ElementType }> = [
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'heart', label: 'Heart', icon: Heart },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isShapeActive = SHAPE_OPTIONS.some((s) => s.id === currentTool);

  return (
    <div
      id="artistic-toolbar"
      className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-lg p-2.5 sm:p-3"
    >
      {/* Primary Drawing Tools */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {PRIMARY_TOOLS.map(({ id, label, icon: Icon }) => {
          const isActive = currentTool === id;
          return (
            <button
              key={id}
              id={`tool-${id}`}
              onClick={() => {
                onToolSelect(id);
                setShowShapeMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-stone-900 text-white shadow-sm font-semibold scale-102'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}

        {/* Shapes Dropdown Tool */}
        <div className="relative">
          <button
            id="tool-shapes-toggle"
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isShapeActive
                ? 'bg-stone-900 text-white shadow-sm font-semibold scale-102'
                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Shapes className="w-4 h-4" />
            <span className="hidden sm:inline">Shapes</span>
          </button>

          {showShapeMenu && (
            <div
              id="shapes-menu-dropdown"
              className="absolute bottom-full mb-2 left-0 bg-white/98 backdrop-blur shadow-xl border border-stone-200 rounded-xl p-1.5 flex gap-1 z-30"
            >
              {SHAPE_OPTIONS.map(({ id, label, icon: ShapeIcon }) => (
                <button
                  key={id}
                  id={`shape-${id}`}
                  onClick={() => {
                    onToolSelect(id);
                    setShowShapeMenu(false);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    currentTool === id
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  title={label}
                >
                  <ShapeIcon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History & Canvas Management Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-l border-stone-200 pl-2 sm:pl-3">
        <button
          id="btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-xl transition-all ${
            canUndo
              ? 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              : 'text-stone-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          id="btn-redo"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-xl transition-all ${
            canRedo
              ? 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              : 'text-stone-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Clear Canvas with Quick Confirmation */}
        <div className="relative">
          <button
            id="btn-clear"
            onClick={() => setShowClearConfirm(!showClearConfirm)}
            className="p-2 rounded-xl text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
            title="Reset to starting scribble"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {showClearConfirm && (
            <div
              id="clear-confirm-popover"
              className="absolute bottom-full right-0 mb-2 bg-white/98 backdrop-blur shadow-xl border border-stone-200 rounded-xl p-3 z-30 min-w-[200px]"
            >
              <p className="text-xs text-stone-700 mb-2 font-medium">
                Reset drawing back to the initial scribble?
              </p>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClear();
                    setShowClearConfirm(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
