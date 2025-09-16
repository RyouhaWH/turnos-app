import React from 'react';
import { Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className,
  variant = 'outline',
  size = 'default'
}) => {
  const { isInstallable, isInstalled, installApp, showIOSInstallInstructions, isIOS } = usePWAInstall();

  // No mostrar nada si ya está instalada
  if (isInstalled) {
    return null;
  }

  // Para iOS Safari, mostrar instrucciones
  if (isIOS) {
    return (
      <Button
        onClick={showIOSInstallInstructions}
        variant={variant}
        size={size}
        className={className}
      >
        <Share className="w-4 h-4 mr-2" />
        Instalar App
      </Button>
    );
  }

  // Para otros navegadores que soportan beforeinstallprompt
  if (isInstallable) {
    return (
      <Button
        onClick={installApp}
        variant={variant}
        size={size}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        Instalar App
      </Button>
    );
  }

  // No mostrar nada si no es instalable
  return null;
};

export default PWAInstallButton;
