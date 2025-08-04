/**
 * Componente de navegação mobile - Interface simplificada para dispositivos móveis
 * Layout limpo com botões organizados verticalmente, ocupando toda largura
 */

import React from 'react';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  PieChart, 
  Target, 
  Filter, 
  List, 
  Kanban,
  LogOut,
  User
} from 'lucide-react';

export interface NavigationAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

interface MobileNavigationProps {
  actions: NavigationAction[];
  userProfile?: {
    full_name: string;
    company_name: string;
    email: string;
  } | null;
  onSignOut: () => void;
}

const getButtonStyles = (variant: NavigationAction['variant'] = 'secondary') => {
  const baseStyles = "w-full p-4 rounded-lg shadow-sm border transition-all duration-200 flex items-center space-x-4 text-left active:scale-[0.98]";
  
  switch (variant) {
    case 'primary':
      return `${baseStyles} bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:bg-blue-800`;
    case 'outline':
      return `${baseStyles} bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100`;
    case 'secondary':
    default:
      return `${baseStyles} bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:bg-gray-100`;
  }
};

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  actions,
  userProfile,
  onSignOut
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header principal da aplicação */}
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="p-4">
          <h1 className="text-xl font-bold text-center">
            AutoFy
          </h1>
          <p className="text-blue-100 text-sm text-center mt-1">
            Sistema de Gestão Automotiva
          </p>
        </div>
        
        {/* Informações do usuário */}
        {userProfile && (
          <div className="bg-blue-700 bg-opacity-50 p-4 border-t border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate">
                  {userProfile.full_name}
                </h2>
                <p className="text-sm text-blue-200 truncate">
                  {userProfile.company_name}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 text-blue-200 hover:text-white transition-colors rounded-md hover:bg-blue-600"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navegação principal */}
      <div className="flex-1 p-4">
        <div className="space-y-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={getButtonStyles(action.variant)}
            >
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium truncate">
                  {action.title}
                </h3>
                <p className={`text-sm truncate ${
                  action.variant === 'primary' 
                    ? 'text-white text-opacity-80' 
                    : 'text-gray-500'
                }`}>
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer com informações adicionais */}
      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          AutoFy - Sistema de Gestão Automotiva
        </p>
      </div>
    </div>
  );
};

// Factory function para criar ações padronizadas
export const createNavigationAction = (
  id: string,
  title: string,
  description: string,
  icon: React.ReactNode,
  onClick: () => void,
  variant: NavigationAction['variant'] = 'secondary'
): NavigationAction => ({
  id,
  title,
  description,
  icon,
  onClick,
  variant
});

// Ações pré-definidas para reutilização
export const MobileNavigationActions = {
  newService: (onClick: () => void) => createNavigationAction(
    'new-service',
    'Novo Serviço',
    'Cadastrar um novo serviço para cliente',
    <Plus className="w-6 h-6 text-current" />,
    onClick,
    'primary'
  ),

  quotations: (onClick: () => void) => createNavigationAction(
    'quotations',
    'Orçamentos',
    'Visualizar e gerenciar orçamentos pendentes',
    <Clock className="w-6 h-6 text-current" />,
    onClick
  ),

  completedServices: (onClick: () => void) => createNavigationAction(
    'completed-services',
    'Serviços Concluídos',
    'Listar todos os serviços finalizados',
    <CheckCircle2 className="w-6 h-6 text-current" />,
    onClick
  ),

  catalog: (onClick: () => void) => createNavigationAction(
    'catalog',
    'Catálogo de Serviços',
    'Gerenciar tipos de serviços oferecidos',
    <Bookmark className="w-6 h-6 text-current" />,
    onClick
  ),

  financial: (onClick: () => void) => createNavigationAction(
    'financial',
    'Dashboard Financeiro',
    'Relatórios e análise financeira',
    <PieChart className="w-6 h-6 text-current" />,
    onClick
  ),

  analytics: (onClick: () => void) => createNavigationAction(
    'analytics',
    'Análise de Captação',
    'Origem dos clientes e métricas',
    <Target className="w-6 h-6 text-current" />,
    onClick
  ),

  advancedSearch: (onClick: () => void) => createNavigationAction(
    'advanced-search',
    'Busca Avançada',
    'Pesquisa detalhada de serviços',
    <Filter className="w-6 h-6 text-current" />,
    onClick
  ),

  listView: (onClick: () => void, isActive: boolean = false) => createNavigationAction(
    'list-view',
    'Visualização em Lista',
    'Ver serviços organizados em tabela',
    <List className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-current'}`} />,
    onClick,
    isActive ? 'outline' : 'secondary'
  ),

  kanbanView: (onClick: () => void, isActive: boolean = false) => createNavigationAction(
    'kanban-view',
    'Visualização Kanban',
    'Organizar serviços por status em cards',
    <Kanban className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-current'}`} />,
    onClick,
    isActive ? 'outline' : 'secondary'
  )
};