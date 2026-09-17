import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingTool, ScribbleChallenge } from '../types';
import { drawScribbleOnCanvas } from '../utils/proceduralGenerator';
import { soundEngine } from '../utils/audio';

interface DrawingCanvasProps {
  challenge: ScribbleChallenge;
  currentTool: DrawingTool;
  currentColor: string;
  brushSize: number;
  opacity: number;
  onCanUndoChange: (canUndo: boolean) => void;
  onCanRedoChange: (canRedo: boolean) => void;
  onColorUsed: (color: string) => void;
  onRegisterActions: (actions: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    getArtworkDataUrl: (format?: 'png' | 'jpeg') => string;
  }) => void;
}

interface Point {
  x: number;
  y: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  challenge,
  currentTool,
  currentColor,
  brushSize,
  opacity,
  onCanUndoChange,
  onCanRedoChange,
  onColorUsed,
  onRegisterActions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // History stack
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const MAX_HISTORY = 25;

  // Drawing state
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const currentPointsRef = useRef<Point[]>([]);

  // Text tool state
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Save current canvas state to undo stack
  const pushStateToUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imgData);
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = []; // clear redo on new action
    onCanUndoChange(true);
    onCanRedoChange(false);
  }, [onCanUndoChange, onCanRedoChange]);

  // Undo action
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pop current state and push to redo
    const currentState = undoStackRef.current.pop();
    if (currentState) {
      redoStackRef.current.push(currentState);
    }

    // Restore previous state
    const prevState = undoStackRef.current[undoStackRef.current.length - 1];
    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
      soundEngine.playClick(420);
    }

    onCanUndoChange(undoStackRef.current.length > 1);
    onCanRedoChange(redoStackRef.current.length > 0);
  }, [onCanUndoChange, onCanRedoChange]);

  // Redo action
  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextState = redoStackRef.current.pop();
    if (nextState) {
      undoStackRef.current.push(nextState);
      ctx.putImageData(nextState, 0, 0);
      soundEngine.playClick(580);
    }

    onCanUndoChange(true);
    onCanRedoChange(redoStackRef.current.length > 0);
  }, [onCanUndoChange, onCanRedoChange]);

  // Clear canvas back to the initial scribble
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushStateToUndo();

    // Fill with soft ivory/white background
    ctx.fillStyle = '#fbfbfa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Re-render starting scribble
    drawScribbleOnCanvas(ctx, challenge.elements, canvas.width, canvas.height);
    soundEngine.playClick(360);
  }, [challenge, pushStateToUndo]);

  // Export artwork image data URL
  const getArtworkDataUrl = useCallback((format: 'png' | 'jpeg' = 'png'): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
  }, []);

  // Register actions with parent component
  useEffect(() => {
    onRegisterActions({
      undo: handleUndo,
      redo: handleRedo,
      clear: handleClear,
      getArtworkDataUrl,
    });
  }, [handleUndo, handleRedo, handleClear, getArtworkDataUrl, onRegisterActions]);

  // Initialize Canvas dimensions and draw initial scribble
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!container || !canvas || !previewCanvas) return;

    const updateSize = () => {
      // Calculate responsive dimensions keeping ~4:3 or 16:11 aspect ratio
      const containerWidth = container.clientWidth;
      const targetWidth = Math.min(1000, Math.max(340, containerWidth));
      const targetHeight = Math.round(targetWidth * 0.72);

      setCanvasDimensions({ width: targetWidth, height: targetHeight });

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Base canvas paper tone (natural museum fine art paper)
        ctx.fillStyle = '#fbfbfa';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw initial procedural scribble
        drawScribbleOnCanvas(ctx, challenge.elements, targetWidth, targetHeight);

        // Initial snapshot for undo history
        undoStackRef.current = [ctx.getImageData(0, 0, targetWidth, targetHeight)];
        redoStackRef.current = [];
        onCanUndoChange(false);
        onCanRedoChange(false);
      }
    };

    updateSize();

    // Listen for resize
    const observer = new ResizeObserver(() => {
      // only resize if significant change to prevent losing drawing
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [challenge, onCanUndoChange, onCanRedoChange]);

  // Helper to get coordinates relative to canvas
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // BFS Flood Fill Implementation
  const performFloodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushStateToUndo();

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Parse fill color
    const dummy = document.createElement('canvas');
    dummy.width = 1;
    dummy.height = 1;
    const dCtx = dummy.getContext('2d')!;
    dCtx.fillStyle = fillColor;
    dCtx.fillRect(0, 0, 1, 1);
    const fillRgba = dCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillRgba[0];
    const fillG = fillRgba[1];
    const fillB = fillRgba[2];
    const fillA = Math.round(opacity * 255);

    const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Don't fill if color is identical
    if (
      Math.abs(targetR - fillR) < 5 &&
      Math.abs(targetG - fillG) < 5 &&
      Math.abs(targetB - fillB) < 5 &&
      Math.abs(targetA - fillA) < 10
    ) {
      return;
    }

    const colorTolerance = 32;
    const matchTarget = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) <= colorTolerance &&
        Math.abs(data[idx + 1] - targetG) <= colorTolerance &&
        Math.abs(data[idx + 2] - targetB) <= colorTolerance &&
        Math.abs(data[idx + 3] - targetA) <= colorTolerance
      );
    };

    const visited = new Uint8Array(width * height);
    const queue: number[] = [Math.floor(startX), Math.floor(startY)];

    while (queue.length > 0) {
      const cy = queue.pop()!;
      const cx = queue.pop()!;

      const pos = cy * width + cx;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const idx = pos * 4;
      if (!matchTarget(idx)) continue;

      // Color current pixel
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      // Check 4-connected neighbors
      if (cx > 0 && !visited[pos - 1]) queue.push(cx - 1, cy);
      if (cx < width - 1 && !visited[pos + 1]) queue.push(cx + 1, cy);
      if (cy > 0 && !visited[pos - width]) queue.push(cx, cy - 1);
      if (cy < height - 1 && !visited[pos + width]) queue.push(cx, cy + 1);
    }

    ctx.putImageData(imgData, 0, 0);
    onColorUsed(fillColor);
    soundEngine.playClick(640);
  };

  // Draw Shape Preview on Preview Canvas
  const drawShapeOnContext = (
    ctx: CanvasRenderingContext2D,
    tool: DrawingTool,
    start: Point,
    end: Point,
    isFinal: boolean
  ) => {
    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    if (tool === 'line') {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      const rx = Math.min(start.x, end.x);
      const ry = Math.min(start.y, end.y);
      const rw = Math.abs(start.x - end.x);
      const rh = Math.abs(start.y - end.y);
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (tool === 'circle') {
      const rx = (start.x + end.x) / 2;
      const ry = (start.y + end.y) / 2;
      const radiusX = Math.abs(end.x - start.x) / 2;
      const radiusY = Math.abs(end.y - start.y) / 2;
      ctx.ellipse(rx, ry, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'triangle') {
      const topX = (start.x + end.y) / 2;
      ctx.moveTo((start.x + end.x) / 2, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, end.y);
      ctx.closePath();
      ctx.stroke();
    } else if (tool === 'star') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const outerR = Math.hypot(end.x - start.x, end.y - start.y) / 2;
      const innerR = outerR * 0.45;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (tool === 'heart') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      const topCurveHeight = h * 0.3;

      ctx.moveTo(cx, cy + h / 2);
      ctx.bezierCurveTo(cx, cy + topCurveHeight, cx - w / 2, cy, cx - w / 2, cy - topCurveHeight);
      ctx.bezierCurveTo(cx - w / 2, cy - h / 2, cx, cy - h / 2, cx, cy - topCurveHeight / 2);
      ctx.bezierCurveTo(cx, cy - h / 2, cx + w / 2, cy - h / 2, cx + w / 2, cy - topCurveHeight);
      ctx.bezierCurveTo(cx + w / 2, cy, cx, cy + topCurveHeight, cx, cy + h / 2);
      ctx.stroke();
    }

    ctx.restore();
    if (isFinal) {
      onColorUsed(currentColor);
    }
  };

  // Stamp Text onto Canvas
  const commitTextToCanvas = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushStateToUndo();

    ctx.save();
    ctx.font = `600 ${Math.max(16, brushSize * 1.5)}px 'Outfit', sans-serif`;
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = opacity;
    ctx.fillText(textInputValue, textInputPos.x, textInputPos.y);
    ctx.restore();

    onColorUsed(currentColor);
    soundEngine.playClick(600);
    setTextInputPos(null);
    setTextInputValue('');
  };

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pt = getCanvasCoordinates(e);

    if (currentTool === 'text') {
      if (textInputPos) {
        commitTextToCanvas();
      }
      setTextInputPos(pt);
      return;
    }

    if (currentTool === 'bucket') {
      performFloodFill(pt.x, pt.y, currentColor);
      return;
    }

    isDrawingRef.current = true;
    startPointRef.current = pt;
    currentPointsRef.current = [pt];

    const isShapeTool = ['line', 'rect', 'circle', 'triangle', 'star', 'heart'].includes(currentTool);

    if (!isShapeTool) {
      pushStateToUndo();
      soundEngine.playStrokeSound();

      // Begin continuous stroke
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = currentTool === 'marker' ? 'multiply' : 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.globalAlpha = currentTool === 'marker' ? opacity * 0.7 : opacity;
        onColorUsed(currentColor);
      }

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;

    const pt = getCanvasCoordinates(e);
    const startPt = startPointRef.current;
    if (!startPt) return;

    const isShapeTool = ['line', 'rect', 'circle', 'triangle', 'star', 'heart'].includes(currentTool);

    if (isShapeTool) {
      // Clear preview canvas and render live dragging shape preview
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      const pCtx = previewCanvas.getContext('2d');
      if (!pCtx) return;

      pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      drawShapeOnContext(pCtx, currentTool, startPt, pt, false);
    } else {
      // Freehand drawing stroke with smooth quadratic bezier curves
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pts = currentPointsRef.current;
      pts.push(pt);

      ctx.save();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = currentTool === 'marker' ? 'multiply' : 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.globalAlpha = currentTool === 'marker' ? opacity * 0.7 : opacity;
      }

      if (pts.length >= 3) {
        const xc = (pts[pts.length - 2].x + pts[pts.length - 1].x) / 2;
        const yc = (pts[pts.length - 2].y + pts[pts.length - 1].y) / 2;
        ctx.beginPath();
        ctx.moveTo(
          (pts[pts.length - 3].x + pts[pts.length - 2].x) / 2,
          (pts[pts.length - 3].y + pts[pts.length - 2].y) / 2
        );
        ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, xc, yc);
        ctx.stroke();
      }

      ctx.restore();
      soundEngine.playStrokeSound();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pt = getCanvasCoordinates(e);
    const startPt = startPointRef.current;
    const isShapeTool = ['line', 'rect', 'circle', 'triangle', 'star', 'heart'].includes(currentTool);

    if (isShapeTool && startPt) {
      // Commit shape to main canvas
      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;
      if (canvas && previewCanvas) {
        const ctx = canvas.getContext('2d');
        const pCtx = previewCanvas.getContext('2d');
        if (ctx && pCtx) {
          pushStateToUndo();
          drawShapeOnContext(ctx, currentTool, startPt, pt, true);
          pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          soundEngine.playClick(500);
        }
      }
    }

    startPointRef.current = null;
    currentPointsRef.current = [];
  };

  return (
    <div
      ref={containerRef}
      id="drawing-canvas-container"
      className="relative w-full max-w-5xl mx-auto flex items-center justify-center p-2 sm:p-4 select-none touch-none"
    >
      {/* Outer Paper Texture & Subtle Art Border */}
      <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-stone-300/80 bg-[#fbfbfa] p-1 sm:p-2 transition-all">
        <canvas
          ref={canvasRef}
          id="main-artwork-canvas"
          className="block rounded-xl cursor-crosshair touch-none"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        {/* Overlay Preview Canvas for Shapes & Text */}
        <canvas
          ref={previewCanvasRef}
          id="preview-artwork-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-1 sm:inset-2 block rounded-xl cursor-crosshair touch-none"
          style={{
            width: 'calc(100% - 8px)',
            height: 'calc(100% - 8px)',
          }}
        />

        {/* In-Canvas Text Tool Floating Input */}
        {textInputPos && (
          <div
            id="canvas-text-input-box"
            className="absolute z-20 bg-white/95 backdrop-blur shadow-xl border border-stone-300 p-2 rounded-xl flex items-center gap-2"
            style={{
              left: `${(textInputPos.x / canvasDimensions.width) * 100}%`,
              top: `${(textInputPos.y / canvasDimensions.height) * 100}%`,
              transform: 'translate(-10%, -120%)',
            }}
          >
            <input
              type="text"
              id="artwork-text-field"
              value={textInputValue}
              autoFocus
              placeholder="Type text..."
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTextToCanvas();
                if (e.key === 'Escape') setTextInputPos(null);
              }}
              className="px-2 py-1 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
            <button
              onClick={commitTextToCanvas}
              className="px-2.5 py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              Stamp
            </button>
            <button
              onClick={() => setTextInputPos(null)}
              className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
