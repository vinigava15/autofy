/**
 * Botão discreto para visualizar fotos de serviços
 * Componente reutilizável com indicador visual de quantidade
 */

import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { VehiclePhoto } from '../types';
import { PhotoGallery } from './PhotoGallery';
import { supabase } from '../lib/supabase';

interface PhotoViewButtonProps {
  serviceId: string;
  serviceName?: string;
  variant?: 'desktop' | 'mobile';
  className?: string;
  showText?: boolean;
}

export const PhotoViewButton: React.FC<PhotoViewButtonProps> = ({
  serviceId,
  serviceName,
  variant = 'desktop',
  className = '',
  showText = false
}) => {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar fotos do serviço
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!serviceId) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('vehicle_photos')
          .select('*')
          .eq('service_id', serviceId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erro ao carregar fotos:', error);
          return;
        }

        setPhotos(data || []);
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [serviceId]);

  // Não renderizar apenas durante o loading inicial
  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-center p-2 opacity-50">
        <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleOpenGallery = (e: React.MouseEvent) => {
    // SEMPRE bloquear propagação, mesmo quando sem fotos
    e.preventDefault();
    e.stopPropagation();
    
    if (photos.length === 0) {
      // Bloquear propagação mas não fazer nada mais
      return;
    }
    
    setIsGalleryOpen(true);
  };

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center transition-colors rounded-lg relative";
    
    // Se não há fotos, mostrar como desabilitado mas ainda clicável (para bloquear propagação)
    if (photos.length === 0) {
      if (variant === 'mobile') {
        return `${baseClasses} p-2 bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed pointer-events-auto`;
      }
      return `${baseClasses} p-2 bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-auto`;
    }
    
    // Estados normais com fotos
    if (variant === 'mobile') {
      return `${baseClasses} p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200`;
    }
    
    // Desktop variant
    return `${baseClasses} p-2 bg-purple-100 text-purple-600 hover:bg-purple-200`;
  };

  const getIconSize = () => {
    return variant === 'mobile' ? 'w-4 h-4' : 'w-4 h-4';
  };

  const getTooltipText = () => {
    if (photos.length === 0) {
      return 'Nenhuma foto anexada a este serviço';
    }
    return `Ver ${photos.length} foto${photos.length !== 1 ? 's' : ''} do serviço`;
  };

  const getDisplayText = () => {
    if (photos.length === 0) {
      return 'Sem Fotos';
    }
    return photos.length === 1 ? 'Foto' : `${photos.length} Fotos`;
  };

  return (
    <>
      <button
        onClick={handleOpenGallery}
        className={`${getButtonClasses()} ${className}`}
        title={getTooltipText()}
        type="button"
      >
        {photos.length === 0 ? (
          <ImageIcon className={`${getIconSize()} opacity-50`} />
        ) : photos.length > 1 ? (
          <Camera className={getIconSize()} />
        ) : (
          <ImageIcon className={getIconSize()} />
        )}
        
        {/* Contador de fotos - apenas para múltiplas fotos */}
        {photos.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {photos.length > 9 ? '9+' : photos.length}
          </span>
        )}
        
        {/* Texto opcional */}
        {showText && (
          <span className="ml-2 text-sm font-medium">
            {getDisplayText()}
          </span>
        )}
      </button>

      {/* Modal da galeria */}
      <PhotoGallery
        photos={photos}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        serviceName={serviceName}
      />
    </>
  );
};