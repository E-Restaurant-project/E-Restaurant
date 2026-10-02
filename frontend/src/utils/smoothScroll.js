import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenisInstance = null;

/**
 * Universal Lenis-powered Viscous Momentum Smooth Scroll ("Oil" / "ខាប់ៗ" Physics)
 * Provides butter-smooth, continuous exponential deceleration without freezing or locking.
 */
export function initGlobalSmoothScroll() {
  if (typeof window === 'undefined') return () => {};

  // Destroy any existing instance
  if (lenisInstance) {
    try {
      lenisInstance.destroy();
    } catch (e) {
      // ignore
    }
    lenisInstance = null;
  }

  // Respect reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  lenisInstance = new Lenis({
    duration: 1.15, // Responsive yet silky fluid momentum ("ខាប់ៗ" smooth fluid)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential deceleration
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0, // Natural 1:1 wheel distance response
    touchMultiplier: 1.0,
    infinite: false
  });

  let rafId;
  function raf(time) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (lenisInstance) {
      try {
        lenisInstance.destroy();
      } catch (e) {
        // ignore
      }
      lenisInstance = null;
    }
  };
}

export function getLenis() {
  return lenisInstance;
}
