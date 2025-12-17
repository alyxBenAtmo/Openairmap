import React, { useMemo } from 'react';
import { MeasurementDevice } from '../../types';
import { getSourceDisplayName } from '../../utils/sourceCompatibility';
import { pollutants } from '../../constants/pollutants';
import { QUALITY_COLORS } from '../../constants/qualityColors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface DeviceStatistics {
  source: string;
  sourceDisplayName: string;
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  activeCount: number;
  inactiveCount: number;
  qualityLevels: {
    bon: number;
    moyen: number;
    degrade: number;
    mauvais: number;
    tresMauvais: number;
    extrMauvais: number;
    default: number;
  };
}

interface DeviceAnalysisPanelProps {
  devices: MeasurementDevice[];
  selectedPollutant?: string;
  className?: string;
}

const DeviceAnalysisPanel: React.FC<DeviceAnalysisPanelProps> = ({
  devices,
  selectedPollutant = 'pm25',
  className = '',
}) => {
  const statistics = useMemo(() => {
    if (devices.length === 0) {
      return [];
    }

    // Grouper les appareils par source
    const devicesBySource = new Map<string, MeasurementDevice[]>();
    
    devices.forEach((device) => {
      const source = device.source;
      if (!devicesBySource.has(source)) {
        devicesBySource.set(source, []);
      }
      devicesBySource.get(source)!.push(device);
    });

    // Calculer les statistiques pour chaque source
    const stats: DeviceStatistics[] = [];

    devicesBySource.forEach((sourceDevices, source) => {
      // Filtrer les appareils avec des valeurs valides
      const validDevices = sourceDevices.filter(
        (d) => d.value !== null && d.value !== undefined && !isNaN(d.value)
      );

      if (validDevices.length === 0) {
        return;
      }

      // Extraire les valeurs
      const values = validDevices.map((d) => d.value).sort((a, b) => a - b);

      // Calculer les statistiques de base
      const count = validDevices.length;
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = sum / count;
      const min = values[0];
      const max = values[values.length - 1];
      
      // Calculer la médiane
      const median =
        values.length % 2 === 0
          ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
          : values[Math.floor(values.length / 2)];

      // Compter les appareils actifs/inactifs
      const activeCount = validDevices.filter((d) => d.status === 'active').length;
      const inactiveCount = count - activeCount;

      // Calculer la distribution par niveau de qualité
      const pollutant = pollutants[selectedPollutant];
      const qualityLevels = {
        bon: 0,
        moyen: 0,
        degrade: 0,
        mauvais: 0,
        tresMauvais: 0,
        extrMauvais: 0,
        default: 0,
      };

      validDevices.forEach((device) => {
        const level = device.qualityLevel || 'default';
        if (level in qualityLevels) {
          qualityLevels[level as keyof typeof qualityLevels]++;
        } else {
          qualityLevels.default++;
        }
      });

      stats.push({
        source,
        sourceDisplayName: getSourceDisplayName(source),
        count,
        average,
        median,
        min,
        max,
        activeCount,
        inactiveCount,
        qualityLevels,
      });
    });

    // Trier par nombre d'appareils (décroissant)
    return stats.sort((a, b) => b.count - a.count);
  }, [devices, selectedPollutant]);

  const pollutant = pollutants[selectedPollutant];
  const unit = pollutant?.unit || 'µg/m³';

  // Calculer les statistiques globales
  const globalStats = useMemo(() => {
    if (statistics.length === 0) return null;
    
    const validDevices = devices.filter(
      (d) => d.value !== null && d.value !== undefined && !isNaN(d.value)
    );
    
    if (validDevices.length === 0) return null;
    
    const values = validDevices.map((d) => d.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    
    return { average, min, max, count: validDevices.length };
  }, [devices, statistics]);

  if (devices.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-lg font-medium">Aucun appareil affiché</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Les statistiques apparaîtront lorsque des appareils seront visibles sur la carte.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analyse des appareils</CardTitle>
            <CardDescription className="mt-1">
              {devices.length} appareil{devices.length > 1 ? 's' : ''} affiché
              {devices.length > 1 ? 's' : ''} • {pollutant?.name || selectedPollutant}
            </CardDescription>
          </div>
          <div className="bg-primary/10 text-primary rounded-md px-3 py-1.5">
            <span className="text-sm font-semibold">
              {statistics.length} source{statistics.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {statistics.map((stat, index) => (
          <Card key={stat.source} className="bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{stat.sourceDisplayName}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {stat.count} appareil{stat.count > 1 ? 's' : ''}
                  </span>
                  {stat.activeCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                      {stat.activeCount} actif{stat.activeCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Statistiques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Moyenne
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.average.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{unit}</div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Médiane
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.median.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{unit}</div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Minimum
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stat.min.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{unit}</div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Maximum
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stat.max.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{unit}</div>
                </div>
              </div>

              {/* Distribution par niveau de qualité */}
              {stat.count > 0 && (
                <div>
                  <div className="text-xs font-medium text-foreground uppercase tracking-wide mb-3">
                    Distribution par niveau de qualité
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                    {Object.entries(stat.qualityLevels).map(([level, count]) => {
                      if (count === 0) return null;
                      
                      const colorMap: Record<string, string> = {
                        bon: QUALITY_COLORS.bon,
                        moyen: QUALITY_COLORS.moyen,
                        degrade: QUALITY_COLORS.degrade,
                        mauvais: QUALITY_COLORS.mauvais,
                        tresMauvais: QUALITY_COLORS.tresMauvais,
                        extrMauvais: QUALITY_COLORS.extrMauvais,
                        default: QUALITY_COLORS.default,
                      };

                      const labelMap: Record<string, string> = {
                        bon: 'Bon',
                        moyen: 'Moyen',
                        degrade: 'Dégradé',
                        mauvais: 'Mauvais',
                        tresMauvais: 'Très mauvais',
                        extrMauvais: 'Extr. mauvais',
                        default: 'N/A',
                      };

                      const percentage = (count / stat.count) * 100;
                      const color = colorMap[level] || QUALITY_COLORS.default;
                      const label = labelMap[level] || level;

                      return (
                        <div
                          key={level}
                          className="rounded-lg border bg-card p-3 text-center"
                        >
                          <div
                            className="w-full h-2 rounded-full mb-2"
                            style={{ backgroundColor: color }}
                          />
                          <div className="text-xs font-semibold">
                            {count}
                          </div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="text-xs text-muted-foreground/70 mt-1">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>

      {/* Résumé global */}
      {statistics.length > 1 && (
        <div className="border-t bg-muted/50 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Total appareils
              </div>
              <div className="text-lg font-bold">
                {devices.length}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Moyenne globale
              </div>
              <div className="text-lg font-bold">
                {globalStats
                  ? globalStats.average.toFixed(1)
                  : (
                      statistics.reduce((acc, s) => acc + s.average * s.count, 0) /
                      devices.length
                    ).toFixed(1)}{' '}
                {unit}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Minimum global
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {globalStats
                  ? globalStats.min.toFixed(1)
                  : Math.min(...statistics.map((s) => s.min)).toFixed(1)}{' '}
                {unit}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Maximum global
              </div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {globalStats
                  ? globalStats.max.toFixed(1)
                  : Math.max(...statistics.map((s) => s.max)).toFixed(1)}{' '}
                {unit}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeviceAnalysisPanel;

