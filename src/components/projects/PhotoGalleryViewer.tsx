import { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  photos: string[];
  title?: string;
}

export default function PhotoGalleryViewer({ photos, title = 'Photos' }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No photos available
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
            onClick={() => {
              setSelectedPhoto(photo);
              setZoom(1);
            }}
          >
            <img
              src={photo}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
            />
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.min(zoom + 0.5, 3));
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ZoomIn className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.max(zoom - 0.5, 0.5));
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ZoomOut className="w-6 h-6 text-white" />
            </button>
          </div>

          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
