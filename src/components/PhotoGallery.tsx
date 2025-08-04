/**
 * Modal de galeria de fotos para visualização de imagens dos serviços
 * Componente responsivo com navegação por teclado e gestos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Calendar,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { VehiclePhoto } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface PhotoGalleryProps {
  photos: VehiclePhoto[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  serviceName?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isOpen,
  onClose,
  initialIndex = 0,
  serviceName
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const currentPhoto = photos[currentIndex];

  // Reset states when opening gallery or changing photo
  useEffect(() => {
    if (isOpen && currentPhoto) {
      setZoom(1);
      setRotation(0);
      setIsFullscreen(false);
      setIsLoading(true);
      setImageError(false);
    }
  }, [isOpen, currentIndex, currentPhoto]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        navigateToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigateToNext();
        break;
      case '+':
      case '=':
        event.preventDefault();
        handleZoomIn();
        break;
      case '-':
        event.preventDefault();
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        handleRotate();
        break;
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigateToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const navigateToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;

    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `foto-servico-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: pt });
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (!isOpen || photos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Overlay clickável para fechar */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
        aria-label="Fechar galeria"
      />

      {/* Container principal */}
      <div className={`relative w-full h-full flex flex-col ${isFullscreen ? 'p-0' : 'p-4 max-w-7xl max-h-screen'}`}>
        
        {/* Header */}
        {!isFullscreen && (
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="text-white">
              <h2 className="text-lg font-semibold truncate">
                {serviceName ? `Fotos do Serviço - ${serviceName}` : 'Galeria de Fotos'}
              </h2>
              <p className="text-sm text-gray-300">
                {currentIndex + 1} de {photos.length} fotos
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Controles de zoom e rotação */}
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Diminuir zoom (-))"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Aumentar zoom (+)"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleRotate}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Girar imagem (R)"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Tela cheia"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Baixar imagem"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Área da imagem */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          
          {/* Botão anterior */}
          {photos.length > 1 && (
            <button
              onClick={navigateToPrevious}
              className="absolute left-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              title="Foto anterior (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Container da imagem */}
          <div className="relative flex items-center justify-center w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
              </div>
            )}

            {imageError ? (
              <div className="text-white text-center p-8">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Erro ao carregar imagem</h3>
                <p className="text-gray-300">A imagem não pôde ser carregada.</p>
              </div>
            ) : (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.description || `Foto ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            )}
          </div>

          {/* Botão próximo */}
          {photos.length > 1 && (
            <button
              onClick={navigateToNext}
              className="absolute right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              title="Próxima foto (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer com informações */}
        {!isFullscreen && currentPhoto && (
          <div className="relative z-10 mt-4 bg-black bg-opacity-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="text-white">
                {currentPhoto.description && (
                  <p className="text-sm font-medium mb-1">{currentPhoto.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Adicionada em {formatDate(currentPhoto.created_at)}</span>
                  </div>
                </div>
              </div>
              
              {/* Indicadores de navegação (pontos) */}
              {photos.length > 1 && (
                <div className="flex items-center space-x-2">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                      title={`Ir para foto ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controles fullscreen */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
              title="Sair da tela cheia"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
              title="Fechar galeria"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Indicador de navegação fullscreen */}
        {isFullscreen && photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-black bg-opacity-50 rounded-full px-4 py-2">
              <span className="text-white text-sm">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
        )}

        {/* Instruções de teclado */}
        {!isFullscreen && (
          <div className="absolute bottom-4 left-4 z-20 text-xs text-gray-400">
            <div className="bg-black bg-opacity-50 rounded px-2 py-1">
              <span>← → Navegar • + - Zoom • R Girar • Esc Fechar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};