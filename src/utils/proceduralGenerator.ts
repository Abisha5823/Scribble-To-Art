import { PatternType, ScribbleChallenge, ScribbleElement } from '../types';

/**
 * Seeded PRNG using Mulberry32
 */
export function createPRNG(seed: number) {
  let s = Math.floor(seed) || 123456789;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 10000000) + 1;
}

export function getDailySeed(): { seed: number; dateKey: string } {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  return { seed: Math.abs(hash) + 42000, dateKey };
}

export interface LevelMeta {
  level: number;
  name: string;
  subtitle: string;
  patternType: PatternType;
  description: string;
}

export const LEVELS_CONFIG: LevelMeta[] = [
  {
    level: 1,
    name: 'Simple Lines',
    subtitle: 'A humble beginning',
    patternType: 'STRAIGHT_LINE',
    description: 'A few simple lines and arcs waiting to find their story.',
  },
  {
    level: 2,
    name: 'Flowing Curves',
    subtitle: 'Rhythm and motion',
    patternType: 'CURVE',
    description: 'Curved strokes, waves, and arcs that invite organic transformation.',
  },
  {
    level: 3,
    name: 'Geometric Play',
    subtitle: 'Angles & Volumes',
    patternType: 'CIRCLE',
    description: 'Circles, triangles, and irregular shapes to build upon.',
  },
  {
    level: 4,
    name: 'The Wild Scribble',
    subtitle: 'Pure energy',
    patternType: 'SCRIBBLE',
    description: 'A loose, spontaneous scribble filled with hidden characters and scenes.',
  },
  {
    level: 5,
    name: 'Multiple Vectors',
    subtitle: 'Connecting threads',
    patternType: 'MIXED',
    description: 'Random lines across the canvas ready to be connected into landscapes or structures.',
  },
  {
    level: 6,
    name: 'Abstract Mystery',
    subtitle: 'Surreal harmony',
    patternType: 'ABSTRACT',
    description: 'An unexpected collision of spirals, dots, and contours.',
  },
  {
    level: 7,
    name: 'Advanced Canvas',
    subtitle: 'The master challenge',
    patternType: 'MIXED',
    description: 'Intricate multi-layered patterns offering infinite creative branches.',
  },
];

/**
 * Generate a procedural scribble challenge for a given level and seed
 */
export function generateScribbleChallenge(
  level: number,
  seed: number = generateRandomSeed(),
  isDaily: boolean = false,
  dateKey?: string
): ScribbleChallenge {
  const rand = createPRNG(seed);
  const elements: ScribbleElement[] = [];

  // Canvas bounds (800 x 600 base coordinate space)
  const width = 800;
  const height = 600;
  const padX = 140;
  const padY = 120;

  const randX = (min = padX, max = width - padX) => min + rand() * (max - min);
  const randY = (min = padY, max = height - padY) => min + rand() * (max - min);
  const randInt = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));
  const randFloat = (min: number, max: number) => min + rand() * (max - min);

  // Line thickness in dark charcoal tone
  const primaryStroke = () => randFloat(3, 5.5);
  const primaryColor = '#1f2937';

  let patternType: PatternType = 'ABSTRACT';
  let levelName = 'Infinite Mode';
  let promptHint = 'Let your curiosity wander and transform these marks.';

  if (isDaily) {
    levelName = 'Daily Challenge';
    promptHint = "Today's universal canvas — every artist sees something different.";
    // Daily combines interesting scribble, curve, and geometric element
    patternType = 'ABSTRACT';
    createAbstractLevel(elements, rand, randX, randY, randFloat, randInt, primaryStroke, primaryColor);
  } else if (level === 1) {
    levelName = 'Level 1: Simple Lines';
    patternType = 'STRAIGHT_LINE';
    promptHint = 'What could this simple line become? A leaf, a smile, a skyline?';

    // 1 straight line
    elements.push({
      type: 'line',
      start: { x: randX(180, 360), y: randY(160, 440) },
      end: { x: randX(420, 640), y: randY(160, 440) },
      strokeWidth: primaryStroke(),
      color: primaryColor,
    });

    // 1 curved line or arc
    elements.push({
      type: 'curve',
      start: { x: randX(200, 380), y: randY(200, 450) },
      end: { x: randX(420, 620), y: randY(200, 450) },
      control: { x: randX(250, 550), y: randY(100, 500) },
      strokeWidth: primaryStroke(),
      color: primaryColor,
    });

    // 1 gentle simple shape or arc
    if (rand() > 0.4) {
      elements.push({
        type: 'arc',
        center: { x: randX(300, 500), y: randY(200, 400) },
        radius: randFloat(35, 75),
        startAngle: randFloat(0, Math.PI),
        endAngle: randFloat(Math.PI, Math.PI * 2),
        strokeWidth: primaryStroke(),
        color: primaryColor,
      });
    }
  } else if (level === 2) {
    levelName = 'Level 2: Flowing Curves';
    patternType = 'CURVE';
    promptHint = 'A curve could be a wave, the back of a cat, or distant hills.';

    const count = randInt(2, 3);
    for (let i = 0; i < count; i++) {
      elements.push({
        type: 'curve',
        start: { x: randX(160, 400), y: randY(150, 480) },
        end: { x: randX(400, 660), y: randY(150, 480) },
        control: { x: randX(200, 600), y: randY(100, 520) },
        control2: { x: randX(200, 600), y: randY(100, 520) },
        strokeWidth: primaryStroke(),
        color: primaryColor,
      });
    }

    if (rand() > 0.3) {
      // Add a spiral or wave
      elements.push({
        type: 'spiral',
        center: { x: randX(260, 540), y: randY(180, 420) },
        radius: randFloat(40, 75),
        strokeWidth: primaryStroke(),
        color: primaryColor,
      });
    }
  } else if (level === 3) {
    levelName = 'Level 3: Geometric Play';
    patternType = 'CIRCLE';
    promptHint = 'A circle can be an eye, a wheel, a planet, or a cup of tea.';

    const numShapes = randInt(2, 4);
    for (let i = 0; i < numShapes; i++) {
      const shapeType = rand();
      const cx = randX(200, 600);
      const cy = randY(160, 440);

      if (shapeType < 0.4) {
        // Circle
        elements.push({
          type: 'circle',
          center: { x: cx, y: cy },
          radius: randFloat(30, 70),
          strokeWidth: primaryStroke(),
          color: primaryColor,
        });
      } else if (shapeType < 0.7) {
        // Triangle
        elements.push({
          type: 'shape',
          center: { x: cx, y: cy },
          radius: randFloat(40, 80),
          sides: 3,
          strokeWidth: primaryStroke(),
          color: primaryColor,
        });
      } else {
        // Irregular polygon
        const sides = randInt(4, 5);
        elements.push({
          type: 'shape',
          center: { x: cx, y: cy },
          radius: randFloat(35, 70),
          sides,
          strokeWidth: primaryStroke(),
          color: primaryColor,
        });
      }
    }
  } else if (level === 4) {
    levelName = 'Level 4: The Wild Scribble';
    patternType = 'SCRIBBLE';
    promptHint = 'Squint your eyes! What hidden animal or scene emerges from this scribble?';

    const scribbleTypes = ['dense', 'spiral', 'loose'];
    const selectedScribble = scribbleTypes[randInt(0, scribbleTypes.length - 1)];

    elements.push(
      generateScribbleElement(
        rand,
        randX(280, 520),
        randY(200, 400),
        selectedScribble,
        primaryStroke(),
        primaryColor
      )
    );

    // Optional second small scribble satellite
    if (rand() > 0.5) {
      elements.push(
        generateScribbleElement(
          rand,
          randX(200, 600),
          randY(160, 440),
          'loose',
          primaryStroke() * 0.85,
          primaryColor
        )
      );
    }
  } else if (level === 5) {
    levelName = 'Level 5: Multiple Lines';
    patternType = 'MIXED';
    promptHint = 'Multiple lines across space. Connect them or build a city around them.';

    const lineCount = randInt(4, 7);
    for (let i = 0; i < lineCount; i++) {
      if (rand() > 0.35) {
        elements.push({
          type: 'line',
          start: { x: randX(140, 660), y: randY(120, 480) },
          end: { x: randX(140, 660), y: randY(120, 480) },
          strokeWidth: randFloat(2.5, 5),
          color: primaryColor,
        });
      } else {
        elements.push({
          type: 'curve',
          start: { x: randX(160, 640), y: randY(140, 460) },
          end: { x: randX(160, 640), y: randY(140, 460) },
          control: { x: randX(160, 640), y: randY(140, 460) },
          strokeWidth: randFloat(2.5, 5),
          color: primaryColor,
        });
      }
    }
  } else if (level === 6) {
    levelName = 'Level 6: Abstract Mystery';
    patternType = 'ABSTRACT';
    promptHint = 'An enigmatic composition of curves, points, and spirals.';
    createAbstractLevel(elements, rand, randX, randY, randFloat, randInt, primaryStroke, primaryColor);
  } else if (level === 7) {
    levelName = 'Level 7: Advanced Creativity';
    patternType = 'MIXED';
    promptHint = 'A rich tapestry of lines. Combine tools, colors, and fills to complete it.';
    createAdvancedLevel(elements, rand, randX, randY, randFloat, randInt, primaryStroke, primaryColor);
  } else {
    // Level 8+ or Infinite Mode
    levelName = `Infinite Mode • Challenge #${seed % 999 + 1}`;
    const allPatterns: PatternType[] = [
      'CURVE',
      'ARC',
      'CIRCLE',
      'SPIRAL',
      'ZIGZAG',
      'WAVE',
      'SCRIBBLE',
      'ABSTRACT',
      'MIXED',
    ];
    patternType = allPatterns[randInt(0, allPatterns.length - 1)];
    promptHint = 'No rules, no limits. Turn this spontaneous seed into your masterpiece.';
    createAdvancedLevel(elements, rand, randX, randY, randFloat, randInt, primaryStroke, primaryColor);
  }

  return {
    seed,
    level,
    levelName,
    patternType,
    promptHint,
    elements,
    isDaily,
    dateKey,
  };
}

function createAbstractLevel(
  elements: ScribbleElement[],
  rand: () => number,
  randX: (min?: number, max?: number) => number,
  randY: (min?: number, max?: number) => number,
  randFloat: (min: number, max: number) => number,
  randInt: (min: number, max: number) => number,
  primaryStroke: () => number,
  primaryColor: string
) {
  // 1-2 curves
  elements.push({
    type: 'curve',
    start: { x: randX(160, 360), y: randY(160, 450) },
    end: { x: randX(440, 660), y: randY(160, 450) },
    control: { x: randX(200, 600), y: randY(100, 500) },
    strokeWidth: primaryStroke(),
    color: primaryColor,
  });

  // 1 spiral or arc
  if (rand() > 0.4) {
    elements.push({
      type: 'spiral',
      center: { x: randX(260, 540), y: randY(180, 420) },
      radius: randFloat(40, 70),
      strokeWidth: primaryStroke(),
      color: primaryColor,
    });
  } else {
    elements.push({
      type: 'arc',
      center: { x: randX(280, 520), y: randY(180, 420) },
      radius: randFloat(45, 80),
      startAngle: randFloat(0, Math.PI * 0.8),
      endAngle: randFloat(Math.PI, Math.PI * 1.8),
      strokeWidth: primaryStroke(),
      color: primaryColor,
    });
  }

  // A loose scribble or dots
  if (rand() > 0.5) {
    elements.push(
      generateScribbleElement(
        rand,
        randX(280, 520),
        randY(180, 420),
        'loose',
        primaryStroke() * 0.9,
        primaryColor
      )
    );
  } else {
    // Zigzag line
    elements.push(generateZigzagElement(rand, randX(200, 350), randY(200, 400), randFloat(120, 220), primaryStroke(), primaryColor));
  }
}

function createAdvancedLevel(
  elements: ScribbleElement[],
  rand: () => number,
  randX: (min?: number, max?: number) => number,
  randY: (min?: number, max?: number) => number,
  randFloat: (min: number, max: number) => number,
  randInt: (min: number, max: number) => number,
  primaryStroke: () => number,
  primaryColor: string
) {
  // Complex multi-element composition
  elements.push({
    type: 'curve',
    start: { x: randX(160, 320), y: randY(140, 460) },
    end: { x: randX(480, 660), y: randY(140, 460) },
    control: { x: randX(180, 620), y: randY(100, 500) },
    control2: { x: randX(180, 620), y: randY(100, 500) },
    strokeWidth: primaryStroke(),
    color: primaryColor,
  });

  elements.push({
    type: 'circle',
    center: { x: randX(240, 560), y: randY(160, 440) },
    radius: randFloat(30, 65),
    strokeWidth: primaryStroke(),
    color: primaryColor,
  });

  if (rand() > 0.3) {
    elements.push(
      generateScribbleElement(
        rand,
        randX(260, 540),
        randY(180, 420),
        'spiral',
        primaryStroke() * 0.85,
        primaryColor
      )
    );
  }

  if (rand() > 0.4) {
    elements.push(generateZigzagElement(rand, randX(180, 400), randY(180, 440), randFloat(140, 240), primaryStroke() * 0.8, primaryColor));
  }
}

function generateZigzagElement(
  rand: () => number,
  startX: number,
  startY: number,
  totalLength: number,
  strokeWidth: number,
  color: string
): ScribbleElement {
  const points: Array<{ x: number; y: number }> = [];
  const segments = Math.floor(4 + rand() * 4);
  const angle = (rand() - 0.5) * 1.2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const perpX = -dy;
  const perpY = dx;
  const segDist = totalLength / segments;
  const amplitude = 25 + rand() * 30;

  for (let i = 0; i <= segments; i++) {
    const baseProgress = i * segDist;
    const sign = i % 2 === 0 ? 1 : -1;
    const offset = i === 0 || i === segments ? 0 : sign * amplitude;
    points.push({
      x: startX + dx * baseProgress + perpX * offset,
      y: startY + dy * baseProgress + perpY * offset,
    });
  }

  return {
    type: 'zigzag',
    points,
    strokeWidth,
    color,
  };
}

function generateScribbleElement(
  rand: () => number,
  centerX: number,
  centerY: number,
  style: string,
  strokeWidth: number,
  color: string
): ScribbleElement {
  const points: Array<{ x: number; y: number }> = [];

  if (style === 'spiral') {
    const turns = 2.5 + rand() * 1.5;
    const maxR = 45 + rand() * 35;
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const r = t * maxR + (rand() - 0.5) * 6;
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      });
    }
  } else if (style === 'dense') {
    // Dense looping scribble
    const loops = 14 + Math.floor(rand() * 10);
    const radiusX = 60 + rand() * 40;
    const radiusY = 45 + rand() * 35;
    let currX = centerX - radiusX * 0.5;
    let currY = centerY;
    points.push({ x: currX, y: currY });

    for (let i = 0; i < loops; i++) {
      const stepX = (rand() - 0.5) * (radiusX * 0.4);
      const stepY = (rand() - 0.5) * (radiusY * 0.6);
      currX += stepX;
      currY += stepY;
      // Pull toward center
      currX += (centerX - currX) * 0.15;
      currY += (centerY - currY) * 0.15;
      points.push({ x: currX, y: currY });
    }
  } else {
    // Loose playful scribble
    const loops = 8 + Math.floor(rand() * 6);
    let currX = centerX + (rand() - 0.5) * 50;
    let currY = centerY + (rand() - 0.5) * 50;
    points.push({ x: currX, y: currY });

    for (let i = 0; i < loops; i++) {
      const r = 35 + rand() * 50;
      const angle = rand() * Math.PI * 2;
      currX += Math.cos(angle) * r;
      currY += Math.sin(angle) * r;
      points.push({ x: currX, y: currY });
    }
  }

  return {
    type: 'scribble',
    points,
    strokeWidth,
    color,
  };
}

/**
 * Draw the starting procedural scribble onto the Canvas context
 */
export function drawScribbleOnCanvas(
  ctx: CanvasRenderingContext2D,
  elements: ScribbleElement[],
  canvasWidth: number,
  canvasHeight: number
) {
  // Base coordinate system was 800 x 600
  const scaleX = canvasWidth / 800;
  const scaleY = canvasHeight / 600;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const el of elements) {
    ctx.beginPath();
    ctx.lineWidth = (el.strokeWidth || 4) * Math.min(scaleX, scaleY);
    ctx.strokeStyle = el.color || '#1f2937';

    if (el.type === 'line' && el.start && el.end) {
      ctx.moveTo(el.start.x * scaleX, el.start.y * scaleY);
      ctx.lineTo(el.end.x * scaleX, el.end.y * scaleY);
      ctx.stroke();
    } else if (el.type === 'curve' && el.start && el.end && el.control) {
      ctx.moveTo(el.start.x * scaleX, el.start.y * scaleY);
      if (el.control2) {
        ctx.bezierCurveTo(
          el.control.x * scaleX,
          el.control.y * scaleY,
          el.control2.x * scaleX,
          el.control2.y * scaleY,
          el.end.x * scaleX,
          el.end.y * scaleY
        );
      } else {
        ctx.quadraticCurveTo(
          el.control.x * scaleX,
          el.control.y * scaleY,
          el.end.x * scaleX,
          el.end.y * scaleY
        );
      }
      ctx.stroke();
    } else if (el.type === 'arc' && el.center && el.radius) {
      ctx.arc(
        el.center.x * scaleX,
        el.center.y * scaleY,
        el.radius * Math.min(scaleX, scaleY),
        el.startAngle || 0,
        el.endAngle || Math.PI,
        false
      );
      ctx.stroke();
    } else if (el.type === 'circle' && el.center && el.radius) {
      ctx.arc(
        el.center.x * scaleX,
        el.center.y * scaleY,
        el.radius * Math.min(scaleX, scaleY),
        0,
        Math.PI * 2
      );
      ctx.stroke();
    } else if (el.type === 'shape' && el.center && el.radius && el.sides) {
      const sides = el.sides;
      const r = el.radius * Math.min(scaleX, scaleY);
      const cx = el.center.x * scaleX;
      const cy = el.center.y * scaleY;
      for (let s = 0; s < sides; s++) {
        const theta = (s * 2 * Math.PI) / sides - Math.PI / 2;
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (el.type === 'spiral' && el.center && el.radius) {
      const cx = el.center.x * scaleX;
      const cy = el.center.y * scaleY;
      const maxR = el.radius * Math.min(scaleX, scaleY);
      const turns = 3;
      const steps = 40;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * turns * Math.PI * 2;
        const r = t * maxR;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if ((el.type === 'scribble' || el.type === 'zigzag') && el.points && el.points.length > 1) {
      const pts = el.points;
      ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY);
      for (let i = 1; i < pts.length; i++) {
        // Smooth curve through points
        const xc = ((pts[i - 1].x + pts[i].x) / 2) * scaleX;
        const yc = ((pts[i - 1].y + pts[i].y) / 2) * scaleY;
        ctx.quadraticCurveTo(pts[i - 1].x * scaleX, pts[i - 1].y * scaleY, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x * scaleX, pts[pts.length - 1].y * scaleY);
      ctx.stroke();
    }
  }

  ctx.restore();
}
