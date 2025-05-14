import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Save, DollarSign, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { CatalogService } from '../types';

interface CatalogServicePageProps {
  isOpen: boolean;
  onClose: () => void;
  tenant_id: string;
}

export function CatalogServicePage({ isOpen, onClose, tenant_id }: CatalogServicePageProps) {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const { data, error } = await supabase
        .from('catalog_services')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar serviços do catálogo:', error);
        toast.error('Erro ao carregar os serviços do catálogo');
        setLoadError('Não foi possível carregar os serviços do catálogo. Por favor, tente novamente.');
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços do catálogo:', error);
      toast.error('Erro ao carregar os serviços do catálogo');
      setLoadError('Ocorreu um erro ao carregar os serviços do catálogo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen, tenant_id]);

  const openForm = (service?: CatalogService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        value: service.value.toString()
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        value: ''
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serviceData = {
        name: formData.name,
        value: parseFloat(formData.value),
        tenant_id
      };

      if (editingService) {
        // Atualizando um serviço existente
        const { error } = await supabase
          .from('catalog_services')
          .update({
            ...serviceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) {
          console.error('Erro ao atualizar serviço:', error);
          toast.error('Erro ao atualizar o serviço');
          return;
        }

        toast.success('Serviço atualizado com sucesso!');
      } else {
        // Criando um novo serviço
        const { error } = await supabase
          .from('catalog_services')
          .insert([{
            ...serviceData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Erro ao criar serviço:', error);
          toast.error('Erro ao criar o serviço');
          return;
        }

        toast.success('Serviço criado com sucesso!');
      }

      fetchServices();
      closeForm();
      
      // Disparar um evento customizado para atualizar os serviços no formulário
      window.dispatchEvent(new CustomEvent('catalogUpdated'));
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast.error('Erro ao salvar o serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      // Verificar se o serviço está sendo usado em alguma OS
      const { data: usedServices, error: usedError } = await supabase
        .from('services')
        .select('id')
        .eq('service_id', id)
        .limit(1);

      if (usedError) {
        console.error('Erro ao verificar uso do serviço:', usedError);
        toast.error('Erro ao verificar uso do serviço');
        return;
      }

      if (usedServices && usedServices.length > 0) {
        toast.error('Este serviço não pode ser excluído pois está sendo usado em uma ou mais ordens de serviço.');
        return;
      }

      const { error } = await supabase
        .from('catalog_services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir serviço:', error);
        toast.error('Erro ao excluir o serviço');
        return;
      }

      toast.success('Serviço excluído com sucesso!');
      fetchServices();
      
      // Disparar um evento customizado para atualizar os serviços no formulário
      window.dispatchEvent(new CustomEvent('catalogUpdated'));
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir o serviço');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Bookmark className="w-5 h-5 mr-2" />
            Catálogo de Serviços
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] bg-gray-50">
          {isFormOpen ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-emerald-600" />
                  Valor do Serviço
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
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
                      {editingService ? 'Atualizando...' : 'Cadastrando...'}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="w-4 h-4 mr-1" />
                      {editingService ? 'Atualizar' : 'Cadastrar'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={() => openForm()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Serviço
                </button>
              </div>

              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {loadError && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{loadError}</p>
                      <div className="mt-2">
                        <button
                          onClick={fetchServices}
                          className="text-sm text-red-700 font-medium hover:text-red-600 underline"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && !loadError && services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.
                </div>
              ) : !isLoading && !loadError && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome do Serviço
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {service.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openForm(service)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 