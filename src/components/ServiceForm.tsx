import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Service, CatalogService, ServiceStatus, ClientSource } from '../types';
import { supabase } from '../lib/supabase';
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
  FileText 
} from 'lucide-react';

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

  // Buscar serviços do catálogo
  useEffect(() => {
    if (isOpen) {
      fetchCatalogServices();
    }
  }, [isOpen, tenant_id]);

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
      const { data, error } = await supabase
        .from('catalog_services')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar serviços do catálogo:', error);
        toast.error('Erro ao carregar os serviços do catálogo');
        return;
      }

      setCatalogServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços do catálogo:', error);
      toast.error('Erro ao carregar os serviços do catálogo');
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
      const { data, error } = await supabase
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
        service_id: primaryServiceId,
        car_plate: formData.car_plate.toUpperCase(),
        service_date: formattedDate,
        tenant_id: tenant_id,
        updated_at: new Date().toISOString(),
        status: formData.status,
        selected_services: updatedSelectedServices,
        client_source: formData.client_source || null
      };
      
      // Registrando para depuração
      console.log('Atualizando serviço com dados:', updateData);
      
      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId);
      
      if (error) {
        // Tentar novamente sem o campo selected_services se der erro
        if (error.message?.includes("selected_services")) {
          console.warn("Tentando atualizar sem o campo selected_services");
          const { error: retryError } = await supabase
            .from('services')
            .update({
              ...formData,
              service_id: primaryServiceId,
              car_plate: formData.car_plate.toUpperCase(),
              service_date: formattedDate,
              tenant_id: tenant_id,
              updated_at: new Date().toISOString(),
              status: formData.status,
              client_source: formData.client_source || null
            })
            .eq('id', serviceId);
            
          if (retryError) throw retryError;
          
          // Exibir mensagem para o usuário executar o script SQL
          toast.warning("Para salvar múltiplos serviços, execute o script SQL que adiciona o suporte a múltiplos serviços");
          toast.info("Comando: supabase sql < supabase/add-selected-services.sql");
        } else if (error.message?.includes("status")) {
          console.warn("Tentando atualizar sem o campo status");
          // Se o erro for relacionado ao campo status (coluna não existe), tentar sem ele
          const { error: retryError } = await supabase
            .from('services')
            .update({
              ...formData,
              service_id: primaryServiceId,
              car_plate: formData.car_plate.toUpperCase(),
              service_date: formattedDate,
              tenant_id: tenant_id,
              updated_at: new Date().toISOString(),
              // Remove o campo status
              client_source: formData.client_source || null
            })
            .eq('id', serviceId);
          
          if (retryError) throw retryError;
          
          // Se conseguiu atualizar sem o campo status, exibe aviso
          toast.warning("Atualize o banco de dados para suportar status de serviços");
        } else {
          throw error;
        }
      }
      
      toast.success('Serviço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar o serviço');
      throw error;
    }
  };

  /**
   * Cria um novo serviço
   */
  const createNewService = async (formattedDate: string, primaryServiceId: string) => {
    try {
      // Gerar código de autenticação randomico
      const authCode = `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Garantir que o array selectedServices inclui pelo menos primaryServiceId
      let updatedSelectedServices = [...selectedServices];
      if (!updatedSelectedServices.includes(primaryServiceId)) {
        updatedSelectedServices.unshift(primaryServiceId);
      }
      
      // Criar objeto base para inserção
      const insertData = {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        service_date: formattedDate,
        car_plate: formData.car_plate.toUpperCase(),
        car_model: formData.car_model,
        service_value: formData.service_value,
        service_id: primaryServiceId,
        auth_code: authCode,
        tenant_id: tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: formData.status,
        selected_services: updatedSelectedServices,
        client_source: formData.client_source || null
      };
      
      // Registrando para depuração
      console.log('Criando serviço com dados:', insertData);
      
      const { error, data } = await supabase
        .from('services')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        // Se o erro for relacionado à coluna selected_services, tentar sem ela
        if (error.message?.includes("selected_services")) {
          console.warn("Tentando inserir sem o campo selected_services");
          
          const insertDataWithoutSelectedServices = { 
            ...insertData 
          };
          delete insertDataWithoutSelectedServices.selected_services;
          
          const { error: retryError } = await supabase
            .from('services')
            .insert(insertDataWithoutSelectedServices)
            .single();
            
          if (retryError) throw retryError;
          
          // Exibir mensagem para o usuário executar o script SQL
          toast.warning("Para salvar múltiplos serviços, execute o script SQL que adiciona o suporte a múltiplos serviços");
          toast.info("Comando: supabase sql < supabase/add-selected-services.sql");
        } else if (error.message?.includes("status")) {
          console.warn("Tentando inserir sem o campo status");
          
          // Se o erro for relacionado ao campo status (coluna não existe), tentar sem ele
          const insertDataWithoutStatus = { 
            ...insertData 
          };
          delete insertDataWithoutStatus.status;
          
          const { error: retryError } = await supabase
            .from('services')
            .insert(insertDataWithoutStatus)
            .single();
            
          if (retryError) throw retryError;
          
          // Se conseguiu inserir sem o campo status, exibe aviso
          toast.warning("Atualize o banco de dados para suportar status de serviços");
        } else {
          throw error;
        }
      }
      
      toast.success('Serviço cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast.error('Erro ao cadastrar o serviço');
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 
      ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} 
      transition-opacity duration-300`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {service?.id ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Cliente */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="w-4 h-4 mr-1 text-blue-600" />
              Nome do Cliente
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
                <DollarSign className="w-4 h-4 mr-1 text-emerald-600" />
                Valor Total dos Serviços
              </label>
              <input
                type="number"
                required
                readOnly
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none"
                value={formData.service_value}
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor calculado a partir dos serviços selecionados
              </p>
            </div>
          </div>

          {/* Dados do Veículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Car className="w-4 h-4 mr-1 text-blue-600" />
                Placa do Carro
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.car_plate}
                onChange={(e) => setFormData({ ...formData, car_plate: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Car className="w-4 h-4 mr-1 text-blue-600" />
                Modelo do Carro
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
              Status do Serviço *
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

          {/* Serviços - Checkboxes */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Bookmark className="w-4 h-4 mr-1 text-blue-600" />
              Selecione os Serviços
            </label>
            
            {catalogServices.length === 0 ? (
              <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50 text-yellow-700 text-sm">
                <p className="mb-2">Nenhum serviço cadastrado no catálogo.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Usando setTimeout para garantir que o modal atual seja fechado antes de abrir o catálogo
                    setTimeout(() => {
                      // Aqui precisamos chamar a função que abre o catálogo
                      // Como não temos acesso direto, uma alternativa é usar localStorage para comunicação
                      localStorage.setItem('openCatalog', 'true');
                      // Disparar um evento customizado para notificar a aplicação
                      window.dispatchEvent(new CustomEvent('openCatalog'));
                    }, 100);
                  }}
                  className="mt-1 text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                >
                  Cadastrar novo serviço no catálogo
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

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-0 shadow-sm flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {service ? 'Atualizando...' : 'Cadastrando...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="w-4 h-4 mr-1" />
                  {service ? 'Atualizar' : 'Cadastrar'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}