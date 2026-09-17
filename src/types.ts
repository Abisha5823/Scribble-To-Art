export type PatternType =
  | 'STRAIGHT_LINE'
  | 'CURVE'
  | 'ARC'
  | 'CIRCLE'
  | 'SPIRAL'
  | 'ZIGZAG'
  | 'WAVE'
  | 'DOTS'
  | 'SCRIBBLE'
  | 'ABSTRACT'
  | 'MIXED';

export type GameMode = 'normal' | 'infinite' | 'daily';

export type DrawingTool =
  | 'pencil'
  | 'brush'
  | 'marker'
  | 'eraser'
  | 'bucket'
  | 'line'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'text';

export type FrameStyle =
  | 'walnut'
  | 'matte-black'
  | 'natural-birch'
  | 'gilded-gold'
  | 'gallery-white';

export interface ScribbleElement {
  type: 'line' | 'curve' | 'arc' | 'circle' | 'spiral' | 'zigzag' | 'wave' | 'dots' | 'scribble' | 'shape';
  points?: Array<{ x: number; y: number }>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  control?: { x: number; y: number };
  control2?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  width?: number;
  height?: number;
  sides?: number;
  strokeWidth: number;
  color?: string;
  isDotted?: boolean;
}

export interface ScribbleChallenge {
  seed: number;
  level: number;
  levelName: string;
  patternType: PatternType;
  promptHint: string;
  elements: ScribbleElement[];
  isDaily?: boolean;
  dateKey?: string;
}

export interface ArtworkRecord {
  id: string;
  level: number;
  levelName: string;
  seed: number;
  patternType: PatternType;
  title: string;
  artistName: string;
  imageData: string; // Base64 data URL
  createdAt: string;
  colorsUsed: string[];
  aiInterpretation?: string;
  tags?: string[];
  frameStyle: FrameStyle;
  isDaily?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}
