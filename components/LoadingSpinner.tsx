
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
  className?: string;
  variant?: 'default' | 'button';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullScreen = false, 
  text, 
  className = '',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-500`} />
      {text && <span className="text-sm font-medium text-gray-400 animate-pulse">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl flex flex-col items-center">
            {spinner}
        </div>
      </div>
    );
  }

  if (variant === 'button') {
      return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
  }

  return spinner;
};

export default LoadingSpinner;
