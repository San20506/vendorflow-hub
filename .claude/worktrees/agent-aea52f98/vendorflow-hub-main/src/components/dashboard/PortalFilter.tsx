import { useState } from 'react';
import { Portal } from '@/types';
import { portalConfigs } from '@/services/mockData';
import { cn } from '@/lib/utils';

interface PortalFilterProps {
  selectedPortal: Portal | 'all';
  onPortalChange: (portal: Portal | 'all') => void;
  className?: string;
}

export function PortalFilter({ selectedPortal, onPortalChange, className }: PortalFilterProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <button
        onClick={() => onPortalChange('all')}
        className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          selectedPortal === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        All Portals
      </button>
      
      {portalConfigs.map((portal) => (
        <button
          key={portal.id}
          onClick={() => onPortalChange(portal.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
            selectedPortal === portal.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <span>{portal.icon}</span>
          <span>{portal.name}</span>
        </button>
      ))}
    </div>
  );
}
