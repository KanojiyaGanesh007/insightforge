import { useParams, useNavigate } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { Button } from '@/components/ui/Button';
import { useDashboard, useDeleteWidget, useWidgetData } from '../hooks/useDashboards';
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
import type { Widget } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e'];

export function DashboardViewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useDashboard(id);
  const deleteWidgetMutation = useDeleteWidget(id);

  const handleDeleteWidget = async (widgetId: string) => {
    if (window.confirm('Remove this visualization from dashboard?')) {
      try {
        await deleteWidgetMutation.mutateAsync(widgetId);
      } catch (err) {
        alert('Failed to delete widget');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-20 text-slate-400">
        <h3 className="text-lg font-semibold text-white">Dashboard Not Found</h3>
        <p className="text-xs mt-2">The requested dashboard is missing or deleted.</p>
        <Button onClick={() => navigate('/dashboards')} className="mt-4 bg-slate-800 hover:bg-slate-700">
          Back to Hub
        </Button>
      </div>
    );
  }

  return (
    <FeatureErrorBoundary featureName="Dashboard View">
      <div className="space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboards')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                &larr; Hub
              </button>
              <h1 className="text-xl font-bold text-white">{dashboard.name}</h1>
              {dashboard.is_auto_generated && (
                <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded uppercase">
                  Auto
                </span>
              )}
            </div>
            {dashboard.description && (
              <p className="text-xs text-slate-400 max-w-2xl">{dashboard.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/visualizations/studio?dashboardId=${dashboard.id}`)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4"
            >
              + Add Widget
            </Button>
          </div>
        </div>

        {/* Widgets Grid */}
        {dashboard.widgets.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-white">Empty Dashboard Layout</h3>
            <p className="text-xs text-slate-400 mt-2">
              There are no visualization widgets registered in this session yet.
            </p>
            <Button
              onClick={() => navigate(`/visualizations/studio?dashboardId=${dashboard.id}`)}
              className="mt-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-4"
            >
              Open Visualization Studio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.widgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onDelete={() => handleDeleteWidget(widget.id)}
              />
            ))}
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  );
}

function WidgetCard({ widget, onDelete }: { widget: Widget; onDelete: () => void }) {
  const { data: response, isLoading, error } = useWidgetData(widget.id);

  return (
    <div className="flex flex-col p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white truncate">{widget.title}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
            {widget.chart_type} • {widget.aggregate_func || 'raw'}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
          title="Remove widget"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin" />
        ) : error ? (
          <p className="text-xs text-rose-400">Failed to load aggregated dataset points.</p>
        ) : !response?.data || response.data.length === 0 ? (
          <p className="text-xs text-slate-500">No chart data matching parameters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {renderChart(widget.chart_type, widget.x_axis, widget.y_axis, response.data)}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function renderChart(type: string, xKey: string, yKey: string, data: any[]) {
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
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fillOpacity={1} fill="url(#colorArea)" strokeWidth={2} />
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
