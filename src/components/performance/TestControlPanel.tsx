import React from 'react';

interface TestControlPanelProps {
  testMode: boolean;
  onTestModeChange: (enabled: boolean) => void;
  markerCount: number;
  onMarkerCountChange: (count: number) => void;
  performanceMonitoring: boolean;
  onPerformanceMonitoringChange: (enabled: boolean) => void;
}

export const TestControlPanel: React.FC<TestControlPanelProps> = ({
  testMode,
  onTestModeChange,
  markerCount,
  onMarkerCountChange,
  performanceMonitoring,
  onPerformanceMonitoringChange,
}) => {
  const presetCounts = [100, 500, 1000, 2000, 5000];

  return (
    <div className="fixed top-20 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[3000] border border-gray-200 max-w-xs">
      <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
        <span>🧪</span>
        <span>Mode Test Performance</span>
      </h3>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => onTestModeChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium">Activer le mode test</span>
        </label>
        
        {testMode && (
          <>
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-sm font-medium mb-2">
                Nombre de marqueurs: <span className="text-blue-600 font-bold">{markerCount}</span>
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={markerCount}
                onChange={(e) => onMarkerCountChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100</span>
                <span>2500</span>
                <span>5000</span>
              </div>
              
              {/* Presets rapides */}
              <div className="flex flex-wrap gap-2 mt-3">
                {presetCounts.map((count) => (
                  <button
                    key={count}
                    onClick={() => onMarkerCountChange(count)}
                    className={`px-2 py-1 text-xs rounded ${
                      markerCount === count
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={performanceMonitoring}
                  onChange={(e) => onPerformanceMonitoringChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Monitoring performance</span>
              </label>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 Astuce: Utilisez Ctrl+Shift+T pour activer/désactiver rapidement le mode test
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};



