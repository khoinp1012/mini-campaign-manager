import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-surface-container-highest/50';
  
  let variantClasses = '';
  switch (variant) {
    case 'text':
      variantClasses = 'h-4 w-full rounded';
      break;
    case 'circle':
      variantClasses = 'rounded-full';
      break;
    case 'rect':
      variantClasses = 'rounded-xl';
      break;
  }

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 items-center">
          <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
          <div className="space-y-2 flex-grow">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/4" />
          </div>
          <Skeleton variant="rect" className="w-20 h-8" />
        </div>
      ))}
    </div>
  );
}
