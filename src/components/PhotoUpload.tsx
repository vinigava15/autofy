import { useState, useRef } from 'react';
import { Camera, Upload, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { VehiclePhoto } from '../types';

interface PhotoUploadProps {
  serviceId: string;
  tenantId: string;
  existingPhotos?: VehiclePhoto[];
  onPhotosChange?: (photos: VehiclePhoto[]) => void;
}

export function PhotoUpload({ serviceId, tenantId, existingPhotos = [], onPhotosChange }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para fazer upload de uma imagem
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      // 1. Fazer upload do arquivo para o Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${tenantId}/${serviceId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // 2. Obter a URL pública da imagem
      const { data: publicUrl } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(filePath);
        
      if (!publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem');
      }
      
      // 3. Salvar a referência no banco de dados
      const { data: photoData, error: dbError } = await supabase
        .from('vehicle_photos')
        .insert({
          service_id: serviceId,
          tenant_id: tenantId,
          url: publicUrl.publicUrl,
          description: photoDescription
        })
        .select('*')
        .single();
      
      if (dbError) {
        throw dbError;
      }
      
      // 4. Adicionar à lista de fotos
      const newPhoto: VehiclePhoto = {
        id: photoData.id,
        url: publicUrl.publicUrl,
        description: photoDescription,
        created_at: photoData.created_at
      };
      
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      setPhotoDescription('');
      
      // 5. Notificar o componente pai
      if (onPhotosChange) {
        onPhotosChange(updatedPhotos);
      }
      
      toast.success('Foto adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Handler para selecionar arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Verificar o tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem é muito grande. O tamanho máximo é 5MB.');
      return;
    }
    
    await uploadImage(file);
    
    // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler para remover uma foto
  const handleRemovePhoto = async (photoId: string) => {
    try {
      // 1. Remover do banco de dados
      const { error } = await supabase
        .from('vehicle_photos')
        .delete()
        .eq('id', photoId)
        .eq('tenant_id', tenantId);
        
      if (error) {
        throw error;
      }
      
      // 2. Atualizar a lista local
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      setPhotos(updatedPhotos);
      
      // 3. Notificar o componente pai
      if (onPhotosChange) {
        onPhotosChange(updatedPhotos);
      }
      
      toast.success('Foto removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover a foto. Tente novamente.');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
        <Camera className="w-4 h-4 mr-1.5 text-blue-600" /> 
        Fotos do Veículo
      </h3>
      
      <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-md text-sm flex items-start">
        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
        <p>Adicione fotos do veículo para documentar eventuais danos pré-existentes.</p>
      </div>
      
      {/* Descrição da foto a ser enviada */}
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">
          Descrição da foto (opcional)
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Ex: Arranhão na porta dianteira"
          value={photoDescription}
          onChange={(e) => setPhotoDescription(e.target.value)}
        />
      </div>
      
      {/* Botão de upload */}
      <div className="mb-4">
        <input
          type="file"
          id="photo-upload"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            uploading
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          }`}
        >
          <Upload className="w-4 h-4 mr-1.5" />
          {uploading ? 'Enviando...' : 'Upload de Foto'}
        </label>
      </div>
      
      {/* Galeria de fotos */}
      {photos.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">
            Fotos adicionadas ({photos.length}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="group relative rounded-md overflow-hidden border border-gray-200"
              >
                <img 
                  src={photo.url} 
                  alt={photo.description || 'Foto do veículo'} 
                  className="h-24 w-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
                {photo.description && (
                  <div className="bg-gray-800 bg-opacity-70 text-white text-xs p-1 absolute bottom-0 left-0 right-0">
                    {photo.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 