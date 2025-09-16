import React, { useState } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, installApp, showIOSInstallInstructions, isIOS } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // No mostrar si ya está instalada, fue descartada, o no es instalable
  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleInstall = () => {
    if (isIOS) {
      showIOSInstallInstructions();
    } else {
      installApp();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Verificar si fue descartado previamente
  React.useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isIOS ? (
                <Share className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Instalar Turnos App
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {isIOS 
                  ? 'Agrega esta app a tu pantalla de inicio para acceso rápido'
                  : 'Instala esta app para una mejor experiencia'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallBanner;
