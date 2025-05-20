import { useState, useEffect } from 'react';
import { Service } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Pencil, Trash2, X, Clock, FileText, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatService } from '../utils/serviceFormatters';

interface QuotationsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (service: Service) => void;
  tenant_id: string;
}

export function QuotationsList({ isOpen, onClose, onEdit, tenant_id }: QuotationsListProps) {
  const [quotations, setQuotations] = useState<Service[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const quotationsPerPage = 10;
  
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
  
  // Função para filtrar orçamentos com base na busca
  const filterQuotations = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredQuotations(quotations);
      setCurrentPage(1);
      return;
    }
    
    const termLower = term.toLowerCase();
    const filtered = quotations.filter(quotation => 
      quotation.client_name.toLowerCase().includes(termLower) || 
      quotation.car_plate.toLowerCase().includes(termLower) ||
      quotation.car_model.toLowerCase().includes(termLower) ||
      quotation.auth_code?.toLowerCase().includes(termLower)
    );
    
    setFilteredQuotations(filtered);
    setCurrentPage(1); // Volta para a primeira página ao buscar
  };
  
  // Função para gerar índices de itens para a página atual
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * quotationsPerPage;
    const indexOfFirstItem = indexOfLastItem - quotationsPerPage;
    return filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredQuotations.length / quotationsPerPage);
  
  // Buscar apenas orçamentos
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('status', 'orcamento')
        .order('service_date', { ascending: false });
        
      if (error) {
        console.error('Erro ao buscar orçamentos:', error);
        toast.error('Erro ao carregar orçamentos');
        return;
      }
      
      // Processar serviços para incluir detalhes do catálogo
      const processedQuotations = await Promise.all(data.map(async (quotation) => {
        let catalogService = null;
        let catalogServices: any[] = [];
        
        // Buscar o serviço do catálogo correspondente, se existir
        if (quotation.service_id) {
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog_services')
            .select('id, name, value')
            .eq('id', quotation.service_id)
            .single();
            
          if (!catalogError && catalogData) {
            catalogService = catalogData;
          }
        }
        
        // Buscar todos os serviços do catálogo selecionados, se houver
        if (quotation.selected_services && Array.isArray(quotation.selected_services) && quotation.selected_services.length > 0) {
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog_services')
            .select('id, name, value')
            .in('id', quotation.selected_services);
            
          if (!catalogError && catalogData) {
            catalogServices = catalogData;
          }
        }
        
        return {
          ...quotation,
          service: catalogService,
          catalog_services: catalogServices
        };
      }));
      
      setQuotations(processedQuotations);
      setFilteredQuotations(processedQuotations);
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuotations();
    }
  }, [isOpen, tenant_id]);
  
  const handleApproveQuotation = async (id: string) => {
    try {
      toast.loading('Aprovando orçamento...');
      
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'nao_pago',
          completion_status: 'nao_iniciado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) {
        console.error('Erro ao aprovar orçamento:', error);
        toast.dismiss();
        toast.error('Erro ao aprovar orçamento');
        return;
      }

      toast.dismiss();
      toast.success('Orçamento aprovado e convertido em serviço!');
      fetchQuotations();
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      toast.dismiss();
      toast.error('Erro ao aprovar orçamento');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) {
        console.error('Erro ao excluir orçamento:', error);
        toast.error('Erro ao excluir o orçamento');
        return;
      }

      toast.success('Orçamento excluído com sucesso!');
      fetchQuotations();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir o orçamento');
    }
  };
  
  // Função para gerar a nota fiscal em PDF
  const handleGenerateInvoice = async (service: Service) => {
    try {
      toast.loading('Gerando orçamento em PDF...');
      
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
      toast.success('Orçamento em PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar o PDF do orçamento:', error);
      toast.dismiss();
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  // Componente para controles de paginação
  const Pagination = () => {
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Mostrando {getCurrentItems().length} de {filteredQuotations.length} orçamentos
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
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            Lista de Orçamentos
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
                onChange={(e) => filterQuotations(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto px-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum orçamento encontrado.</p>
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
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentItems().map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {quotation.client_name}
                        <div className="text-xs text-gray-500">Código: {quotation.auth_code}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatLocalDate(quotation.service_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {quotation.car_model}
                        <div className="text-xs font-medium">{quotation.car_plate}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatService(quotation)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(quotation.service_value)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleGenerateInvoice(quotation)}
                            className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors"
                            title="Gerar PDF"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleApproveQuotation(quotation.id)}
                            className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors"
                            title="Aprovar orçamento"
                          >
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => onEdit(quotation)}
                            className="bg-green-100 p-2 rounded-md hover:bg-green-200 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(quotation.id)}
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
          {!loading && filteredQuotations.length > 0 && (
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