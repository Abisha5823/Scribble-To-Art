import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Share2,
  Sparkles,
  ArrowRight,
  Eye,
  Edit2,
  Check,
  Bot,
  RefreshCw,
  Palette,
  CheckCircle2,
  Copy,
  X,
} from 'lucide-react';
import { ArtworkRecord, FrameStyle, ScribbleChallenge } from '../types';
import { soundEngine } from '../utils/audio';
import {
  saveArtworkToGallery,
  unlockAchievement,
  getArtistName,
  setArtistName,
} from '../utils/storage';

interface FramedArtworkViewProps {
  imageDataUrl: string;
  challenge: ScribbleChallenge;
  colorsUsed: string[];
  onPlayAnother: () => void;
  onGoToGallery: () => void;
}

const FRAME_OPTIONS: Array<{
  id: FrameStyle;
  name: string;
  borderClass: string;
  outerShadow: string;
  matClass: string;
  bgTexture: string;
}> = [
  {
    id: 'walnut',
    name: 'Classic Walnut & Gold',
    borderClass: 'border-[#38220f] border-[16px] sm:border-[22px] outline outline-2 outline-[#b48a3c]',
    outerShadow: 'shadow-[0_25px_50px_-12px_rgba(20,10,5,0.45)]',
    matClass: 'bg-[#faf6ee] p-4 sm:p-7 shadow-inner',
    bgTexture: 'from-amber-950/20 via-stone-900 to-stone-950',
  },
  {
    id: 'matte-black',
    name: 'Modern Matte Shadowbox',
    borderClass: 'border-[#171717] border-[14px] sm:border-[20px] outline outline-1 outline-stone-700/50',
    outerShadow: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.65)]',
    matClass: 'bg-[#f5f5f4] p-4 sm:p-7 shadow-inner',
    bgTexture: 'from-stone-900 via-zinc-900 to-black',
  },
  {
    id: 'natural-birch',
    name: 'Scandi Natural Birch',
    borderClass: 'border-[#d4be9b] border-[16px] sm:border-[22px] outline outline-1 outline-[#bfa47e]',
    outerShadow: 'shadow-[0_20px_40px_-10px_rgba(60,40,20,0.25)]',
    matClass: 'bg-[#fcfaf7] p-4 sm:p-7 shadow-inner',
    bgTexture: 'from-stone-800 via-stone-900 to-stone-950',
  },
  {
    id: 'gilded-gold',
    name: 'Gilded Museum Gold',
    borderClass: 'border-[#b48a3c] border-[16px] sm:border-[22px] outline outline-2 outline-[#7c5b1e]',
    outerShadow: 'shadow-[0_25px_50px_-12px_rgba(180,138,60,0.3)]',
    matClass: 'bg-[#fdfbf7] p-4 sm:p-7 shadow-inner',
    bgTexture: 'from-amber-950/30 via-stone-900 to-black',
  },
  {
    id: 'gallery-white',
    name: 'Studio Floating White',
    borderClass: 'border-white border-[14px] sm:border-[18px] outline outline-1 outline-stone-300',
    outerShadow: 'shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)]',
    matClass: 'bg-[#fafafa] p-4 sm:p-7 shadow-inner',
    bgTexture: 'from-neutral-900 via-stone-900 to-neutral-950',
  },
];

export const FramedArtworkView: React.FC<FramedArtworkViewProps> = ({
  imageDataUrl,
  challenge,
  colorsUsed,
  onPlayAnother,
  onGoToGallery,
}) => {
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>('walnut');
  const [title, setTitle] = useState<string>('Scribble Transformed');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [artist, setArtist] = useState<string>(getArtistName());
  const [isEditingArtist, setIsEditingArtist] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  const frameCardRef = useRef<HTMLDivElement>(null);

  // Play audio chimes and trigger celebration confetti on mount
  useEffect(() => {
    soundEngine.playCompletionChime();
    soundEngine.playFrameReveal();

    // Confetti celebration
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
      });
    } catch {
      // ignore
    }

    // Check & trigger achievements
    const newlyUnlocked: string[] = [];
    const a1 = unlockAchievement('first_creation');
    if (a1) newlyUnlocked.push(a1.title);

    if (colorsUsed.length >= 5) {
      const a2 = unlockAchievement('color_explorer');
      if (a2) newlyUnlocked.push(a2.title);
    }
    if (colorsUsed.length >= 8) {
      const a3 = unlockAchievement('rainbow_artist');
      if (a3) newlyUnlocked.push(a3.title);
    }
    if (challenge.level === 4) {
      const a4 = unlockAchievement('scribble_master');
      if (a4) newlyUnlocked.push(a4.title);
    }
    if (challenge.level === 6) {
      const a5 = unlockAchievement('abstract_artist');
      if (a5) newlyUnlocked.push(a5.title);
    }
    if (challenge.isDaily) {
      const a6 = unlockAchievement('daily_devotee');
      if (a6) newlyUnlocked.push(a6.title);
    }

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(newlyUnlocked);
    }

    // Auto-save to gallery
    const initialRecord: ArtworkRecord = {
      id: `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      level: challenge.level,
      levelName: challenge.levelName,
      seed: challenge.seed,
      patternType: challenge.patternType,
      title: 'Scribble Transformed',
      artistName: getArtistName(),
      imageData: imageDataUrl,
      createdAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      colorsUsed,
      frameStyle: 'walnut',
      isDaily: challenge.isDaily,
    };
    saveArtworkToGallery(initialRecord);
  }, [challenge, colorsUsed, imageDataUrl]);

  // Request AI Interpretation
  const requestAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          startingPatternType: challenge.patternType,
          level: challenge.level,
        }),
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();

      if (data.interpretation) {
        setAiInterpretation(data.interpretation);
      }
      if (data.suggestedTitle && (!title || title === 'Scribble Transformed')) {
        setTitle(data.suggestedTitle);
      }
      if (data.tags && Array.isArray(data.tags)) {
        setAiTags(data.tags);
      }
      soundEngine.playClick(620);
    } catch {
      // Friendly fallback
      setAiInterpretation(
        `A delightfully unique, expressive piece that began with a single ${challenge.patternType.toLowerCase()} mark and flourished into an original vision.`
      );
      setAiTags(['Original', 'Visionary', 'Soulful']);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Download raw artwork drawing
  const downloadDrawing = (format: 'png' | 'jpeg' = 'png') => {
    soundEngine.playClick(500);
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_drawing.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render framed composition onto a high-res canvas and download
  const downloadFramedArtwork = () => {
    soundEngine.playClick(520);
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 960;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gallery Wall Background
    const grad = ctx.createRadialGradient(width / 2, height / 2 - 80, 50, width / 2, height / 2, 800);
    grad.addColorStop(0, '#2d2d2a');
    grad.addColorStop(1, '#141412');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm museum spotlight
    const spot = ctx.createRadialGradient(width / 2, 280, 20, width / 2, 280, 480);
    spot.addColorStop(0, 'rgba(255, 248, 220, 0.16)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);

    // Frame bounds
    const frameW = 860;
    const frameH = 640;
    const frameX = (width - frameW) / 2;
    const frameY = 80;

    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 25;

    // Outer Frame
    if (selectedFrame === 'walnut') {
      ctx.fillStyle = '#38220f';
    } else if (selectedFrame === 'matte-black') {
      ctx.fillStyle = '#171717';
    } else if (selectedFrame === 'natural-birch') {
      ctx.fillStyle = '#d4be9b';
    } else if (selectedFrame === 'gilded-gold') {
      ctx.fillStyle = '#b48a3c';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(frameX, frameY, frameW, frameH);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inner mat
    const matPad = 48;
    const matX = frameX + matPad;
    const matY = frameY + matPad;
    const matW = frameW - matPad * 2;
    const matH = frameH - matPad * 2;
    ctx.fillStyle = selectedFrame === 'matte-black' ? '#f5f5f4' : '#faf6ee';
    ctx.fillRect(matX, matY, matW, matH);

    // Load and draw Artwork Image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const artPad = 32;
      const artX = matX + artPad;
      const artY = matY + artPad;
      const artW = matW - artPad * 2;
      const artH = matH - artPad * 2;
      ctx.drawImage(img, artX, artY, artW, artH);

      // Museum Plaque below frame
      const plaqueW = 380;
      const plaqueH = 80;
      const plaqueX = (width - plaqueW) / 2;
      const plaqueY = frameY + frameH + 45;

      // Brass Plaque
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
      ctx.fillStyle = '#261a06';
      ctx.font = "bold 20px 'Cinzel', serif";
      ctx.textAlign = 'center';
      ctx.fillText(title.toUpperCase(), width / 2, plaqueY + 32);

      ctx.font = "italic 14px 'Playfair Display', serif";
      ctx.fillStyle = '#453210';
      ctx.fillText(`${artist} • ${challenge.levelName}`, width / 2, plaqueY + 54);

      // Trigger download
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_framed.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = imageDataUrl;
  };

  const handleNativeShare = async () => {
    soundEngine.playClick(450);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scribble to Art — "${title}"`,
          text: `I turned a random scribble into this artwork: "${title}" in Scribble to Art!`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to share card modal
      }
    }
    setShareModalOpen(true);
  };

  const currentFrameConfig =
    FRAME_OPTIONS.find((f) => f.id === selectedFrame) || FRAME_OPTIONS[0];

  return (
    <div
      id="framed-artwork-screen"
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden"
    >
      {/* Museum Overhead Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-amber-100/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header Banner */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2 border-b border-stone-800">
        <div>
          <span className="text-amber-400 text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Creativity Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-stone-100">
            Your Creation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-nav-gallery"
            onClick={onGoToGallery}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-all"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">My Gallery</span>
          </button>
          <button
            id="btn-play-another"
            onClick={onPlayAnother}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md hover:scale-102"
          >
            <span>Create Another</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unlocked Achievements Toast */}
      {unlockedAchievements.length > 0 && (
        <div className="relative z-20 my-3 flex flex-wrap gap-2 items-center justify-center">
          {unlockedAchievements.map((ach) => (
            <div
              key={ach}
              className="bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 animate-bounce"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Achievement Unlocked: {ach}!</span>
            </div>
          ))}
        </div>
      )}

      {/* Centerpiece: The Framed Artwork on Museum Gallery Wall */}
      <div className="relative z-10 w-full max-w-4xl my-auto py-6 flex flex-col items-center">
        <div
          ref={frameCardRef}
          id="gallery-frame-container"
          className={`relative max-w-2xl w-full mx-auto transition-all duration-700 ease-out transform ${currentFrameConfig.borderClass} ${currentFrameConfig.outerShadow} rounded-sm`}
        >
          {/* Mat Board */}
          <div className={currentFrameConfig.matClass}>
            {/* The Drawing */}
            <div className="relative overflow-hidden shadow-md bg-[#fbfbfa]">
              <img
                src={imageDataUrl}
                alt={title}
                className="w-full h-auto block select-none"
              />
            </div>
          </div>
        </div>

        {/* Museum Brass Nameplate Plaque */}
        <div
          id="museum-plaque"
          className="mt-6 bg-gradient-to-b from-[#e5c158] to-[#b38927] text-stone-950 px-6 py-3 rounded-md shadow-xl border border-[#f5df88] flex flex-col items-center min-w-[280px] max-w-md text-center"
        >
          {/* Title Editor */}
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={title}
                  autoFocus
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="px-2 py-0.5 text-sm font-serif font-bold bg-white/80 text-stone-900 rounded focus:outline-none"
                />
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 text-stone-900 hover:text-black"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="cursor-pointer group flex items-center gap-1.5"
                title="Click to rename artwork"
              >
                <h2 className="font-serif font-bold text-lg sm:text-xl tracking-wide uppercase text-stone-950 group-hover:underline">
                  {title}
                </h2>
                <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </div>
            )}
          </div>

          {/* Artist and Level */}
          <p className="text-xs font-serif italic text-stone-800 mt-0.5">
            By {artist} • {challenge.levelName}
          </p>

          <p className="text-[11px] font-sans text-stone-700/80 mt-1">
            Seed #{challenge.seed} • {challenge.patternType}
          </p>
        </div>

        {/* Uplifting Core Message */}
        <p className="text-stone-400 font-serif italic text-sm mt-4 text-center">
          “You turned a simple scribble into your own creation.”
        </p>

        {/* AI Interpretation Box ("What Did You Create?") */}
        <div className="w-full max-w-xl mt-6 bg-stone-900/80 border border-stone-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              AI Curator: What Did You Create?
            </span>
            <button
              id="btn-ai-analyze"
              onClick={requestAiAnalysis}
              disabled={isAiLoading}
              className="text-xs text-stone-300 hover:text-white flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg transition-colors"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Contemplating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{aiInterpretation ? 'Re-interpret' : 'Ask AI Curator'}</span>
                </>
              )}
            </button>
          </div>

          {aiInterpretation ? (
            <div className="space-y-2 text-stone-300 text-sm">
              <p className="italic font-serif leading-relaxed">
                "{aiInterpretation}"
              </p>
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[11px] bg-stone-800 text-amber-300 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-stone-400 text-xs">
              Let the AI art curator reflect on your unique lines and colors, offering a poetic interpretation and fresh title suggestions.
            </p>
          )}
        </div>
      </div>

      {/* Frame Selection & Action Bar */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800">
        {/* Frame Style Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
            <Palette className="w-3.5 h-3.5" />
            Frame:
          </span>
          <div className="flex bg-stone-900 p-1 rounded-xl gap-1">
            {FRAME_OPTIONS.map((f) => (
              <button
                key={f.id}
                id={`frame-opt-${f.id}`}
                onClick={() => {
                  setSelectedFrame(f.id);
                  soundEngine.playClick(500);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                  selectedFrame === f.id
                    ? 'bg-stone-800 text-amber-400 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {f.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Save Drawing, Save Framed, Share */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-save-drawing"
            onClick={() => downloadDrawing('png')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-800 transition-all"
            title="Download pure artwork without frame"
          >
            <Download className="w-4 h-4" />
            <span>Save Drawing</span>
          </button>

          <button
            id="btn-save-framed"
            onClick={downloadFramedArtwork}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all shadow"
            title="Download full museum-framed artwork"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Save Framed Artwork</span>
          </button>

          <button
            id="btn-share"
            onClick={handleNativeShare}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Share Card Modal */}
      {shareModalOpen && (
        <div
          id="share-card-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif text-stone-100 font-bold mb-3 text-center">
              Share Your Creation
            </h3>

            {/* Visual Share Card */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                SCRIBBLE TO ART
              </span>
              <div className="w-full aspect-[4/3] bg-stone-900 rounded-lg overflow-hidden border border-stone-800">
                <img
                  src={imageDataUrl}
                  alt={title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-serif font-bold text-stone-100">{title}</p>
                <p className="text-xs text-stone-400">
                  Created by {artist} • {challenge.levelName}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Check out my artwork "${title}" created from a scribble in Scribble to Art! 🎨✨`
                  );
                  alert('Share text copied to clipboard!');
                }}
                className="flex-1 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white rounded-xl flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                Copy Caption
              </button>
              <button
                onClick={downloadFramedArtwork}
                className="flex-1 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
