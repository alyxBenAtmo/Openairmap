# Composants de graphiques amCharts 5

Ce dossier contient les composants wrapper pour amCharts 5, créés pour faciliter la migration depuis Recharts.

## 📦 Composants

### `AmChartsLineChart`

Composant wrapper principal pour les graphiques en lignes avec amCharts 5.

#### Utilisation de base

```tsx
import { AmChartsLineChart } from "../components/charts";

const MyChart = () => {
  const data = [
    { timestamp: new Date("2024-01-01").getTime(), pm10: 25, pm25: 15 },
    { timestamp: new Date("2024-01-02").getTime(), pm10: 30, pm25: 18 },
  ];

  const series = [
    {
      dataKey: "pm10",
      name: "PM10",
      color: "#3B82F6",
      yAxisId: "left" as const,
    },
    {
      dataKey: "pm25",
      name: "PM2.5",
      color: "#EF4444",
      yAxisId: "left" as const,
    },
  ];

  return (
    <AmChartsLineChart
      data={data}
      series={series}
      yAxes={[{ id: "left", label: "Concentration", unit: "µg/m³" }]}
    />
  );
};
```

#### Props principales

- `data`: Tableau d'objets avec `timestamp` et les valeurs
- `series`: Configuration des séries de données
- `yAxes`: Configuration des axes Y (gauche/droite)
- `onChartReady`: Callback appelé quand le graphique est prêt (utile pour l'export)

#### Exemple avec export

```tsx
const MyChart = () => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  const handleExport = async () => {
    if (chartRef.current && rootRef.current) {
      // Utiliser l'API d'export d'amCharts
      const data = await rootRef.current.exporting.getImage("png");
      // ... traiter l'export
    }
  };

  return (
    <>
      <button onClick={handleExport}>Exporter</button>
      <AmChartsLineChart
        data={data}
        series={series}
        onChartReady={(chart, root) => {
          chartRef.current = chart;
          rootRef.current = root;
        }}
      />
    </>
  );
};
```

## 🔄 Migration depuis Recharts

### Mapping des concepts

| Recharts | amCharts 5 (via wrapper) |
|----------|--------------------------|
| `LineChart` | `AmChartsLineChart` |
| `Line` | `series` prop (tableau) |
| `XAxis` | Automatique (DateAxis) |
| `YAxis` | `yAxes` prop |
| `CartesianGrid` | `showGrid` prop |
| `Tooltip` | Automatique (personnalisable) |
| `Legend` | `showLegend` prop |
| `ResponsiveContainer` | Automatique (responsive par défaut) |

### Différences importantes

1. **Format des données** : amCharts nécessite un champ `timestamp` (number en millisecondes)
2. **Séries multiples** : Passées via un tableau `series` au lieu de composants enfants
3. **Cycle de vie** : Le wrapper gère automatiquement le nettoyage
4. **Export** : Utiliser l'API d'export d'amCharts au lieu de `html2canvas`

## 📚 Ressources

- [Documentation amCharts 5](https://www.amcharts.com/docs/v5/)
- [Exemples amCharts 5](https://www.amcharts.com/demos/)


