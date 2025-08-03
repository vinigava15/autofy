/**
 * Layout principal para dispositivos móveis
 * Gerencia a renderização condicional entre interface mobile e desktop
 * Inclui navegação entre diferentes telas mobile (menu, lista, kanban)
 */

import React, { useState } from 'react';
import { MobileNavigation, MobileNavigationActions, NavigationAction } from './MobileNavigation';
import { MobileServiceList } from './MobileServiceList';
import { MobileKanbanBoard } from './MobileKanbanBoard';
import { useScreenSize } from '../../hooks/useScreenSize';
import { Service } from '../../types';

// Tipos de tela que podem ser exibidas no mobile
type MobileScreen = 'navigation' | 'list' | 'kanban';

interface MobileLayoutProps {
  // Props para controle de modais/páginas
  onNewService: () => void;
  onQuotations: () => void;
  onCompletedServices: () => void;
  onCatalog: () => void;
  onFinancial: () => void;
  onAnalytics: () => void;
  onAdvancedSearch: () => void;
  
  // Props para controle de visualização
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
  
  // Props do usuário
  userProfile?: {
    full_name: string;
    company_name: string;
    email: string;
  } | null;
  onSignOut: () => void;
  
  // Props para os dados dos serviços
  services: Service[];
  onServiceEdit: (service: Service) => void;
  onServiceDelete: (id: string) => void;
  onGenerateInvoice: (service: Service) => void;
  onServicesUpdate: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  
  // Layout desktop como fallback
  desktopLayout: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  onNewService,
  onQuotations,
  onCompletedServices,
  onCatalog,
  onFinancial,
  onAnalytics,
  onAdvancedSearch,
  onViewModeChange,
  userProfile,
  onSignOut,
  services,
  onServiceEdit,
  onServiceDelete,
  onGenerateInvoice,
  onServicesUpdate,
  searchTerm,
  onSearchChange,
  desktopLayout
}) => {
  const { isMobile } = useScreenSize();
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('navigation');

  // Se não for mobile, renderizar layout desktop
  if (!isMobile) {
    return <>{desktopLayout}</>;
  }

  // Funções para navegar entre telas
  const showListView = () => {
    onViewModeChange('table');
    setCurrentScreen('list');
  };

  const showKanbanView = () => {
    onViewModeChange('kanban');
    setCurrentScreen('kanban');
  };

  const backToNavigation = () => {
    setCurrentScreen('navigation');
  };

  // Renderizar a tela atual
  if (currentScreen === 'list') {
    return (
      <MobileServiceList
        services={services}
        onBack={backToNavigation}
        onServiceEdit={onServiceEdit}
        onServiceDelete={onServiceDelete}
        onGenerateInvoice={onGenerateInvoice}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
    );
  }

  if (currentScreen === 'kanban') {
    return (
      <MobileKanbanBoard
        services={services}
        onBack={backToNavigation}
        onServiceEdit={onServiceEdit}
        onServicesUpdate={onServicesUpdate}
      />
    );
  }

  // Tela de navegação principal (padrão)
  const navigationActions: NavigationAction[] = [
    // Ação principal - sempre no topo
    MobileNavigationActions.newService(onNewService),
    
    // Visualizações
    MobileNavigationActions.listView(showListView, false),
    MobileNavigationActions.kanbanView(showKanbanView, false),
    
    // Gestão de serviços
    MobileNavigationActions.quotations(onQuotations),
    MobileNavigationActions.completedServices(onCompletedServices),
    
    // Configurações e ferramentas
    MobileNavigationActions.catalog(onCatalog),
    MobileNavigationActions.advancedSearch(onAdvancedSearch),
    
    // Análises e relatórios
    MobileNavigationActions.financial(onFinancial),
    MobileNavigationActions.analytics(onAnalytics),
  ];

  return (
    <MobileNavigation
      actions={navigationActions}
      userProfile={userProfile}
      onSignOut={onSignOut}
    />
  );
};