import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Service, CompletionStatus } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Car, Calendar, DollarSign, CheckCircle2, Clock9, Clock, AlertCircle, ShieldAlert, Image } from 'lucide-react';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  onServicesUpdate: () => void;
}

// Definir as colunas do quadro Kanban
const columns: { id: CompletionStatus; title: string }[] = [
  { id: 'nao_iniciado', title: 'Não Iniciado' },
  { id: 'em_andamento', title: 'Em Andamento' },
  { id: 'concluido', title: 'Concluído' }
];

export function KanbanBoard({ services, onServiceSelect, onServicesUpdate }: KanbanBoardProps) {
  const [groupedServices, setGroupedServices] = useState<Record<CompletionStatus, Service[]>>({
    nao_iniciado: [],
    em_andamento: [],
    concluido: []
  });
  
  // Limite a quantidade de itens em cada coluna para manter a interface organizada
  const maxItemsPerColumn = 10;

  // Agrupar serviços por status de conclusão
  useEffect(() => {
    const grouped: Record<CompletionStatus, Service[]> = {
      nao_iniciado: [],
      em_andamento: [],
      concluido: []
    };

    services.forEach(service => {
      const status = service.completion_status || 'nao_iniciado';
      if (grouped[status]) {
        grouped[status].push(service);
      } else {
        grouped.nao_iniciado.push(service);
      }
    });

    // Garantir que cada coluna tenha no máximo o número definido de itens
    Object.keys(grouped).forEach(key => {
      grouped[key as CompletionStatus] = grouped[key as CompletionStatus].slice(0, maxItemsPerColumn);
    });

    setGroupedServices(grouped);
  }, [services]);

  // Função para formatar a data
  const formatLocalDate = (dateString: string) => {
    const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
    return format(date, 'dd/MM/yyyy', { locale: pt });
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Lidar com o fim do arrastar e soltar
  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    // Se não houver destino (solto fora de uma coluna) ou se o destino for o mesmo que a origem
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Encontrar o serviço arrastado
    const serviceId = draggableId;
    const draggedService = services.find(service => service.id === serviceId);
    
    if (!draggedService) return;

    // Criar uma cópia do state atual
    const newGroupedServices = { ...groupedServices };
    
    // Remover o serviço da coluna de origem
    newGroupedServices[source.droppableId as CompletionStatus] = 
      newGroupedServices[source.droppableId as CompletionStatus].filter(
        service => service.id !== serviceId
      );
    
    // Adicionar o serviço à coluna de destino
    const updatedService = { 
      ...draggedService, 
      completion_status: destination.droppableId as CompletionStatus 
    };
    
    // Inserir no índice correto
    newGroupedServices[destination.droppableId as CompletionStatus].splice(
      destination.index, 
      0, 
      updatedService
    );
    
    // Atualizar o state
    setGroupedServices(newGroupedServices);
    
    // Atualizar no banco de dados
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          completion_status: destination.droppableId,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Serviço movido para ${columns.find(col => col.id === destination.droppableId)?.title}`);
      
      // Recarregar serviços após atualização
      onServicesUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      toast.error('Não foi possível atualizar o status do serviço');
      
      // Reverter alterações no state em caso de erro
      setGroupedServices(prevState => ({
        ...prevState,
        [source.droppableId as CompletionStatus]: [
          ...prevState[source.droppableId as CompletionStatus],
          draggedService
        ],
        [destination.droppableId as CompletionStatus]: 
          prevState[destination.droppableId as CompletionStatus].filter(
            service => service.id !== serviceId
          )
      }));
    }
  };

  // Função para marcar serviço como pago rapidamente
  const handleMarkAsPaid = async (e: React.MouseEvent, serviceId: string) => {
    // Impedir que o clique propague para o card (evita abrir o formulário de edição)
    e.stopPropagation();
    
    try {
      toast.loading('Atualizando status...');
      
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) {
        console.error('Erro ao atualizar status do serviço:', error);
        toast.dismiss();
        toast.error('Erro ao atualizar status do serviço');
        return;
      }

      toast.dismiss();
      toast.success('Serviço marcado como pago!');
      onServicesUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar status do serviço');
    }
  };

  // Renderizar o ícone de status financeiro
  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'nao_pago':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'orcamento':
        return <ShieldAlert className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Obter a cor do card baseado no status financeiro
  const getCardBgColor = (service: Service) => {
    if (service.status === 'orcamento') {
      return 'bg-blue-50 border-blue-200';
    }
    
    if (service.status === 'nao_pago') {
      return 'bg-red-50 border-red-200';
    }
    
    // Default para pagos
    return 'bg-white border-gray-200';
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quadro de Serviços</h2>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => (
            <div key={column.id} className="flex flex-col rounded-lg border border-gray-200 shadow-sm">
              <div className={`p-3 text-center font-medium rounded-t-lg 
                ${column.id === 'nao_iniciado' ? 'bg-gray-100 text-gray-800' : ''}
                ${column.id === 'em_andamento' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${column.id === 'concluido' ? 'bg-green-100 text-green-800' : ''}
              `}>
                <div className="flex items-center justify-center">
                  {column.id === 'nao_iniciado' && <Clock className="w-4 h-4 mr-2" />}
                  {column.id === 'em_andamento' && <Clock9 className="w-4 h-4 mr-2" />}
                  {column.id === 'concluido' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {column.title}
                  <span className="ml-2 bg-white bg-opacity-70 px-2 py-0.5 rounded-full text-xs">
                    {groupedServices[column.id].length} / {services.filter(s => (s.completion_status || 'nao_iniciado') === column.id).length}
                  </span>
                </div>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 min-h-[300px] p-2 overflow-y-auto"
                    style={{ maxHeight: 'calc(100vh - 300px)' }}
                  >
                    {groupedServices[column.id].length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">
                        Arraste serviços para esta coluna
                      </div>
                    ) : (
                      groupedServices[column.id].map((service, index) => (
                        <Draggable 
                          key={service.id} 
                          draggableId={service.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 p-3 rounded-lg border ${getCardBgColor(service)} shadow-sm hover:shadow-md transition-all cursor-pointer`}
                              onClick={() => onServiceSelect(service)}
                            >
                              <div className="flex flex-col justify-between mb-2">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-gray-900 text-sm">
                                    {service.client_name}
                                  </h3>
                                  <div>
                                    {renderStatusIcon(service.status)}
                                  </div>
                                </div>
                                
                                {service.status === 'nao_pago' && (
                                  <button
                                    onClick={(e) => handleMarkAsPaid(e, service.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs flex items-center transition-colors mt-2 self-start"
                                    title="Marcar como pago"
                                  >
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    <span>Pagar</span>
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                                  {formatLocalDate(service.service_date)}
                                </div>
                                
                                <div className="flex items-center text-gray-600">
                                  <Car className="w-3 h-3 mr-1 text-gray-500" />
                                  {service.car_model} • {service.car_plate}
                                </div>
                                
                                <div className="flex items-center text-gray-600">
                                  <DollarSign className="w-3 h-3 mr-1 text-green-500" />
                                  {formatCurrency(service.service_value)}
                                </div>
                                
                                {/* Nome do serviço e indicador de fotos */}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                  <span className="text-gray-700 truncate max-w-[80%]">
                                    {service.service?.name || 
                                    (service.catalog_services && service.catalog_services.length > 0 
                                      ? service.catalog_services[0].name 
                                      : 'Serviço não especificado')}
                                  </span>
                                  
                                  {service.photos && service.photos.length > 0 && (
                                    <span className="flex items-center text-blue-600">
                                      <Image className="w-3 h-3 mr-1" />
                                      {service.photos.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Mensagem informativa sobre limite de itens */}
      {services.length > (maxItemsPerColumn * 3) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
          <p>O quadro Kanban exibe no máximo {maxItemsPerColumn} serviços por coluna. Utilize a visualização em tabela para ver todos os serviços com paginação.</p>
        </div>
      )}
    </div>
  );
} 