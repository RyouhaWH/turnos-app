import { useEffect, useRef, useCallback } from 'react';

interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

interface ElementAnimation {
  element: HTMLElement;
  properties: Record<string, any>;
  options: AnimationOptions;
}

export const useAnimations = () => {
  const animationQueue = useRef<ElementAnimation[]>([]);
  const isAnimating = useRef(false);

  // Función para animar cambios de propiedades
  const animate = useCallback((
    element: HTMLElement,
    properties: Record<string, any>,
    options: AnimationOptions = {}
  ) => {
    const {
      duration = 300,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay = 0,
      onStart,
      onComplete
    } = options;

    const animation: ElementAnimation = {
      element,
      properties,
      options: { duration, easing, delay, onStart, onComplete }
    };

    animationQueue.current.push(animation);
    processAnimationQueue();
  }, []);

  // Función para animar cambios de tamaño
  const animateSize = useCallback((
    element: HTMLElement,
    width?: string | number,
    height?: string | number,
    options?: AnimationOptions
  ) => {
    const properties: Record<string, any> = {};

    if (width !== undefined) properties.width = width;
    if (height !== undefined) properties.height = height;

    animate(element, properties, options);
  }, [animate]);

  // Función para animar cambios de posición
  const animatePosition = useCallback((
    element: HTMLElement,
    x?: number,
    y?: number,
    options?: AnimationOptions
  ) => {
    const properties: Record<string, any> = {};

    if (x !== undefined) properties.transform = `translateX(${x}px)`;
    if (y !== undefined) properties.transform = `translateY(${y}px)`;
    if (x !== undefined && y !== undefined) {
      properties.transform = `translate(${x}px, ${y}px)`;
    }

    animate(element, properties, options);
  }, [animate]);

  // Función para animar cambios de opacidad
  const animateOpacity = useCallback((
    element: HTMLElement,
    opacity: number,
    options?: AnimationOptions
  ) => {
    animate(element, { opacity }, options);
  }, [animate]);

  // Función para animar cambios de color/fondo
  const animateColor = useCallback((
    element: HTMLElement,
    color?: string,
    backgroundColor?: string,
    options?: AnimationOptions
  ) => {
    const properties: Record<string, any> = {};

    if (color !== undefined) properties.color = color;
    if (backgroundColor !== undefined) properties.backgroundColor = backgroundColor;

    animate(element, properties, options);
  }, [animate]);

  // Función para animar elementos que aparecen/desaparecen
  const animateVisibility = useCallback((
    element: HTMLElement,
    visible: boolean,
    options?: AnimationOptions
  ) => {
    if (visible) {
      element.style.display = '';
      element.style.opacity = '0';
      element.style.transform = 'scale(0.95)';

      requestAnimationFrame(() => {
        animate(element, {
          opacity: 1,
          transform: 'scale(1)'
        }, options);
      });
    } else {
      animate(element, {
        opacity: 0,
        transform: 'scale(0.95)'
      }, {
        ...options,
        onComplete: () => {
          element.style.display = 'none';
          options?.onComplete?.();
        }
      });
    }
  }, [animate]);

  // Función para animar dropdowns
  const animateDropdown = useCallback((
    element: HTMLElement,
    expanded: boolean,
    options?: AnimationOptions
  ) => {
    if (expanded) {
      element.style.maxHeight = '0';
      element.style.overflow = 'hidden';
      element.style.opacity = '0';

      requestAnimationFrame(() => {
        const scrollHeight = element.scrollHeight;
        animate(element, {
          maxHeight: `${scrollHeight}px`,
          opacity: 1
        }, {
          ...options,
          onComplete: () => {
            element.style.maxHeight = '';
            element.style.overflow = '';
            options?.onComplete?.();
          }
        });
      });
    } else {
      const scrollHeight = element.scrollHeight;
      element.style.maxHeight = `${scrollHeight}px`;
      element.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        animate(element, {
          maxHeight: '0',
          opacity: 0
        }, {
          ...options,
          onComplete: () => {
            element.style.maxHeight = '';
            element.style.overflow = '';
            options?.onComplete?.();
          }
        });
      });
    }
  }, [animate]);

  // Función para animar cambios de layout
  const animateLayout = useCallback((
    element: HTMLElement,
    properties: Record<string, any>,
    options?: AnimationOptions
  ) => {
    // Agregar clase para optimizar el rendimiento
    element.classList.add('animate-gpu');

    animate(element, properties, {
      ...options,
      onComplete: () => {
        element.classList.remove('animate-gpu');
        options?.onComplete?.();
      }
    });
  }, [animate]);

  // Función para procesar la cola de animaciones
  const processAnimationQueue = useCallback(() => {
    if (isAnimating.current || animationQueue.current.length === 0) {
      return;
    }

    isAnimating.current = true;
    const animation = animationQueue.current.shift();

    if (!animation) {
      isAnimating.current = false;
      return;
    }

    const { element, properties, options } = animation;
    const { duration = 300, easing = 'cubic-bezier(0.4, 0, 0.2, 1)', delay = 0, onStart, onComplete } = options;

    // Configurar la transición
    element.style.transition = `all ${duration}ms ${easing}`;

    // Ejecutar callback de inicio
    onStart?.();

    // Aplicar las propiedades después del delay
    setTimeout(() => {
      Object.entries(properties).forEach(([property, value]) => {
        element.style[property as any] = value;
      });

      // Limpiar la transición y ejecutar callback de completado
      setTimeout(() => {
        element.style.transition = '';
        onComplete?.();
        isAnimating.current = false;
        processAnimationQueue();
      }, duration);
    }, delay);
  }, []);

  // Función para observar cambios en el DOM y animarlos automáticamente
  const observeChanges = useCallback((target: HTMLElement, options?: MutationObserverInit) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const element = mutation.target as HTMLElement;
          const attributeName = mutation.attributeName;

          if (attributeName === 'class' || attributeName === 'style') {
            // Animar cambios en clases o estilos
            element.classList.add('state-change');
            setTimeout(() => {
              element.classList.remove('state-change');
            }, 300);
          }
        }
      });
    });

    observer.observe(target, {
      attributes: true,
      childList: true,
      subtree: true,
      ...options
    });

    return observer;
  }, []);

  // Función para animar elementos que entran en el viewport
  const animateOnScroll = useCallback((elements: NodeListOf<Element> | Element[]) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.classList.add('fade-in');
          observer.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach((element) => {
      observer.observe(element);
    });

    return observer;
  }, []);

  // Función para limpiar todas las animaciones
  const clearAnimations = useCallback(() => {
    animationQueue.current = [];
    isAnimating.current = false;
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearAnimations();
    };
  }, [clearAnimations]);

  return {
    animate,
    animateSize,
    animatePosition,
    animateOpacity,
    animateColor,
    animateVisibility,
    animateDropdown,
    animateLayout,
    observeChanges,
    animateOnScroll,
    clearAnimations
  };
};

export default useAnimations;
