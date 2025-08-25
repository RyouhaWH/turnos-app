import React, { createContext, useContext, ReactNode } from 'react';
import useAnimations from '@/hooks/use-animations';

interface AnimationContextType {
  animate: (element: HTMLElement, properties: Record<string, any>, options?: any) => void;
  animateSize: (element: HTMLElement, width?: string | number, height?: string | number, options?: any) => void;
  animatePosition: (element: HTMLElement, x?: number, y?: number, options?: any) => void;
  animateOpacity: (element: HTMLElement, opacity: number, options?: any) => void;
  animateColor: (element: HTMLElement, color?: string, backgroundColor?: string, options?: any) => void;
  animateVisibility: (element: HTMLElement, visible: boolean, options?: any) => void;
  animateDropdown: (element: HTMLElement, expanded: boolean, options?: any) => void;
  animateLayout: (element: HTMLElement, properties: Record<string, any>, options?: any) => void;
  observeChanges: (target: HTMLElement, options?: MutationObserverInit) => MutationObserver;
  animateOnScroll: (elements: NodeListOf<Element> | Element[]) => IntersectionObserver;
  clearAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const animations = useAnimations();

  return (
    <AnimationContext.Provider value={animations}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};

export default AnimationContext;
