import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Service, CatalogService, ServiceStatus, ClientSource, CompletionStatus, VehiclePhoto } from '../types';
import { supabase } from '../lib/supabase';
import { fetchCatalogServices as fetchCatalogServicesWithCache } from '../services/catalogService';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Check, 
  Car, 
  User, 
  Phone, 
  DollarSign, 
  Info, 
  Bookmark, 
  Tag,
  X,
  Save,
  FileText,
  Loader2,
  Clock,
  Plus
} from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';

interface ServiceFormProps {
  service?: Service;
  onSuccess: () => void;
  onClose: () => void;
  isOpen: boolean;
  tenant_id: string;
}

/**
 * Formulário para cadastro e edição de serviços
 */
export function ServiceForm({ service, onSuccess, onClose, isOpen, tenant_id }: ServiceFormProps) {
  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    client_name: service?.client_name || '',
    client_phone: service?.client_phone || '',
    service_date: service?.service_date 
      ? format(new Date(service.service_date), 'yyyy-MM-dd') 
      : format(new Date(), 'yyyy-MM-dd'),
    car_plate: service?.car_plate || '',
    car_model: service?.car_model || '',
    service_value: service?.service_value || 0,
    status: service?.status || 'pago' as ServiceStatus,
    client_source: service?.client_source || '' as ClientSource,
    completion_status: service?.completion_status || 'nao_iniciado' as CompletionStatus,
    observacoes: service?.observacoes || '',
  });
  
  // Estado para armazenar os IDs dos serviços selecionados
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    // Se tiver selected_services e for uma array válida, usamos como prioridade
    if (service?.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
      return service.selected_services;
    }
    
    // Se estivermos editando e existe service_id, usamos como fallback
    if (service?.service_id) {
      return [service.service_id];
    }
    
    // Caso contrário, começamos com array vazio
    return [];
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [photos, setPhotos] = useState<VehiclePhoto[]>(service?.photos || []);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Buscar serviços do catálogo
  useEffect(() => {
    if (isOpen) {
      fetchCatalogServices();
      if (service?.id) {
        fetchPhotos(service.id);
      }
    }
  }, [isOpen, tenant_id, service?.id]);

  // Quando um serviço é selecionado/desselecionado, atualizar o valor total dos serviços
  useEffect(() => {
    if (selectedServices.length > 0 && catalogServices.length > 0) {
      // Calcular o valor total somando todos os serviços selecionados
      const totalValue = selectedServices.reduce((total, serviceId) => {
        const selectedService = catalogServices.find(s => s.id === serviceId);
        return total + (selectedService ? selectedService.value : 0);
      }, 0);
      
      console.log('Valor total calculado:', totalValue, 'a partir dos serviços:', selectedServices);
      
      setFormData(prev => ({
        ...prev,
        service_value: totalValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        service_value: 0
      }));
    }
  }, [selectedServices, catalogServices]);

  /**
   * Buscar serviços do catálogo
   */
  const fetchCatalogServices = async () => {
    try {
      const catalogData = await fetchCatalogServicesWithCache(tenant_id);
      setCatalogServices(catalogData);
    } catch (error) {
      toast.error('Erro ao carregar os serviços do catálogo');
    }
  };

  /**
   * Busca as fotos associadas ao serviço
   */
  const fetchPhotos = async (serviceId: string) => {
    try {
      setLoadingPhotos(true);
      
      const { data, error } = await supabase
        .from('vehicle_photos')
        .select('*')
        .eq('service_id', serviceId)
        .eq('tenant_id', tenant_id);
        
      if (error) {
        console.error('Erro ao buscar fotos do veículo:', error);
        return;
      }
      
      if (data) {
        const formattedPhotos: VehiclePhoto[] = data.map(photo => ({
          id: photo.id,
          url: photo.url,
          description: photo.description,
          created_at: photo.created_at
        }));
        
        setPhotos(formattedPhotos);
      }
    } catch (error) {
      console.error('Erro ao buscar fotos do veículo:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  /**
   * Função para formatar o telefone no padrão (XX) XXXXX-XXXX
   */
  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara conforme a quantidade de números
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  /**
   * Handler para o campo de telefone
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, client_phone: formattedPhone });
  };

  /**
   * Handler para seleção de serviços via checkbox
   */
  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      // Se o serviço já estiver selecionado, remova-o
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } 
      // Caso contrário, adicione-o à lista
      return [...prev, serviceId];
    });
  };

  /**
   * Salva o serviço no banco de dados (cria novo ou atualiza existente)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validações dos campos obrigatórios
    if (!formData.client_name.trim()) {
      toast.error('O nome do cliente é obrigatório');
      setIsSubmitting(false);
      return;
    }

    if (!formData.car_plate.trim()) {
      toast.error('A placa do carro é obrigatória');
      setIsSubmitting(false);
      return;
    }

    if (formData.car_plate.trim().length < 5 || formData.car_plate.trim().length > 7) {
      toast.error('A placa do carro deve ter entre 5 e 7 caracteres (ex: ABC1234)');
      setIsSubmitting(false);
      return;
    }

    if (!formData.car_model.trim()) {
      toast.error('O modelo do carro é obrigatório');
      setIsSubmitting(false);
      return;
    }

    if (formData.car_model.trim().length < 2) {
      toast.error('O modelo do carro deve ter pelo menos 2 caracteres');
      setIsSubmitting(false);
      return;
    }

    // Verificar se pelo menos um serviço foi selecionado
    if (selectedServices.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      setIsSubmitting(false);
      return;
    }

    // Verificar se o status foi selecionado
    if (!formData.status) {
      toast.error('Selecione o status do serviço');
      setIsSubmitting(false);
      return;
    }

    try {
      // Garantir que a data esteja no formato correto (yyyy-MM-dd)
      const formattedDate = formData.service_date || format(new Date(), 'yyyy-MM-dd');
      
      // Determinar qual serviço deve ser o principal (usamos o primeiro selecionado)
      const primaryServiceId = selectedServices[0];
      
      // Testar se a coluna selected_services existe
      await testColumnExists();
      
      if (service?.id) {
        // Atualizar serviço existente
        await updateExistingService(service.id, formattedDate, primaryServiceId);
      } else {
        // Criar novo serviço
        await createNewService(formattedDate, primaryServiceId);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro detalhado ao salvar serviço:', error);
      toast.error('Erro ao salvar o serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Testa se a coluna selected_services existe
   * Se não existir, exibe um aviso
   */
  const testColumnExists = async () => {
    try {
      // Tentar obter um registro para ver se a coluna existe
      const { error } = await supabase
        .from('services')
        .select('selected_services')
        .limit(1);
        
      // Se houver um erro específico sobre a coluna não existir, mostramos o aviso
      if (error && error.message?.includes("selected_services")) {
        console.error("A coluna 'selected_services' não existe na tabela:", error);
        toast.error("É necessário executar o script SQL para adicionar a coluna 'selected_services'");
        toast.error("Execute o comando: supabase sql < supabase/add-selected-services.sql");
        throw new Error("Coluna selected_services não encontrada");
      }
    } catch (error) {
      // Rethrow para ser tratado no chamador
      throw error;
    }
  };

  /**
   * Atualiza um serviço existente
   */
  const updateExistingService = async (serviceId: string, formattedDate: string, primaryServiceId: string) => {
    try {
      // Garantir que o array selectedServices inclui pelo menos primaryServiceId
      let updatedSelectedServices = [...selectedServices];
      if (!updatedSelectedServices.includes(primaryServiceId)) {
        updatedSelectedServices.unshift(primaryServiceId);
      }
      
      // Preparar os dados básicos para atualização
      const updateData = {
        ...formData,
        client_name: formData.client_name.trim(),
        car_plate: formData.car_plate.trim().toUpperCase(),
        car_model: formData.car_model.trim(),
        client_phone: formData.client_phone?.trim() || null,
        service_id: primaryServiceId,
        service_date: formattedDate,
        tenant_id: tenant_id,
        updated_at: new Date().toISOString(),
        selected_services: updatedSelectedServices
      };
      
      console.log('Enviando dados de atualização:', updateData);
      
      // Atualizar o serviço
      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .eq('tenant_id', tenant_id);
        
      if (error) {
        console.error('Erro ao atualizar serviço:', error);
        throw new Error(`Erro ao atualizar serviço: ${error.message}`);
      }
      
      toast.success('Serviço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao atualizar serviço:', error);
      throw error;
    }
  };

  /**
   * Cria um novo serviço
   */
  const createNewService = async (formattedDate: string, primaryServiceId: string) => {
    try {
      // Gerar código de autenticação aleatório
      const authCode = `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Garantir que o array selectedServices inclui pelo menos primaryServiceId
      let updatedSelectedServices = [...selectedServices];
      if (!updatedSelectedServices.includes(primaryServiceId)) {
        updatedSelectedServices.unshift(primaryServiceId);
      }
      
      // Preparar os dados para inserção
      const newService = {
        ...formData,
        client_name: formData.client_name.trim(),
        car_plate: formData.car_plate.trim().toUpperCase(),
        car_model: formData.car_model.trim(),
        client_phone: formData.client_phone?.trim() || null,
        service_id: primaryServiceId,
        service_date: formattedDate,
        tenant_id: tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        auth_code: authCode,
        selected_services: updatedSelectedServices
      };
      
      console.log('Enviando dados para criação:', newService);
      
      // Inserir o novo serviço
      const { data: createdService, error } = await supabase
        .from('services')
        .insert(newService)
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao criar serviço:', error);
        throw new Error(`Erro ao criar serviço: ${error.message}`);
      }
      
      // Verificar se temos fotos para associar ao novo serviço
      if (photos.length > 0 && createdService?.id) {
        await associatePhotosToService(createdService.id);
      }
      
      toast.success('Serviço criado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao criar serviço:', error);
      throw error;
    }
  };

  /**
   * Associa fotos temporárias ao serviço recém-criado
   */
  const associatePhotosToService = async (serviceId: string) => {
    try {
      for (const photo of photos) {
        // Se a foto tem um ID que não é UUID (fotos temporárias), inserir no banco
        if (photo.id.length < 30) { // IDs temporários são menores que UUIDs
          await supabase
            .from('vehicle_photos')
            .insert({
              service_id: serviceId,
              tenant_id: tenant_id,
              url: photo.url,
              description: photo.description || null
            });
        } else {
          // Para fotos já existentes no banco, fazer update
          await supabase
            .from('vehicle_photos')
            .update({
              service_id: serviceId
            })
            .eq('id', photo.id)
            .eq('tenant_id', tenant_id);
        }
      }
    } catch (error) {
      console.error('Erro ao associar fotos ao serviço:', error);
      // Não interrompe o fluxo, apenas loga o erro
    }
  };

  /**
   * Handler para atualizar as fotos do serviço
   */
  const handlePhotosChange = (updatedPhotos: VehiclePhoto[]) => {
    setPhotos(updatedPhotos);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Estilos customizados para scrollbar - apenas desktop */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 768px) {
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #3b82f6;
              border-radius: 4px;
              transition: background-color 0.2s;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #2563eb;
            }
          }
        `
      }} />
      
      <div className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
        {/* Overlay para efeito de foco */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
        
        {/* Conteúdo do formulário */}
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] relative z-10 m-4 flex flex-col">
          {/* Header fixo */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-medium text-gray-900">
              {service ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Conteúdo com scroll customizado */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Aviso sobre campos obrigatórios */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Os campos marcados com <span className="text-red-500 mx-1">*</span> são obrigatórios.
            </p>
          </div>

          {/* Nome do Cliente */}
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <User className="w-4 h-4 mr-1 text-blue-600" />
                Nome do Cliente
                <span className="text-red-500 ml-1">*</span>
              </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>
          
          {/* Telefone do Cliente */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Phone className="w-4 h-4 mr-1 text-blue-600" />
              Telefone do Cliente (opcional)
            </label>
            <input
              type="text"
              placeholder="(48) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.client_phone}
              onChange={handlePhoneChange}
              maxLength={15}
            />
          </div>
          
          {/* Origem do Cliente */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Info className="w-4 h-4 mr-1 text-blue-600" />
              Origem do Cliente
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.client_source}
              onChange={(e) => setFormData({ ...formData, client_source: e.target.value as ClientSource })}
            >
              <option value="">Selecionar origem</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="indicacao">Indicação</option>
              <option value="facebook">Facebook</option>
              <option value="site">Site</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Data e Valor do Serviço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                Data do Serviço
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                Valor Total
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.service_value}
                  onChange={(e) => setFormData({ ...formData, service_value: parseFloat(e.target.value) })}
                  readOnly={selectedServices.length > 0}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {selectedServices.length > 0 
                  ? "Valor calculado automaticamente com base nos serviços selecionados." 
                  : "Informe o valor manualmente ou selecione serviços abaixo."}
              </p>
            </div>
          </div>
          
          {/* Informações do Veículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Car className="w-4 h-4 mr-1 text-blue-600" />
                Placa do Carro
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={7}
                placeholder="ABC1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.car_plate}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length <= 7) {
                    setFormData({ ...formData, car_plate: value });
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 7 caracteres (ex: ABC1234 ou ABC1D23)
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Car className="w-4 h-4 mr-1 text-blue-600" />
                Modelo do Carro
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.car_model}
                onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
              />
            </div>
          </div>

          {/* Campo de Status - Melhorando visualização */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-1 text-blue-600" />
              Status Financeiro
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.status === 'orcamento' 
                  ? 'bg-blue-100 border-blue-500 text-blue-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="status"
                  value="orcamento"
                  checked={formData.status === 'orcamento'}
                  onChange={() => setFormData({...formData, status: 'orcamento'})}
                  className="sr-only"
                />
                <span className="font-medium">Orçamento</span>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.status === 'pago' 
                  ? 'bg-green-100 border-green-500 text-green-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="status"
                  value="pago"
                  checked={formData.status === 'pago'}
                  onChange={() => setFormData({...formData, status: 'pago'})}
                  className="sr-only"
                />
                <span className="font-medium">Pago</span>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.status === 'nao_pago' 
                  ? 'bg-red-100 border-red-500 text-red-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="status"
                  value="nao_pago"
                  checked={formData.status === 'nao_pago'}
                  onChange={() => setFormData({...formData, status: 'nao_pago'})}
                  className="sr-only"
                />
                <span className="font-medium">Não Pago</span>
              </label>
            </div>
          </div>
          
          {/* NOVO: Status de Conclusão do Serviço */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1 text-blue-600" />
              Status do Serviço
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.completion_status === 'concluido' 
                  ? 'bg-green-100 border-green-500 text-green-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="completion_status"
                  value="concluido"
                  checked={formData.completion_status === 'concluido'}
                  onChange={() => setFormData({...formData, completion_status: 'concluido'})}
                  className="sr-only"
                />
                <span className="font-medium">Concluído</span>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.completion_status === 'em_andamento' 
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="completion_status"
                  value="em_andamento"
                  checked={formData.completion_status === 'em_andamento'}
                  onChange={() => setFormData({...formData, completion_status: 'em_andamento'})}
                  className="sr-only"
                />
                <span className="font-medium">Em Andamento</span>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                ${formData.completion_status === 'nao_iniciado' 
                  ? 'bg-gray-100 border-gray-500 text-gray-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="completion_status"
                  value="nao_iniciado"
                  checked={formData.completion_status === 'nao_iniciado'}
                  onChange={() => setFormData({...formData, completion_status: 'nao_iniciado'})}
                  className="sr-only"
                />
                <span className="font-medium">Não Iniciado</span>
              </label>
            </div>
          </div>

          {/* Serviços do Catálogo */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Bookmark className="w-4 h-4 mr-1 text-blue-600" />
              Serviços do Catálogo
            </label>
            
            {catalogServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Nenhum serviço cadastrado no catálogo.</p>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    // Definir flag para abrir o catálogo
                    localStorage.setItem('openCatalog', 'true');
                    
                    // Dispatch evento para notificar o App.tsx
                    window.dispatchEvent(new Event('openCatalog'));
                    
                    // Fechar o formulário atual
                    onClose();
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar ao Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-100 rounded-md">
                {catalogServices.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2 border border-gray-100 p-2 rounded-md hover:bg-gray-50">
                    <div 
                      className={`
                        w-5 h-5 border rounded flex items-center justify-center cursor-pointer
                        ${selectedServices.includes(service.id) 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-gray-300'}
                      `}
                      onClick={() => handleServiceSelection(service.id)}
                    >
                      {selectedServices.includes(service.id) && <Check className="w-4 h-4" />}
                    </div>
                    <label 
                      htmlFor={`service-${service.id}`} 
                      className="cursor-pointer flex-1 text-sm"
                      onClick={() => handleServiceSelection(service.id)}
                    >
                      <span className="font-medium">{service.name}</span>
                      <span className="ml-2 text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.value)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {catalogServices.length > 0 && selectedServices.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">
                  Serviços selecionados ({selectedServices.length}):
                </p>
                <ul className="mt-1 text-sm text-gray-600">
                  {selectedServices.map(serviceId => {
                    const service = catalogServices.find(s => s.id === serviceId);
                    return service ? (
                      <li key={service.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium">{service.name}</span>
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.value)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleServiceSelection(service.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remover serviço"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-1 text-blue-600" />
              Observações (opcional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Informações adicionais sobre o serviço..."
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            ></textarea>
          </div>
          
          {/* NOVO: Upload de Fotos do Veículo */}
          <div>
            {loadingPhotos ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="ml-2 text-gray-600">Carregando fotos...</span>
              </div>
            ) : (
              <PhotoUpload 
                serviceId={service?.id || 'temp'} 
                tenantId={tenant_id} 
                existingPhotos={photos}
                onPhotosChange={handlePhotosChange}
              />
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}