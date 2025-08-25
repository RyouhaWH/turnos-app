import React, { useEffect, useRef, forwardRef, ComponentType } from 'react';
import { useAnimationContext } from '@/contexts/AnimationContext';

interface WithAnimationsProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'bounce' | 'custom';
  duration?: number;
  delay?: number;
  trigger?: 'mount' | 'hover' | 'focus' | 'scroll' | 'click';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export const withAnimations = <P extends object>(
  WrappedComponent: ComponentType<P>,
  config?: AnimationConfig
) => {
  const AnimatedComponent = forwardRef<HTMLElement, P & WithAnimationsProps>((props, ref) => {
    const elementRef = useRef<HTMLElement>(null);
    const { animate, animateVisibility, animateOnScroll } = useAnimationContext();
    const hasAnimated = useRef(false);

    // Combinar refs
    const combinedRef = (node: HTMLElement | null) => {
      elementRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      const element = elementRef.current;
      if (!element || !config || hasAnimated.current) return;

      const { type, duration = 300, delay = 0, trigger = 'mount', direction = 'up', distance = 20 } = config;

      const applyAnimation = () => {
        hasAnimated.current = true;

        switch (type) {
          case 'fade':
            element.style.opacity = '0';
            element.style.transform = 'scale(0.95)';

            setTimeout(() => {
              animate(element, {
                opacity: 1,
                transform: 'scale(1)'
              }, { duration, delay });
            }, delay);
            break;

          case 'slide':
            const transformMap = {
              up: `translateY(${distance}px)`,
              down: `translateY(-${distance}px)`,
              left: `translateX(${distance}px)`,
              right: `translateX(-${distance}px)`
            };

            element.style.opacity = '0';
            element.style.transform = transformMap[direction];

            setTimeout(() => {
              animate(element, {
                opacity: 1,
                transform: 'translate(0, 0)'
              }, { duration, delay });
            }, delay);
            break;

          case 'scale':
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';

            setTimeout(() => {
              animate(element, {
                opacity: 1,
                transform: 'scale(1)'
              }, { duration, delay });
            }, delay);
            break;

          case 'bounce':
            element.style.opacity = '0';
            element.style.transform = 'scale(0.3)';

            setTimeout(() => {
              animate(element, {
                opacity: 1,
                transform: 'scale(1)'
              }, {
                duration,
                delay,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              });
            }, delay);
            break;

          case 'custom':
            // Animación personalizada - el componente debe manejar su propia animación
            break;
        }
      };

      switch (trigger) {
        case 'mount':
          applyAnimation();
          break;

        case 'scroll':
          const observer = animateOnScroll([element]);
          return () => observer.disconnect();

        case 'hover':
          element.addEventListener('mouseenter', applyAnimation);
          return () => element.removeEventListener('mouseenter', applyAnimation);

        case 'focus':
          element.addEventListener('focus', applyAnimation);
          return () => element.removeEventListener('focus', applyAnimation);

        case 'click':
          element.addEventListener('click', applyAnimation);
          return () => element.removeEventListener('click', applyAnimation);
      }
    }, [config, animate, animateOnScroll]);

    return <WrappedComponent {...(props as P)} ref={combinedRef} />;
  });

  AnimatedComponent.displayName = `withAnimations(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AnimatedComponent;
};

// Componente utilitario para animaciones rápidas
export const Animated: React.FC<WithAnimationsProps & AnimationConfig> = ({
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  trigger = 'mount',
  direction = 'up',
  distance = 20,
  className = '',
  ...props
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { animate } = useAnimationContext();
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasAnimated.current) return;

    const applyAnimation = () => {
      hasAnimated.current = true;

      switch (type) {
        case 'fade':
          element.style.opacity = '0';
          element.style.transform = 'scale(0.95)';

          setTimeout(() => {
            animate(element, {
              opacity: 1,
              transform: 'scale(1)'
            }, { duration, delay });
          }, delay);
          break;

        case 'slide':
          const transformMap = {
            up: `translateY(${distance}px)`,
            down: `translateY(-${distance}px)`,
            left: `translateX(${distance}px)`,
            right: `translateX(-${distance}px)`
          };

          element.style.opacity = '0';
          element.style.transform = transformMap[direction];

          setTimeout(() => {
            animate(element, {
              opacity: 1,
              transform: 'translate(0, 0)'
            }, { duration, delay });
          }, delay);
          break;

        case 'scale':
          element.style.opacity = '0';
          element.style.transform = 'scale(0.8)';

          setTimeout(() => {
            animate(element, {
              opacity: 1,
              transform: 'scale(1)'
            }, { duration, delay });
          }, delay);
          break;

        case 'bounce':
          element.style.opacity = '0';
          element.style.transform = 'scale(0.3)';

          setTimeout(() => {
            animate(element, {
              opacity: 1,
              transform: 'scale(1)'
            }, {
              duration,
              delay,
              easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            });
          }, delay);
          break;
      }
    };

    if (trigger === 'mount') {
      applyAnimation();
    }
  }, [type, duration, delay, trigger, direction, distance, animate]);

  return (
    <div ref={elementRef} className={className} {...props}>
      {children}
    </div>
  );
};

export default withAnimations;
