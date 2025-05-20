import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  userProfile: any;
  onLogout: () => void;
}

/**
 * Componente de cabeçalho da aplicação
 */
export const Header: React.FC<HeaderProps> = ({ userProfile, onLogout }) => {
  return (
    <header className="bg-blue-600 text-white shadow py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-10">
      <h1 className="text-lg font-semibold flex items-center">
        AutoFy
      </h1>
      <div className="flex space-x-2">
        {userProfile && (
          <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-500 bg-opacity-30 flex items-center">
            <User className="w-4 h-4 mr-1 text-white" />
            <span className="hidden sm:inline">{userProfile.email || userProfile.name}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-blue-500 transition-colors flex items-center touch-action-button"
          title="Sair"
        >
          <LogOut className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}; 