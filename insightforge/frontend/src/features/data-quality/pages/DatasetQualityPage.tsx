import { useParams, Link } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { useDataset, useDatasetQuality } from '@/features/datasets/hooks/useDatasets';
import { paths } from '@/routes/paths';

export function DatasetQualityPage() {
  const { id } = useParams<{ id: string }>();
  const datasetId = id || '';

  const { data: dataset, isLoading: isLoadingDataset, error: datasetError } = useDataset(datasetId);
  const { data: qualityReport, isLoading: isLoadingQuality, error: qualityError } = useDatasetQuality(datasetId);

  const isLoading = isLoadingDataset || isLoadingQuality;
  const error = datasetError || qualityError;

  if (isLoading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute h-12 w-12 rounded-full border-4 border-slate-800"></div>
          <div className="absolute h-12 w-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Running data quality metrics analysis...</p>
      </div>
    );
  }

  if (error || !qualityReport || !dataset) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center text-rose-200">
        <h3 className="text-lg font-semibold">Failed to load dataset quality metrics</h3>
        <p className="mt-2 text-sm text-rose-300/80">Please verify the dataset exists and try again.</p>
        <Link
          to={paths.datasets}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium hover:bg-rose-500/30 transition-colors"
        >
          Back to Datasets
        </Link>
      </div>
    );
  }

  const { overall, columns: colQuality, issues } = qualityReport;

  // Helper to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'stroke-emerald-500 text-emerald-400';
    if (score >= 70) return 'stroke-amber-500 text-amber-400';
    return 'stroke-rose-500 text-rose-400';
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // SVG parameters for progress circles
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const renderGauge = (score: number, title: string, desc: string) => {
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
    const colorClasses = getScoreColor(score);

    return (
      <div className="flex flex-col items-center p-6 bg-slate-900/40 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
            <circle
              className={`transition-all duration-1000 ease-out ${colorClasses.split(' ')[0]}`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
          </svg>
          <span className={`absolute text-xl font-bold tracking-tight ${colorClasses.split(' ')[1]}`}>
            {Math.round(score)}%
          </span>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-400 text-center">{desc}</p>
      </div>
    );
  };

  return (
    <FeatureErrorBoundary featureName="Dataset Quality">
      <div className="space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to={paths.datasets}
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-2 hover:bg-slate-900 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Data Quality Center</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Health metrics, duplicate inspection, anomalies, and schema validation.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Dataset:</span>
            <span className="rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300">
              {dataset.name} ({dataset.file_format.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Quality Score Gauges */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {renderGauge(
            overall.quality_score,
            'Overall Quality',
            'Weighted accuracy, consistency and completeness.'
          )}
          {renderGauge(
            overall.completeness_score,
            'Completeness',
            'Percentage of non-null cells across the dataset.'
          )}
          {renderGauge(
            overall.consistency_score,
            'Consistency',
            'Logical data type conformity in column values.'
          )}
          {renderGauge(
            overall.accuracy_score,
            'Accuracy Score',
            'Absence of statistical outliers & structural errors.'
          )}
        </div>

        {/* Summary Metrics cards */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Total Records</span>
            <p className="mt-2 text-2xl font-semibold text-white">{overall.total_rows.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Duplicate Rows</span>
            <p className="mt-2 text-2xl font-semibold text-white">{overall.duplicate_rows.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Duplicate %</span>
            <p className={`mt-2 text-2xl font-semibold ${overall.duplicate_rows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {overall.duplicate_percentage.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Outliers Found</span>
            <p className={`mt-2 text-2xl font-semibold ${overall.outlier_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overall.outlier_count.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Issues List & Column-level stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quality Issues List */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Identified Issues</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  issues.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>

              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400 mb-3 border border-emerald-500/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Clean Dataset</h4>
                  <p className="text-xs text-slate-500 text-center mt-1">No quality or integrity warnings detected.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${getSeverityStyle(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        {issue.column && (
                          <span className="text-xs font-mono text-brand-400 font-medium">
                            {issue.column}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column level metrics table */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">Column Quality Metrics</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-medium uppercase tracking-wider">
                      <th className="py-3 px-4">Column</th>
                      <th className="py-3 px-4">Missing (Null)</th>
                      <th className="py-3 px-4">Outliers</th>
                      <th className="py-3 px-4">Consistency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {Object.entries(colQuality).map(([colName, colStat]) => (
                      <tr key={colName} className="hover:bg-slate-950/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-200">{colName}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{colStat.null_count} rows</span>
                            <span className={`text-xs ${colStat.null_count > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {colStat.null_percentage.toFixed(1)}% missing
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {colStat.outlier_count !== undefined ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-100">{colStat.outlier_count}</span>
                              <span className={`text-xs ${colStat.outlier_count > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                                {colStat.outlier_percentage.toFixed(1)}% outliers
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  colStat.consistency_percentage >= 90
                                    ? 'bg-emerald-500'
                                    : colStat.consistency_percentage >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${colStat.consistency_percentage}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-slate-100">
                              {colStat.consistency_percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
}
