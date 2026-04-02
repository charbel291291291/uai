import React, { useEffect, useCallback } from 'react';

// ============================================================================
// COMPONENT PRELOADER
// Prefetches components before they're needed
// ============================================================================

interface PreloadableComponent {
  name: string;
  importFunc: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
}

class ComponentPreloaderClass {
  private cache: Map<string, Promise<any>> = new Map();
  private preloadQueue: PreloadableComponent[] = [];
  private isProcessing = false;

  /**
   * Register a component for preloading
   */
  register(component: PreloadableComponent) {
    this.preloadQueue.push(component);
    this.processQueue();
  }

  /**
   * Preload a single component immediately
   */
  async preload(name: string, importFunc: () => Promise<any>): Promise<void> {
    if (this.cache.has(name)) return;

    const promise = importFunc();
    this.cache.set(name, promise);

    try {
      await promise;
      console.log(`[Preloader] ✅ Loaded: ${name}`);
    } catch (error) {
      console.warn(`[Preloader] ❌ Failed to load: ${name}`, error);
      this.cache.delete(name);
    }
  }

  /**
   * Process preload queue by priority
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.preloadQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Preload in sequence
    while (this.preloadQueue.length > 0) {
      const component = this.preloadQueue.shift();
      if (component) {
        await this.preload(component.name, component.importFunc);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get cached component
   */
  get(name: string): Promise<any> | undefined {
    return this.cache.get(name);
  }

  /**
   * Clear cache (useful for development or memory management)
   */
  clear() {
    this.cache.clear();
    this.preloadQueue = [];
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cached: this.cache.size,
      queued: this.preloadQueue.length,
      processing: this.isProcessing,
    };
  }
}

// Singleton instance
export const componentPreloader = new ComponentPreloaderClass();

// ============================================================================
// REACT HOOK FOR PRELOADING
// ============================================================================

export function useComponentPreload(
  name: string,
  importFunc: () => Promise<any>,
  options: { immediate?: boolean; priority?: 'high' | 'medium' | 'low' } = {}
) {
  const { immediate = false, priority = 'medium' } = options;
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    try {
      await componentPreloader.preload(name, importFunc);
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [name, importFunc, isLoaded, isLoading]);

  // Auto-load if immediate
  React.useEffect(() => {
    if (immediate) {
      load();
    } else {
      componentPreloader.register({ name, importFunc, priority });
    }
  }, [immediate, name, importFunc, priority, load]);

  return { isLoaded, isLoading, error, reload: load };
}

// ============================================================================
// PRELOAD LINK COMPONENT
// Adds prefetch/preload hints to document head
// ============================================================================

interface PreloadLinkProps {
  href: string;
  as?: 'script' | 'style' | 'font' | 'image' | 'fetch';
  crossOrigin?: boolean;
  importance?: 'high' | 'low' | 'auto';
}

export const PreloadLink: React.FC<PreloadLinkProps> = ({
  href,
  as = 'fetch',
  crossOrigin = false,
  importance = 'high',
}) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }
    
    if (importance !== 'auto') {
      link.setAttribute('importance', importance);
    }

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href, as, crossOrigin, importance]);

  return null;
};

// ============================================================================
// PREFETCH ON IDLE
// Prefetches resources when browser is idle
// ============================================================================

export function usePrefetchOnIdle(
  importFunc: () => Promise<any>,
  timeout: number = 2000
) {
  const [isPrefetched, setIsPrefetched] = React.useState(false);

  React.useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        if (!isPrefetched) {
          importFunc();
          setIsPrefetched(true);
        }
      }, { timeout });
    } else {
      // Fallback: load after short delay
      const timer = setTimeout(() => {
        if (!isPrefetched) {
          importFunc();
          setIsPrefetched(true);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [importFunc, timeout, isPrefetched]);

  return isPrefetched;
}

// ============================================================================
// RESOURCE HINTS
// Generates various resource hints for optimization
// ============================================================================

export interface ResourceHint {
  type: 'preconnect' | 'dns-prefetch' | 'prefetch' | 'prerender';
  href: string;
  crossOrigin?: boolean;
}

export const ResourceHints: React.FC<{ hints: ResourceHint[] }> = ({ hints }) => {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.type;
      link.href = hint.href;
      
      if (hint.crossOrigin) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => document.head.removeChild(link));
    };
  }, [hints]);

  return null;
};

export default componentPreloader;
