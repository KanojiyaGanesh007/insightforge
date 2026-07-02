import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { Button } from '@/components/ui/Button';
import { useDatasets, useDatasetIntelligence } from '@/features/datasets/hooks/useDatasets';
import { useDashboards, useAddWidget, usePreviewData } from '@/features/dashboards/hooks/useDashboards';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e'];

export function VisualizationStudioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultDashboardId = searchParams.get('dashboardId') || '';

  const { data: datasets = [], isLoading: isLoadingDatasets } = useDatasets();
  const { data: dashboards = [], isLoading: isLoadingDashboards } = useDashboards();

  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const { data: intelligence } = useDatasetIntelligence(selectedDatasetId);

  // Form State
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter' | 'area'>('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggregateFunc, setAggregateFunc] = useState('');
  const [targetDashboardId, setTargetDashboardId] = useState(defaultDashboardId);

  const addWidgetMutation = useAddWidget(targetDashboardId);

  // Schema columns extracted from intelligence
  const columns = intelligence?.columns || [];

  // Reset axes on dataset change
  useEffect(() => {
    setXAxis('');
    setYAxis('');
  }, [selectedDatasetId]);

  // Set default title on selections
  useEffect(() => {
    if (xAxis && yAxis) {
      const aggText = aggregateFunc ? `${aggregateFunc.toUpperCase()}(${yAxis})` : yAxis;
      setTitle(`${chartType.toUpperCase()}: ${aggText} by ${xAxis}`);
    }
  }, [chartType, xAxis, yAxis, aggregateFunc]);

  // Live aggregated preview data
  const { data: previewResponse, isFetching: isFetchingPreview } = usePreviewData(
    selectedDatasetId,
    xAxis,
    yAxis,
    aggregateFunc || undefined
  );

  const handleSave = async () => {
    if (!selectedDatasetId || !xAxis || !yAxis || !targetDashboardId || !title.trim()) {
      alert('Please fill out all configuration settings.');
      return;
    }
    try {
      await addWidgetMutation.mutateAsync({
        dataset_id: selectedDatasetId,
        title: title.trim(),
        chart_type: chartType,
        x_axis: xAxis,
        y_axis: yAxis,
        aggregate_func: aggregateFunc || undefined,
        layout_x: 0,
        layout_y: 0,
        layout_w: 6,
        layout_h: 4,
      });
      navigate(`/dashboards/${targetDashboardId}`);
    } catch (err) {
      alert('Failed to save widget to dashboard');
    }
  };

  return (
    <FeatureErrorBoundary featureName="Visualization Studio">
      <div className="space-y-6 text-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Visualization Studio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build custom chart aggregates and pin them onto your executive dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-semibold text-white">Configure Visual</h3>

            <div className="space-y-3">
              {/* Dataset Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Source Dataset
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  disabled={isLoadingDatasets}
                >
                  <option value="">-- Choose uploaded file --</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (.{d.file_format})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Type */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Chart Style
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>

              {/* X Axis Column */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  X-Axis Column (Category / Date)
                </label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  disabled={!selectedDatasetId}
                >
                  <option value="">-- Select column --</option>
                  {columns.map((col: any) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Y Axis Column */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Y-Axis Column (Numeric)
                </label>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  disabled={!selectedDatasetId}
                >
                  <option value="">-- Select column --</option>
                  {columns.map((col: any) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Aggregation Function */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Aggregation Rule
                </label>
                <select
                  value={aggregateFunc}
                  onChange={(e) => setAggregateFunc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  disabled={!selectedDatasetId}
                >
                  <option value="">Raw Rows (No Aggregation)</option>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>

              {/* Widget Title */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Visualization Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sales by Region"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Target Dashboard */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pin to Dashboard
                </label>
                <select
                  value={targetDashboardId}
                  onChange={(e) => setTargetDashboardId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  disabled={isLoadingDashboards}
                >
                  <option value="">-- Choose Dashboard Layout --</option>
                  {dashboards.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex gap-2">
              <Button
                onClick={() => navigate('/dashboards')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedDatasetId || !xAxis || !yAxis || !targetDashboardId || !title.trim() || addWidgetMutation.isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 disabled:bg-slate-800 disabled:text-slate-500"
              >
                Save Visual
              </Button>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Live Render Preview</h3>
              {isFetchingPreview && (
                <div className="text-[10px] text-brand-400 flex items-center gap-1.5 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-ping" />
                  aggregating...
                </div>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-950/20 border border-slate-800/50 rounded-xl min-h-[350px]">
              {!selectedDatasetId || !xAxis || !yAxis ? (
                <p className="text-xs text-slate-500 max-w-sm text-center">
                  Select a dataset, axes columns, and aggregates in the controls panel to view the live aggregated chart.
                </p>
              ) : !previewResponse?.data || previewResponse.data.length === 0 ? (
                <p className="text-xs text-slate-500">No chart data matching parameters.</p>
              ) : (
                <ResponsiveContainer width="95%" height={320}>
                  {renderPreviewChart(chartType, xAxis, yAxis, previewResponse.data)}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
}

function renderPreviewChart(type: string, xKey: string, yKey: string, data: any[]) {
  const chartData = data;

  switch (type) {
    case 'bar':
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          <Line type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="previewAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fillOpacity={1} fill="url(#previewAreaGrad)" strokeWidth={2} />
        </AreaChart>
      );
    case 'pie':
      return (
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            fill="#8884d8"
            dataKey={yKey}
            nameKey={xKey}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      );
    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="category" dataKey={xKey} name={xKey} stroke="#94a3b8" fontSize={10} />
          <YAxis type="number" dataKey={yKey} name={yKey} stroke="#94a3b8" fontSize={10} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          <Scatter name="Row points" data={chartData} fill="#ec4899" />
        </ScatterChart>
      );
    default:
      return null;
  }
}
