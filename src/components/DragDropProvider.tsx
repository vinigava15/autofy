/**
 * Wrapper para react-beautiful-dnd que suprime warnings de defaultProps
 * Isso é necessário porque o react-beautiful-dnd ainda não foi atualizado para React 18
 */

import React, { useEffect } from 'react';
import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

// Suprimir warnings de defaultProps especificamente para react-beautiful-dnd
const originalConsoleWarn = console.warn;

export const DragDropProvider: React.FC<DragDropContextProps> = ({ children, ...props }) => {
  useEffect(() => {
    // Sobrescrever console.warn para filtrar warnings específicos do react-beautiful-dnd
    console.warn = (...args: any[]) => {
      const message = args[0];
      
      // Filtrar warnings relacionados ao defaultProps do react-beautiful-dnd
      if (
        typeof message === 'string' &&
        (message.includes('Support for defaultProps will be removed') ||
         message.includes('Connect(Droppable)') ||
         message.includes('Connect(Draggable)'))
      ) {
        return; // Não mostrar este warning
      }
      
      // Mostrar outros warnings normalmente
      originalConsoleWarn.apply(console, args);
    };

    // Restaurar console.warn original quando o componente for desmontado
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <DragDropContext {...props}>
      {children}
    </DragDropContext>
  );
};

export default DragDropProvider;