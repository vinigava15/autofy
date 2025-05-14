import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Pencil, Trash2, Plus, Search, PieChart, FileText, LogOut, User, Filter, AlertCircle, Bookmark, X, DollarSign, Inbox, PiggyBank } from 'lucide-react';
import { ServiceForm } from './components/ServiceForm';
import { FinanceDashboard } from './components/FinanceDashboard';
import { Service } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';
import { generateAndDownloadPDF } from './lib/generateInvoicePDF';
import { AuthPage } from './pages/AuthPage';
import { AdvancedSearchPage } from './pages/AdvancedSearchPage';
import { CatalogServicePage } from './pages/CatalogServicePage';
import { useAuth } from './contexts/AuthContext';

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
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

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
      
      // Primeiro, buscar todos os serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', user.id)
        .order('service_date', { ascending: false });

      if (servicesError) {
        console.error('Erro detalhado ao buscar serviços:', servicesError);
        toast.error('Erro ao carregar os serviços');
        setLoadingError('Erro ao carregar os serviços');
        return;
      }
      
      // Array para armazenar os serviços processados
      const processedServices = [];
      
      // Para cada serviço, buscar o serviço do catálogo correspondente, se existir
      for (const service of servicesData || []) {
        let catalogService = null;
        
        if (service.service_id) {
          // Buscar o serviço do catálogo correspondente
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog_services')
            .select('id, name, value')
            .eq('id', service.service_id)
            .single();
            
          if (!catalogError && catalogData) {
            catalogService = catalogData;
          }
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
          auth_code: authCode,
          service_date: standardizedDate
        });
      }
      
      setServices(processedServices);
      
      // Mostrar apenas os 10 serviços mais recentes quando não há busca
      const recentServices = processedServices.slice(0, 10);
      setFilteredServices(recentServices);
      
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
      // Se o termo de busca estiver vazio, mostrar apenas os 10 serviços mais recentes
      const recentServices = services.slice(0, 10);
      setFilteredServices(recentServices);
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

  const handleAdvancedSearchSuccess = () => {
    console.log('Fechando busca avançada');
    setIsAdvancedSearchOpen(false);
    
    // Verificar se há um serviço para edição no localStorage
    const editingServiceJson = localStorage.getItem('editingService');
    if (editingServiceJson) {
      try {
        const service = JSON.parse(editingServiceJson);
        setEditingService(service);
        setIsFormOpen(true);
        localStorage.removeItem('editingService');
      } catch (error) {
        console.error('Erro ao processar serviço para edição:', error);
      }
    }
    
    // Recarregar os serviços para atualizar a lista
    setTimeout(() => {
      fetchServices();
    }, 100);
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

  // Função para formatar o serviço para exibição na tabela
  const formatService = (service: Service): string => {
    // Verificar se temos uma lista de serviços selecionados
    if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
      // Se tivermos catalog_services (resultado de JOIN)
      if (service.catalog_services && Array.isArray(service.catalog_services)) {
        return service.catalog_services.map((s: any) => s.name).join(', ');
      }
      
      // Caso tenhamos serviços em um campo services
      if (service.services && Array.isArray(service.services)) {
        return service.services.map((s: any) => s.name).join(', ');
      }
      
      // Se tivermos apenas os IDs dos serviços e o service com o nome
      if (service.service?.name) {
        return `${service.service.name}${service.selected_services.length > 1 ? ' e mais...' : ''}`;
      }
    }

    // Se o serviço do catálogo estiver disponível, mostrar o nome (formato antigo)
    if (service.service?.name) {
      return service.service.name;
    }
    
    // Mantendo o código para compatibilidade com dados antigos (peças reparadas)
    if (!service.repaired_parts) return '-';
    
    // Se não for um array, tenta converter para array se possível
    let partsArray: string[] = [];
    
    if (Array.isArray(service.repaired_parts)) {
      partsArray = service.repaired_parts;
    } else if (typeof service.repaired_parts === 'string') {
      partsArray = [service.repaired_parts];
    } else if (typeof service.repaired_parts === 'object') {
      try {
        // Tenta extrair valores se for um objeto
        const values = Object.values(service.repaired_parts).filter(Boolean);
        partsArray = values.map(val => String(val));
      } catch (e) {
        return '-';
      }
    } else {
      return '-';
    }
    
    const formattedParts = partsArray
      .filter(part => part !== null && part !== undefined)
      .map(part => {
        const partStr = String(part).trim();
        if (!partStr) return '';
        return partStr.charAt(0).toUpperCase() + partStr.slice(1).toLowerCase();
      })
      .filter(part => part !== '');
    
    return formattedParts.length > 0 ? formattedParts.join(', ') : '-';
  };

  // Função para gerar a nota fiscal em PDF
  const handleGenerateInvoice = async (service: Service) => {
    try {
      toast.loading('Gerando nota fiscal...');
      
      // Preparar dados para o PDF
      const serviceToUse = {
        ...service,
        // Para compatibilidade com o gerador de PDF existente
        repaired_parts: service.service?.name 
          ? [service.service.name] 
          : (Array.isArray(service.repaired_parts) 
              ? service.repaired_parts.filter(part => part && typeof part === 'string')
              : []),
        auth_code: service.auth_code || `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
      
      // Chamar a função aprimorada que tenta múltiplos métodos
      const success = await generateAndDownloadPDF(serviceToUse);
      
      toast.dismiss();
      if (success) {
        toast.success('Nota fiscal gerada com sucesso!');
      } else {
        toast.error('Erro ao gerar a nota fiscal. Tente novamente.');
      }
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
            className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-blue-500 transition-colors flex items-center"
            title="Sair"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mostra Busca Avançada ou Tela Principal dependendo do estado */}
        {isAdvancedSearchOpen ? (
          /* Tela de Busca Avançada */
          <div>
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setIsAdvancedSearchOpen(false)}
                className="flex items-center text-blue-600 hover:text-blue-800"
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="w-full sm:flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 text-sm border-gray-300 rounded-md py-2"
                      placeholder="Buscar cliente ou placa..."
                      value={searchTerm}
                      onChange={(e) => filterServices(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <button
                    onClick={() => setIsAdvancedSearchOpen(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                  >
                    <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Filtrar</span>
                    <span className="xs:hidden">Filtrar</span>
                  </button>
                   
                  <button
                    onClick={() => setIsCatalogServiceOpen(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                  >
                    <Bookmark className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Cat</span>
                    <span className="xs:hidden">Cat</span>
                  </button>
                  
                  <button
                    onClick={() => setIsDashboardOpen(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                  >
                    <PieChart className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Stats</span>
                    <span className="xs:hidden">Stats</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsDashboardOpen(true);
                      localStorage.setItem('openExpenseForm', 'true');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                  >
                    <Inbox className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Desp</span>
                    <span className="xs:hidden">Desp</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsDashboardOpen(true);
                      localStorage.setItem('openIncomeForm', 'true');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
                  >
                    <PiggyBank className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Ganhos</span>
                    <span className="xs:hidden">Ganhos</span>
                  </button>
                  
                  <button
                    onClick={() => { setIsFormOpen(true); setEditingService(undefined); }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Novo</span>
                    <span className="xs:hidden">Novo</span>
                  </button>
                </div>
              </div>
            </div>
        
            {/* Status message */}
            {loadingError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex justify-between items-center">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Erro ao carregar os serviços</p>
                    <p className="text-sm text-red-700">Erro ao carregar os serviços</p>
                  </div>
                </div>
                <button 
                  onClick={clearLoadingError}
                  className="px-4 py-2 text-sm text-white font-medium bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            
            {/* Services table */}
            <div className="bg-white shadow-md overflow-hidden rounded-lg border border-gray-100">
              {/* Versão para desktop */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Veículo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Serviços
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.length === 0 && !loadingError ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Nenhum serviço cadastrado. Clique no botão "Novo" para começar.
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((service) => {
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
                        
                        return (
                          <tr key={service.id} className={rowClass}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {service.client_name}
                              <div className="text-xs text-gray-500">Código: {service.auth_code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatLocalDate(service.service_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {service.car_model}
                              <div className="text-xs font-medium">{service.car_plate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatService(service)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.service_value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {renderStatusBadge(service.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleGenerateInvoice(service)}
                                  className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors"
                                  title="Gerar nota fiscal"
                                >
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleEdit(service)}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  );
}

export default App;