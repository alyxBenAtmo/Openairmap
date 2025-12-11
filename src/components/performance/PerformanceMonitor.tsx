import React, { useEffect, useState, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  memoryUsage?: number;
  markerCount: number;
}

interface PerformanceMonitorProps {
  markerCount: number;
  enabled: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  markerCount,
  enabled,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    markerCount: 0,
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      // Réinitialiser les métriques quand désactivé
      setMetrics({
        fps: 0,
        frameTime: 0,
        renderTime: 0,
        markerCount: 0,
      });
      return;
    }

    const measureFrame = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        const frameTime = elapsed / frameCountRef.current;
        
        // Mesure de mémoire (si disponible dans Chrome)
        const memoryUsage = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : undefined;
        
        const newMetrics: PerformanceMetrics = {
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          renderTime: metrics.renderTime,
          memoryUsage,
          markerCount,
        };
        
        setMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(measureFrame);
    };
    
    animationFrameRef.current = requestAnimationFrame(measureFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, markerCount, metrics.renderTime, onMetricsUpdate]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg z-[3000] font-mono text-sm shadow-lg border border-gray-700">
      <div className="space-y-1">
        <div className="text-xs text-gray-400 mb-2 font-semibold">📊 Performance</div>
        <div>
          FPS: <span className={metrics.fps < 30 ? 'text-red-400 font-bold' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        <div>Frame Time: {metrics.frameTime}ms</div>
        <div>Render Time: {metrics.renderTime}ms</div>
        {metrics.memoryUsage !== undefined && (
          <div>Memory: {metrics.memoryUsage}MB</div>
        )}
        <div className="pt-1 border-t border-gray-600 mt-1">
          Markers: <span className="font-bold">{markerCount}</span>
        </div>
      </div>
    </div>
  );
};



