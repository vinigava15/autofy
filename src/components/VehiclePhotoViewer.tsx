import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { VehiclePhoto } from '../types';

interface VehiclePhotoViewerProps {
  photos: VehiclePhoto[];
  isOpen: boolean;
  onClose: () => void;
}

export function VehiclePhotoViewer({ photos, isOpen, onClose }: VehiclePhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Se não houver fotos ou o modal não estiver aberto, não renderize nada
  if (!isOpen || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  // Navegar para a próxima foto
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  // Navegar para a foto anterior
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  // Alternar zoom da imagem
  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior com informações e controles */}
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">Foto {currentIndex + 1} de {photos.length}</span>
            {currentPhoto.description && (
              <p className="text-gray-300 mt-1">{currentPhoto.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Container da imagem */}
        <div className={`relative bg-gray-800 flex items-center justify-center ${isZoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}>
          <img
            src={currentPhoto.url}
            alt={currentPhoto.description || `Foto ${currentIndex + 1}`}
            className={`max-h-[70vh] ${isZoomed ? 'max-w-none w-auto h-auto' : 'max-w-full object-contain'}`}
            onClick={handleToggleZoom}
          />
          
          {/* Botão de zoom */}
          <button
            onClick={handleToggleZoom}
            className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
          >
            <ZoomIn size={20} />
          </button>
          
          {/* Navegação: Anterior */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <ChevronLeft size={24} />
              </button>
              
              {/* Navegação: Próximo */}
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="bg-gray-900 p-2 overflow-x-auto">
            <div className="flex space-x-2">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`h-16 w-16 flex-shrink-0 cursor-pointer border-2 ${
                    index === currentIndex ? 'border-blue-500' : 'border-transparent'
                  }`}
                  onClick={() => {
                    setIsZoomed(false);
                    setCurrentIndex(index);
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.description || `Miniatura ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 