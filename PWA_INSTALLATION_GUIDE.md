# Guía de Instalación PWA - Turnos App

## ¿Qué es una PWA?

Una Progressive Web App (PWA) es una aplicación web que se puede instalar en dispositivos móviles y de escritorio, proporcionando una experiencia similar a una aplicación nativa.

## Características Implementadas

### ✅ Manifest Web App
- Archivo `public/site.webmanifest` configurado
- Metadatos completos para instalación
- Iconos optimizados para diferentes tamaños
- Configuración de tema y colores

### ✅ Service Worker
- Archivo `public/sw.js` implementado
- Cache de recursos estáticos
- Funcionalidad offline básica
- Actualización automática

### ✅ Meta Tags para iOS/Safari
- Configuración específica para Safari
- Soporte para pantalla completa
- Iconos de Apple Touch
- Configuración de barra de estado

### ✅ Componentes React
- Hook `usePWAInstall` para detectar instalabilidad
- Componente `PWAInstallButton` para botones de instalación
- Componente `PWAInstallBanner` para banner promocional

## Cómo Instalar la App

### En iOS Safari:
1. Abre la app en Safari
2. Toca el botón de compartir (cuadrado con flecha hacia arriba)
3. Desplázate hacia abajo y toca "Agregar a pantalla de inicio"
4. Toca "Agregar" en la esquina superior derecha

### En Android Chrome:
1. Abre la app en Chrome
2. Aparecerá un banner de instalación automáticamente
3. Toca "Instalar" o "Agregar a pantalla de inicio"

### En Desktop (Chrome, Edge, Firefox):
1. Busca el icono de instalación en la barra de direcciones
2. Haz clic en "Instalar" cuando aparezca el prompt
3. O usa el botón de instalación en la interfaz

## Uso de los Componentes

### PWAInstallButton
```tsx
import PWAInstallButton from '@/components/PWAInstallButton';

// Botón básico
<PWAInstallButton />

// Con personalización
<PWAInstallButton 
  variant="outline" 
  size="sm" 
  className="my-custom-class" 
/>
```

### PWAInstallBanner
```tsx
import PWAInstallBanner from '@/components/PWAInstallBanner';

// Banner automático (se muestra solo cuando es apropiado)
<PWAInstallBanner />
```

### Hook usePWAInstall
```tsx
import { usePWAInstall } from '@/hooks/usePWAInstall';

const MyComponent = () => {
  const { 
    isInstallable, 
    isInstalled, 
    installApp, 
    showIOSInstallInstructions,
    isIOS 
  } = usePWAInstall();

  // Tu lógica personalizada aquí
};
```

## Archivos Modificados/Creados

### Nuevos Archivos:
- `public/sw.js` - Service Worker
- `public/browserconfig.xml` - Configuración para Microsoft Edge
- `resources/js/hooks/usePWAInstall.ts` - Hook para instalación
- `resources/js/components/PWAInstallButton.tsx` - Botón de instalación
- `resources/js/components/PWAInstallBanner.tsx` - Banner de instalación

### Archivos Modificados:
- `public/site.webmanifest` - Manifest actualizado
- `resources/views/app.blade.php` - Meta tags y Service Worker

## Testing

### Para Probar la Instalación:
1. Abre la app en un navegador compatible
2. Verifica que aparezcan los prompts de instalación
3. Prueba la instalación en diferentes dispositivos
4. Verifica que la app funcione offline (básico)

### Herramientas de Desarrollo:
- Chrome DevTools > Application > Manifest
- Chrome DevTools > Application > Service Workers
- Lighthouse audit para PWA

## Notas Importantes

- Safari en iOS tiene limitaciones específicas para PWAs
- El Service Worker actual es básico, se puede expandir según necesidades
- Los iconos deben ser optimizados para diferentes tamaños
- La funcionalidad offline es limitada, se puede mejorar

## Próximos Pasos Opcionales

1. **Mejorar Service Worker:**
   - Cache más inteligente
   - Sincronización en background
   - Notificaciones push

2. **Optimizar Iconos:**
   - Generar iconos para más tamaños
   - Crear iconos maskable para Android

3. **Funcionalidad Offline:**
   - Páginas offline personalizadas
   - Sincronización de datos
   - Estrategias de cache más avanzadas

4. **Notificaciones:**
   - Configurar notificaciones push
   - Manejo de permisos
   - Notificaciones contextuales
