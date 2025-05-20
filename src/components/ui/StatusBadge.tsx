import React from 'react';
import { StatusBadge as StatusBadgeType } from '../../utils/serviceFormatters';
import { getStatusBadge, getCompletionBadge } from '../../utils/serviceFormatters';

interface StatusBadgeProps {
  status?: string;
  type: 'status' | 'completion';
}

/**
 * Componente para exibir badges de status com estilo consistente
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const badgeInfo: StatusBadgeType = type === 'status' 
    ? getStatusBadge(status)
    : getCompletionBadge(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeInfo.className}`}>
      {badgeInfo.text}
    </span>
  );
}; 