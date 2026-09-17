import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Download,
  Share2,
  Edit2,
  Check,
  X,
  Palette,
  Eye,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { ArtworkRecord, FrameStyle } from '../types';
import {
  getGalleryArtworks,
  deleteGalleryArtwork,
  updateGalleryArtwork,
} from '../utils/storage';
import { soundEngine } from '../utils/audio';

interface GalleryViewProps {
  onBackToHome: () => void;
  onStartDrawing: (level?: number) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ onBackToHome, onStartDrawing }) => {
  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkRecord | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'normal' | 'infinite' | 'daily'>('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const loadArtworks = () => {
    const list = getGalleryArtworks();
    setArtworks(list);
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playClick(320);
    if (confirm('Delete this artwork from your gallery?')) {
      deleteGalleryArtwork(id);
      loadArtworks();
      if (selectedArtwork?.id === id) {
        setSelectedArtwork(null);
      }
    }
  };

  const handleSaveRename = (id: string) => {
    if (!tempTitle.trim()) return;
    updateGalleryArtwork(id, { title: tempTitle.trim() });
    setEditingTitleId(null);
    loadArtworks();
    if (selectedArtwork?.id === id) {
      setSelectedArtwork((prev) => (prev ? { ...prev, title: tempTitle.trim() } : null));
    }
    soundEngine.playClick(520);
  };

  const filtered = artworks.filter((art) => {
    if (filterMode === 'daily') return art.isDaily;
    if (filterMode === 'infinite') return art.level >= 8;
    if (filterMode === 'normal') return !art.isDaily && art.level < 8;
    return true;
  });

  const downloadArtwork = (artwork: ArtworkRecord) => {
    soundEngine.playClick(500);
    const a = document.createElement('a');
    a.href = artwork.imageData;
    a.download = `${artwork.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="gallery-view-screen"
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-4 sm:p-8"
    >
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            id="gallery-btn-back"
            onClick={onBackToHome}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl transition-colors"
            title="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">Personal Art Gallery</h1>
            <p className="text-xs text-stone-400">
              {artworks.length} {artworks.length === 1 ? 'creation' : 'creations'} preserved
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'normal', label: 'Levels' },
            { id: 'infinite', label: 'Infinite' },
            { id: 'daily', label: 'Daily' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilterMode(f.id as typeof filterMode);
                soundEngine.playClick(460);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === f.id
                  ? 'bg-stone-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Wall Grid */}
      <div className="w-full max-w-6xl mx-auto flex-1 py-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center mb-4 border border-stone-800">
              <Palette className="w-8 h-8 text-stone-600" />
            </div>
            <h3 className="text-lg font-serif text-stone-300">Your gallery is quiet and still</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              Begin a journey with a single line and preserve your very first creation here.
            </p>
            <button
              onClick={() => onStartDrawing(1)}
              className="mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-lg transition-all hover:scale-102"
            >
              Create First Artwork
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filtered.map((art) => (
              <div
                key={art.id}
                id={`gallery-card-${art.id}`}
                onClick={() => {
                  setSelectedArtwork(art);
                  soundEngine.playClick(480);
                }}
                className="group cursor-pointer flex flex-col items-center"
              >
                {/* Framed Thumbnail */}
                <div className="relative w-full aspect-[4/3] bg-stone-900 border-[8px] sm:border-[10px] border-[#38220f] shadow-lg rounded-sm overflow-hidden transition-all duration-300 group-hover:scale-103 group-hover:shadow-2xl group-hover:border-[#b48a3c]">
                  {/* Subtle inner mat */}
                  <div className="w-full h-full p-2 bg-[#faf6ee] flex items-center justify-center">
                    <img
                      src={art.imageData}
                      alt={art.title}
                      className="w-full h-full object-contain bg-[#fbfbfa]"
                    />
                  </div>
                </div>

                {/* Plaque Label */}
                <div className="mt-3 text-center w-full px-1">
                  <h4 className="font-serif text-sm font-semibold text-stone-200 truncate group-hover:text-amber-400 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {art.levelName} • {art.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Large Inspector Modal */}
      {selectedArtwork && (
        <div
          id="artwork-detail-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div className="relative bg-stone-900 border border-stone-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            {/* Close button */}
            <button
              id="modal-close-btn"
              onClick={() => setSelectedArtwork(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white bg-stone-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Framed Big Image */}
            <div className="relative max-w-lg w-full aspect-[4/3] border-[14px] sm:border-[18px] border-[#38220f] shadow-2xl rounded-sm overflow-hidden bg-[#faf6ee] p-3 sm:p-4">
              <img
                src={selectedArtwork.imageData}
                alt={selectedArtwork.title}
                className="w-full h-full object-contain bg-[#fbfbfa]"
              />
            </div>

            {/* Plaque & Details */}
            <div className="mt-6 text-center space-y-2 w-full max-w-md">
              {editingTitleId === selectedArtwork.id ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    autoFocus
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="px-3 py-1 bg-stone-800 border border-stone-700 text-stone-100 rounded-lg text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveRename(selectedArtwork.id)}
                    className="p-1.5 bg-amber-500 text-stone-950 rounded-lg"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTitleId(null)}
                    className="p-1.5 bg-stone-800 text-stone-400 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
                    {selectedArtwork.title}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingTitleId(selectedArtwork.id);
                      setTempTitle(selectedArtwork.title);
                    }}
                    className="p-1 text-stone-500 hover:text-stone-300"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-stone-400">
                {selectedArtwork.levelName} • Seed #{selectedArtwork.seed} • Created {selectedArtwork.createdAt}
              </p>

              {/* AI interpretation if available */}
              {selectedArtwork.aiInterpretation && (
                <div className="mt-3 p-3 bg-stone-950/70 border border-stone-800/80 rounded-xl text-xs text-stone-300 italic font-serif">
                  "{selectedArtwork.aiInterpretation}"
                </div>
              )}

              {/* Colors Used Chips */}
              {selectedArtwork.colorsUsed && selectedArtwork.colorsUsed.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">
                    Palette
                  </span>
                  <div className="flex gap-1">
                    {selectedArtwork.colorsUsed.slice(0, 8).map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full border-t border-stone-800 pt-4">
              <button
                onClick={() => downloadArtwork(selectedArtwork)}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Image</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedArtwork.title,
                      text: `Check out my artwork "${selectedArtwork.title}" in Scribble to Art!`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `Artwork: "${selectedArtwork.title}" created from a scribble in Scribble to Art!`
                    );
                    alert('Caption copied to clipboard!');
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                onClick={(e) => handleDelete(selectedArtwork.id, e)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-900/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
