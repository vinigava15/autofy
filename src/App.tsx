import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Pencil, Trash2, Plus, Search, PieChart, FileText, LogOut, User, Filter, AlertCircle, Bookmark, X, DollarSign, Target, List, Kanban, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ServiceForm } from './components/ServiceForm';
import { FinanceDashboard } from './components/FinanceDashboard';
import { Service } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { CatalogServicePage } from './pages/CatalogServicePage';
import { useAuth } from './contexts/AuthContext';
import { ClientSourceAnalytics } from './components/ClientSourceAnalytics';
import { KanbanBoard } from './components/KanbanBoard';
import { QuotationsList } from './components/QuotationsList';
import { CompletedServicesList } from './components/CompletedServicesList';
import { ServiceCard } from './components/ui/ServiceCard';
import { formatService } from './utils/serviceFormatters';

const formatLocalDate = (dateString: string) => {
  // Garantir que a data seja tratada como meio-dia UTC para evitar problemas de fuso horárioooo
  const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
  return format(date, 'dd/MM/yyyy', { locale: pt });
};

function App() {
  const { user, loading, signOut } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isCatalogServiceOpen, setIsCatalogServiceOpen] = useState(false);
  const [isSourceAnalyticsOpen, setIsSourceAnalyticsOpen] = useState(false);
  const [isQuotationsOpen, setIsQuotationsOpen] = useState(false);
  const [isCompletedServicesOpen, setIsCompletedServicesOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;

  // Buscar o perfil do usuário
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      setLoadingError(null);
      
      // Buscar serviços, excluindo orçamentos e também serviços concluídos e pagos
      // Usamos or() para filtrar serviços que NÃO são simultaneamente pagos E concluídos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', user.id)
        .neq('status', 'orcamento') // Não buscar orçamentos
        .or('status.neq.pago,completion_status.neq.concluido') // Mostrar serviços que não são pagos OU não são concluídos
        .order('service_date', { ascending: false });

      if (servicesError) {
        console.error('Erro detalhado ao buscar serviços:', servicesError);
        toast.error('Erro ao carregar os serviços');
        setLoadingError('Erro ao carregar os serviços');
        return;
      }
      
      // Array para armazenar os serviços processados
      const processedServices = [];
      
      // Para cada serviço, buscar informações adicionais
      for (const service of servicesData || []) {
        let catalogService = null;
        let catalogServices: any[] = [];
        let photos: any[] = [];
        
        // Buscar o serviço do catálogo correspondente, se existir
        if (service.service_id) {
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog_services')
            .select('id, name, value')
            .eq('id', service.service_id)
            .single();
            
          if (!catalogError && catalogData) {
            catalogService = catalogData;
          }
        }
        
        // Buscar todos os serviços do catálogo selecionados, se houver
        if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog_services')
            .select('id, name, value')
            .in('id', service.selected_services);
            
          if (!catalogError && catalogData) {
            catalogServices = catalogData;
          }
        }
        
        // Buscar fotos do veículo, se houver
        const { data: photosData, error: photosError } = await supabase
          .from('vehicle_photos')
          .select('id, url, description, created_at')
          .eq('service_id', service.id)
          .eq('tenant_id', user.id);
          
        if (!photosError && photosData) {
          photos = photosData;
        }
        
        // Padronizar o formato da data para evitar problemas de fuso horário
        let standardizedDate = service.service_date;
        
        // Se a data não tiver o horário fixado em 12:00, ajuste para o formato padronizado
        if (standardizedDate && !standardizedDate.includes('T12:00:00')) {
          standardizedDate = `${standardizedDate.split('T')[0]}T12:00:00`;
        }

        // Garantir que auth_code seja uma string válida
        const authCode = service.auth_code || `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Adicionar o serviço processado ao array
        processedServices.push({
          ...service,
          service: catalogService,
          catalog_services: catalogServices,
          auth_code: authCode,
          service_date: standardizedDate,
          photos: photos
        });
      }
      
      setServices(processedServices);
      
      // Iniciar mostrando todos os serviços (serão limitados pela paginação na interface)
      setFilteredServices(processedServices);
      // Resetar para a primeira página quando carregar novos serviços
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast.error('Erro ao carregar os serviços');
      setLoadingError('Erro ao carregar os serviços. Por favor, tente novamente.');
    }
  };

  // Função para filtrar serviços baseado no termo de busca
  const filterServices = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      // Se o termo de busca estiver vazio, mostrar todos os serviços (paginados)
      setFilteredServices(services);
      setCurrentPage(1);
      return;
    }
    
    // Converter para minúsculas para comparação case-insensitive
    const termLower = term.toLowerCase();
    
    // Filtrar todos os serviços que contêm o termo no nome do cliente ou na placa
    const filtered = services.filter(service => 
      service.client_name.toLowerCase().includes(termLower) || 
      service.car_plate.toLowerCase().includes(termLower)
    );
    
    setFilteredServices(filtered);
    setCurrentPage(1); // Resetar para a primeira página ao buscar
  };

  // Função para obter os serviços da página atual
  const getCurrentPageServices = () => {
    const indexOfLastService = currentPage * servicesPerPage;
    const indexOfFirstService = indexOfLastService - servicesPerPage;
    return filteredServices.slice(indexOfFirstService, indexOfLastService);
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchServices();
    }
  }, [user]);

  // Efeito para escutar o evento para abrir o catálogo
  useEffect(() => {
    const handleOpenCatalog = () => {
      // Verificar se a flag foi definida no localStorage
      const shouldOpen = localStorage.getItem('openCatalog');
      if (shouldOpen === 'true') {
        setIsCatalogServiceOpen(true);
        localStorage.removeItem('openCatalog');
      }
    };

    // Adicionar o listener para o evento customizado
    window.addEventListener('openCatalog', handleOpenCatalog);

    // Verificar também no carregamento inicial
    handleOpenCatalog();

    // Cleanup
    return () => {
      window.removeEventListener('openCatalog', handleOpenCatalog);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('tenant_id', user?.id);

      if (error) {
        console.error('Erro detalhado ao excluir serviço:', error);
        toast.error('Erro ao excluir o serviço');
        return;
      }

      toast.success('Serviço excluído com sucesso!');
      fetchServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir o serviço');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
    fetchServices();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Não exibir toast de erro para não confundir o usuário
      // O AuthContext já trata a limpeza do estado mesmo em caso de erro
    }
  };

  // Função para gerar a nota fiscal em PDF
  const handleGenerateInvoice = async (service: Service) => {
    try {
      toast.loading('Gerando nota fiscal...');
      
      // Primeiro, carregar detalhes dos serviços selecionados
      const { loadServiceDetails } = await import('./lib/serviceUtils');
      
      // Carregar detalhes completos dos serviços selecionados
      const serviceWithDetails = await loadServiceDetails(service);
      console.log('Serviço com detalhes carregados:', serviceWithDetails);
      
      // Importar as funções necessárias
      const { serviceToNotaFiscal, generateInvoicePDF } = await import('./lib/generateInvoicePDF');
      
      // Converter o serviço para o formato de nota fiscal
      const notaFiscal = serviceToNotaFiscal(serviceWithDetails);
      console.log('Nota fiscal gerada:', notaFiscal);
      
      // Gerar e baixar o PDF
      generateInvoicePDF(notaFiscal);
      
      toast.dismiss();
      toast.success('Nota fiscal gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar a nota fiscal:', error);
      toast.dismiss();
      toast.error('Erro ao gerar a nota fiscal. Tente novamente.');
    }
  };

  // Função para limpar o erro de carregamento
  const clearLoadingError = () => {
    setLoadingError(null);
    fetchServices();
  };

  // Função para marcar serviço como pago rapidamente
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
        .eq('tenant_id', user?.id);

      if (error) {
        console.error('Erro ao atualizar status do serviço:', error);
        toast.dismiss();
        toast.error('Erro ao atualizar status do serviço');
        return;
      }

      toast.dismiss();
      toast.success('Serviço marcado como pago!');
      fetchServices();
    } catch (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar status do serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Interface principal padrão
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <header className="bg-blue-600 text-white shadow py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-lg font-semibold flex items-center">
          AutoFy
        </h1>
        <div className="flex space-x-2">
          {userProfile && (
            <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-500 bg-opacity-30 flex items-center">
              <User className="w-4 h-4 mr-1 text-white" />
              <span className="hidden sm:inline">{userProfile.email || userProfile.name || user?.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-blue-500 transition-colors flex items-center touch-action-button"
            title="Sair"
          >
            <LogOut className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="max-w-screen-2xl mx-auto px-[25px] py-8">
        {/* Mostra Busca Avançada ou Tela Principal dependendo do estado */}
        {isAdvancedSearchOpen ? (
          /* Tela de Busca Avançada */
          <div>
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setIsAdvancedSearchOpen(false)}
                className="flex items-center text-blue-600 hover:text-blue-800 touch-action-button"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-lg font-semibold">Busca Avançada</span>
              </button>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Search className="w-5 h-5 mr-2 text-gray-400" />
                <h2 className="text-lg font-medium">Filtros</h2>
                <button 
                  className="ml-auto text-gray-500 hover:text-gray-700 flex items-center text-sm"
                  onClick={() => {
                    // Resetar filtros
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                  <select className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Todos os meses</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar cliente..."
                      className="w-full border border-gray-300 rounded-md shadow-sm pl-10 pr-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar modelo..."
                      className="w-full border border-gray-300 rounded-md shadow-sm pl-10 pr-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar placa..."
                      className="w-full border border-gray-300 rounded-md shadow-sm pl-10 pr-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Loading indicator */}
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        ) : (
          /* Tela Principal */
          <>
            {/* Toolbar */}
            <div className="bg-white shadow-md rounded-lg mb-6 p-4 border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
                <div className="flex w-full lg:w-auto mb-4 lg:mb-0">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por cliente ou placa..."
                      className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => filterServices(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setIsAdvancedSearchOpen(true)}
                    className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md flex items-center touch-action-button"
                    title="Busca Avançada"
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 lg:space-x-2 w-full lg:w-auto">
                  {/* Botões de alternância de visualização */}
                  <div className="flex border border-gray-300 rounded-md overflow-hidden col-span-2 sm:col-span-1">
                    <button
                      className={`flex-1 px-3 py-2 flex items-center justify-center ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setViewMode('table')}
                      title="Visualização em tabela"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      className={`flex-1 px-3 py-2 flex items-center justify-center ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setViewMode('kanban')}
                      title="Visualização Kanban"
                    >
                      <Kanban className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Novo</span>
                  </button>
                  <button
                    onClick={() => setIsQuotationsOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                  >
                    <Clock className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Orçamentos</span>
                  </button>
                  <button
                    onClick={() => setIsCompletedServicesOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                  >
                    <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Concluídos</span>
                  </button>
                  <button
                    onClick={() => setIsCatalogServiceOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                  >
                    <Bookmark className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Catálogo</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsDashboardOpen(true)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                    >
                      <PieChart className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Financeiro</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setIsSourceAnalyticsOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
                  >
                    <Target className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Captação</span>
                  </button>
                </div>
              </div>
            </div>
        
            {/* Status message */}
            {loadingError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {loadingError}
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={clearLoadingError}
                        className="text-sm text-red-700 font-medium underline hover:text-red-600"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Services table */}
            {loadingError ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {loadingError}
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={clearLoadingError}
                        className="text-sm text-red-700 font-medium underline hover:text-red-600"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              viewMode === 'table' ? (
                // Visualização em tabela (atual)
                <div className="mt-4">
                  <div className="responsive-table hidden md:block">
                    <table className="w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%] sm:w-[13%]">
                            Cliente
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] sm:w-[8%]">
                            Data
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%] sm:w-[13%]">
                            Veículo
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full sm:w-[18%]">
                            Serviço
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                            Valor
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                            Status
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                            Progresso
                          </th>
                          <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%] sm:w-[18%]">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getCurrentPageServices().length === 0 && !loadingError ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                              Nenhum serviço cadastrado. Clique no botão "Novo" para começar.
                            </td>
                          </tr>
                        ) : (
                          getCurrentPageServices().map((service) => {
                            // Determinar a classe de cor da linha com base no status
                            let rowClass = "hover:bg-gray-50 transition-colors";
                            if (service.status === 'orcamento') {
                              rowClass = "bg-blue-50 hover:bg-blue-100 transition-colors";
                            } else if (service.status === 'nao_pago') {
                              rowClass = "bg-red-50 hover:bg-red-100 transition-colors";
                            }
                            
                            // Renderizar o indicador de status
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
                            
                            // Renderizar o indicador de status de conclusão
                            const renderCompletionBadge = (status?: string) => {
                              if (!status) return null;
                              
                              let badgeClass = '';
                              let statusText = '';
                              
                              switch (status) {
                                case 'concluido':
                                  badgeClass = 'bg-green-100 text-green-800 border-green-200';
                                  statusText = 'Concluído';
                                  break;
                                case 'em_andamento':
                                  badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                  statusText = 'Em Andamento';
                                  break;
                                case 'nao_iniciado':
                                  badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
                                  statusText = 'Não Iniciado';
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
                            
                            return (
                              <tr key={service.id} className={rowClass}>
                                <td className="px-2 py-4 text-sm font-medium text-gray-900 break-words">
                                  {service.client_name}
                                  <div className="text-xs text-gray-500">Código: {service.auth_code}</div>
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-500 break-words">
                                  {formatLocalDate(service.service_date)}
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-500 break-words">
                                  {service.car_model}
                                  <div className="text-xs font-medium">{service.car_plate}</div>
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-500 break-words">
                                  {formatService(service)}
                                </td>
                                <td className="px-2 py-4 text-sm font-medium text-gray-900 break-words">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.service_value)}
                                </td>
                                <td className="px-2 py-4 text-sm">
                                  {renderStatusBadge(service.status)}
                                </td>
                                <td className="px-2 py-4 text-sm">
                                  {renderCompletionBadge(service.completion_status)}
                                </td>
                                <td className="px-2 py-4 text-sm font-medium">
                                  <div className="flex justify-end items-center space-x-3 md:space-x-3">
                                    {service.status === 'nao_pago' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsPaid(service.id);
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center transition-colors touch-action-button my-1"
                                        title="Marcar como pago"
                                      >
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        <span>Pagar</span>
                                      </button>
                                    )}
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleGenerateInvoice(service)}
                                        className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors touch-action-button my-1"
                                        title="Gerar nota fiscal"
                                      >
                                        <FileText className="w-4 h-4 text-blue-600" />
                                      </button>
                                      <button
                                        onClick={() => handleEdit(service)}
                                        className="bg-green-100 p-2 rounded-md hover:bg-green-200 transition-colors touch-action-button my-1"
                                        title="Editar"
                                      >
                                        <Pencil className="w-4 h-4 text-green-600" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(service.id)}
                                        className="bg-red-100 p-2 rounded-md hover:bg-red-200 transition-colors touch-action-button my-1"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Visualização em cartões para dispositivos móveis */}
                  <div className="md:hidden space-y-4">
                    {getCurrentPageServices().length === 0 && !loadingError ? (
                      <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
                        Nenhum serviço cadastrado. Clique no botão "Novo" para começar.
                      </div>
                    ) : (
                      getCurrentPageServices().map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onMarkAsPaid={handleMarkAsPaid}
                          onGenerateInvoice={handleGenerateInvoice}
                          formatService={formatService}
                        />
                      ))
                    )}
                  </div>

                  {/* Controles de paginação */}
                  {filteredServices.length > servicesPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-500 mb-3 sm:mb-0">
                        Mostrando {getCurrentPageServices().length} de {filteredServices.length} serviços
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`p-2 rounded touch-action-button ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-1 overflow-x-auto">
                          {Array.from({ length: Math.min(5, Math.ceil(filteredServices.length / servicesPerPage)) }, (_, i) => {
                            // Lógica para mostrar páginas ao redor da atual
                            let pageNum = i + 1;
                            const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
                            
                            if (totalPages > 5) {
                              if (currentPage <= 3) {
                                // No início, mostrar 1, 2, 3, 4, 5
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                // No final, mostrar últimas 5 páginas
                                pageNum = totalPages - 4 + i;
                              } else {
                                // No meio, mostrar 2 antes e 2 depois da atual
                                pageNum = currentPage - 2 + i;
                              }
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`min-w-[36px] h-9 px-3 py-1 rounded touch-action-button ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredServices.length / servicesPerPage)))}
                          disabled={currentPage === Math.ceil(filteredServices.length / servicesPerPage)}
                          className={`p-2 rounded touch-action-button ${
                            currentPage === Math.ceil(filteredServices.length / servicesPerPage)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Visualização Kanban
                <KanbanBoard 
                  services={filteredServices}
                  onServiceSelect={handleEdit}
                  onServicesUpdate={fetchServices}
                />
              )
            )}
          </>
        )}
      </main>
      
      {/* Modais */}
      {isFormOpen && (
        <ServiceForm
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingService(undefined); }}
          onSuccess={handleFormSuccess}
          service={editingService}
          tenant_id={user.id}
        />
      )}
      
      {isDashboardOpen && (
        <FinanceDashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          tenant_id={user.id}
        />
      )}
      
      {isCatalogServiceOpen && (
        <CatalogServicePage
          isOpen={isCatalogServiceOpen}
          onClose={() => setIsCatalogServiceOpen(false)}
          tenant_id={user.id}
        />
      )}
      
      {isSourceAnalyticsOpen && user && (
        <ClientSourceAnalytics
          isOpen={isSourceAnalyticsOpen}
          onClose={() => setIsSourceAnalyticsOpen(false)}
          userId={user.id}
        />
      )}
      
      {isQuotationsOpen && (
        <QuotationsList
          isOpen={isQuotationsOpen}
          onClose={() => setIsQuotationsOpen(false)}
          onEdit={handleEdit}
          tenant_id={user.id}
        />
      )}
      
      {isCompletedServicesOpen && (
        <CompletedServicesList
          isOpen={isCompletedServicesOpen}
          onClose={() => setIsCompletedServicesOpen(false)}
          onEdit={handleEdit}
          tenant_id={user.id}
        />
      )}
    </div>
  );
}

export default App;