/**
 * Performance utilities for large scale applications
 */

// Debounce utility to prevent excessive API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(undefined, args), delay);
  }) as T;
};

// Throttle utility for real-time updates
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(undefined, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// Memory optimization - Deep object freezing for immutable data
export const deepFreeze = <T>(obj: T): T => {
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && (typeof obj[prop] === "object" || typeof obj[prop] === "function")) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

// Lazy loading helper
import React from 'react';

export const createLazyComponent = <T>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>
) => {
  return React.lazy(importFunc);
};

// Virtual scrolling utility for large lists
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(itemHeight: number, containerHeight: number, overscan = 5) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  getVisibleRange(scrollTop: number, itemCount: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      itemCount - 1
    );

    return {
      start: Math.max(0, visibleStart - this.overscan),
      end: Math.min(itemCount - 1, visibleEnd + this.overscan),
    };
  }
}

// Performance monitoring
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startTiming(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(label)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  getMetrics(label: string) {
    const measurements = this.metrics.get(label) || [];
    if (measurements.length === 0) return null;

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const max = Math.max(...measurements);
    const min = Math.min(...measurements);

    return { avg, max, min, count: measurements.length };
  }

  logMetrics() {
    console.group('Performance Metrics');
    this.metrics.forEach((measurements, label) => {
      const metrics = this.getMetrics(label);
      if (metrics) {
        console.log(`${label}: avg=${metrics.avg.toFixed(2)}ms, max=${metrics.max.toFixed(2)}ms, min=${metrics.min.toFixed(2)}ms, count=${metrics.count}`);
      }
    });
    console.groupEnd();
  }
}

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Browser feature detection
export const getBrowserCapabilities = () => {
  return {
    webWorkers: typeof Worker !== 'undefined',
    serviceWorkers: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    webAssembly: 'WebAssembly' in window,
    pushNotifications: 'PushManager' in window,
    fileAPI: 'File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window,
  };
};
