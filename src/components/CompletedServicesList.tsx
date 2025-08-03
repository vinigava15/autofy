import { useState, useEffect } from 'react';
import { Service } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Pencil, Trash2, X, CheckCircle2, FileText, DollarSign, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatService } from '../utils/serviceFormatters';

interface CompletedServicesListProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (service: Service) => void;
  tenant_id: string;
}

export function CompletedServicesList({ isOpen, onClose, onEdit, tenant_id }: CompletedServicesListProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;
  
  // Formatar data local
  const formatLocalDate = (dateString: string) => {
    const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
    return format(date, 'dd/MM/yyyy', { locale: pt });
  };
  
  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  // Função para filtrar serviços com base na busca
  const filterServices = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredServices(services);
      setCurrentPage(1);
      return;
    }
    
    const termLower = term.toLowerCase();
    const filtered = services.filter(service => 
      service.client_name.toLowerCase().includes(termLower) || 
      service.car_plate.toLowerCase().includes(termLower) ||
      service.car_model.toLowerCase().includes(termLower) ||
      service.auth_code?.toLowerCase().includes(termLower)
    );
    
    setFilteredServices(filtered);
    setCurrentPage(1); // Volta para a primeira página ao buscar
  };
  
  // Função para gerar índices de itens para a página atual
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * servicesPerPage;
    const indexOfFirstItem = indexOfLastItem - servicesPerPage;
    return filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  
  // Buscar apenas serviços concluídos
  const fetchCompletedServices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('completion_status', 'concluido')
        .order('service_date', { ascending: false });
        
      if (error) {
        toast.error('Erro ao carregar serviços');
        return;
      }
      
      // Otimizar consultas para evitar N+1
      const allServiceIds = new Set<string>();
      const allSelectedServiceIds = new Set<string>();
      
      data.forEach(service => {
        if (service.service_id) {
          allServiceIds.add(service.service_id);
        }
        if (service.selected_services && Array.isArray(service.selected_services)) {
          service.selected_services.forEach((id: string) => allSelectedServiceIds.add(id));
        }
      });
      
      // Buscar serviços do catálogo em lote
      const allIds = new Set([...allServiceIds, ...allSelectedServiceIds]);
      let catalogServicesMap = new Map();
      
      if (allIds.size > 0) {
        const { data: catalogData } = await supabase
          .from('catalog_services')
          .select('id, name, value')
          .eq('tenant_id', tenant_id)
          .in('id', Array.from(allIds));
        
        if (catalogData) {
          catalogData.forEach(service_cat => {
            catalogServicesMap.set(service_cat.id, service_cat);
          });
        }
      }
      
      // Buscar fotos em lote
      const serviceIds = data.map(service => service.id);
      let photosMap = new Map();
      
      if (serviceIds.length > 0) {
        const { data: photosData } = await supabase
          .from('vehicle_photos')
          .select('id, url, description, created_at, service_id')
          .eq('tenant_id', tenant_id)
          .in('service_id', serviceIds);
        
        if (photosData) {
          photosData.forEach(photo => {
            if (!photosMap.has(photo.service_id)) {
              photosMap.set(photo.service_id, []);
            }
            photosMap.get(photo.service_id).push(photo);
          });
        }
      }
      
      // Processar serviços com dados já carregados
      const processedServices = data.map(service => {
        const catalogService = service.service_id 
          ? catalogServicesMap.get(service.service_id) 
          : null;
        
        const catalogServices = service.selected_services 
          ? service.selected_services.map((id: string) => catalogServicesMap.get(id)).filter(Boolean)
          : [];
        
        const photos = photosMap.get(service.id) || [];
        
        return {
          ...service,
          service: catalogService,
          catalog_services: catalogServices,
          photos: photos
        };
      });
      
      setServices(processedServices);
      setFilteredServices(processedServices);
      setCurrentPage(1);
    } catch (error) {
      // Erro tratado silenciosamente
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCompletedServices();
    }
  }, [isOpen, tenant_id]);
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) {
        console.error('Erro ao excluir serviço:', error);
        toast.error('Erro ao excluir o serviço');
        return;
      }

      toast.success('Serviço excluído com sucesso!');
      fetchCompletedServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir o serviço');
    }
  };
  
  // Função para marcar serviço como pago
  const handleMarkAsPaid = async (id: string) => {
    try {
      toast.loading('Atualizando status...');
      
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) {
        console.error('Erro ao atualizar status do serviço:', error);
        toast.dismiss();
        toast.error('Erro ao atualizar status do serviço');
        return;
      }

      toast.dismiss();
      toast.success('Serviço marcado como pago!');
      fetchCompletedServices();
    } catch (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar status do serviço');
    }
  };
  
  // Função para gerar a nota fiscal em PDF
  const handleGenerateInvoice = async (service: Service) => {
    try {
      toast.loading('Gerando nota fiscal...');
      
      // Primeiro, carregar detalhes dos serviços selecionados
      const { loadServiceDetails } = await import('../lib/serviceUtils');
      
      // Carregar detalhes completos dos serviços selecionados
      const serviceWithDetails = await loadServiceDetails(service);
      
      // Importar as funções necessárias
      const { serviceToNotaFiscal, generateInvoicePDF } = await import('../lib/generateInvoicePDF');
      
      // Converter o serviço para o formato de nota fiscal
      const notaFiscal = serviceToNotaFiscal(serviceWithDetails);
      
      // Gerar e baixar o PDF
      generateInvoicePDF(notaFiscal);
      
      toast.dismiss();
      toast.success('Nota fiscal gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar nota fiscal:', error);
      toast.dismiss();
      toast.error('Erro ao gerar nota fiscal. Tente novamente.');
    }
  };

  // Função para renderizar o indicador de status
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    let badgeClass = '';
    let statusText = '';
    
    switch (status) {
      case 'pago':
        badgeClass = 'bg-green-100 text-green-800 border-green-200';
        statusText = 'Pago';
        break;
      case 'nao_pago':
        badgeClass = 'bg-red-100 text-red-800 border-red-200';
        statusText = 'Não Pago';
        break;
      case 'orcamento':
        badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
        statusText = 'Orçamento';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
        statusText = status;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  // Componente para controles de paginação
  const Pagination = () => {
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Mostrando {getCurrentItems().length} de {filteredServices.length} serviços concluídos
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1">
            {[...Array(totalPages).keys()].map(number => (
              <button
                key={number + 1}
                onClick={() => setCurrentPage(number + 1)}
                className={`w-8 h-8 rounded-full text-sm ${
                  currentPage === number + 1
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-blue-100'
                }`}
              >
                {number + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`p-2 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
            Serviços Concluídos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por cliente, placa, modelo ou código..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => filterServices(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto px-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum serviço concluído encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentItems().map((service) => (
                    <tr key={service.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {service.client_name}
                        <div className="text-xs text-gray-500">Código: {service.auth_code}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatLocalDate(service.service_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {service.car_model}
                        <div className="text-xs font-medium">{service.car_plate}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatService(service)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(service.service_value)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {renderStatusBadge(service.status)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleGenerateInvoice(service)}
                            className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors"
                            title="Gerar nota fiscal"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                          {service.status === 'nao_pago' && (
                            <button
                              onClick={() => handleMarkAsPaid(service.id)}
                              className="bg-green-100 p-2 rounded-md hover:bg-green-200 transition-colors"
                              title="Marcar como pago"
                            >
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(service)}
                            className="bg-green-100 p-2 rounded-md hover:bg-green-200 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="bg-red-100 p-2 rounded-md hover:bg-red-200 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          {!loading && filteredServices.length > 0 && (
            <Pagination />
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 