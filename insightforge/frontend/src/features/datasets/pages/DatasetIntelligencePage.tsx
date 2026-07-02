import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { useDataset, useDatasetIntelligence } from '../hooks/useDatasets';
import { paths } from '@/routes/paths';

export function DatasetIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const datasetId = id || '';

  const { data: dataset, isLoading: isLoadingDataset, error: datasetError } = useDataset(datasetId);
  const { data: intelligence, isLoading: isLoadingIntelligence, error: intelligenceError } = useDatasetIntelligence(datasetId);

  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const isLoading = isLoadingDataset || isLoadingIntelligence;
  const error = datasetError || intelligenceError;

  if (isLoading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute h-12 w-12 rounded-full border-4 border-slate-800"></div>
          <div className="absolute h-12 w-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Analyzing column semantics and statistics...</p>
      </div>
    );
  }

  if (error || !intelligence || !dataset) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center text-rose-200">
        <h3 className="text-lg font-semibold">Failed to load column profiling data</h3>
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

  const { columns, dataset_type, confidence_score } = intelligence;

  const toggleColumn = (colName: string) => {
    setExpandedColumn(expandedColumn === colName ? null : colName);
  };

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'sales':
        return (
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'customer':
        return (
          <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'marketing':
        return (
          <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'financial':
        return (
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'geographic':
        return (
          <svg className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'hr':
        return (
          <svg className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'numeric':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'categorical':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'date':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'geographic':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'text':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <FeatureErrorBoundary featureName="Dataset Intelligence">
      <div className="space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Dataset Intelligence</h1>
              <p className="text-sm text-slate-400 mt-1">
                Logical schemas, category counts, data domain categorization and profiles.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/datasets/${datasetId}/quality`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-850 hover:text-white transition-colors"
            >
              View Data Quality
            </Link>
          </div>
        </div>

        {/* Domain Classification Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-brand-500/10 blur-xl"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 flex items-center justify-center">
              {getDomainIcon(dataset_type || '')}
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Semantic Classification</span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {dataset_type ? dataset_type.charAt(0).toUpperCase() + dataset_type.slice(1) : 'General'} Analysis Domain
                {confidence_score && (
                  <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-400 border border-brand-500/20">
                    {confidence_score}% Confidence
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                The intelligence engine analyzed column label tokens and classified this as a{' '}
                <span className="text-slate-200 font-semibold">{dataset_type || 'general'}</span> dataset.
                Specialized data parsing handles the logical representations appropriately.
              </p>
            </div>
          </div>
        </div>

        {/* Dataset Dimensions */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Total Columns</span>
            <p className="mt-2 text-2xl font-semibold text-white">{columns.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Total Rows</span>
            <p className="mt-2 text-2xl font-semibold text-white">{dataset.metadata?.schema_json?.row_count?.toLocaleString() || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">File Size</span>
            <p className="mt-2 text-2xl font-semibold text-white">
              {dataset.file_size_bytes > 1024 * 1024
                ? `${(dataset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                : `${(dataset.file_size_bytes / 1024).toFixed(1)} KB`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400">Storage Format</span>
            <span className="mt-2 inline-flex items-center rounded bg-slate-950 px-2 py-1 text-xs font-mono text-slate-300 w-fit border border-slate-800">
              .{dataset.file_format.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Columns Profiler Accordion */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white">Schema Profiler & Column Summaries</h2>
            <p className="text-xs text-slate-400 mt-1">Select a column card below to expand its statistical profile.</p>
          </div>

          <div className="divide-y divide-slate-800">
            {columns.map((column) => {
              const isExpanded = expandedColumn === column.name;
              const { profile } = column;

              return (
                <div key={column.name} className="transition-colors hover:bg-slate-950/5">
                  {/* Header/Summary Card */}
                  <div
                    onClick={() => toggleColumn(column.name)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-200">{column.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${getTypeStyle(column.type)}`}>
                        {column.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-300">Unique:</span>{' '}
                        {profile.unique_count.toLocaleString()} ({profile.unique_percentage.toFixed(1)}%)
                      </div>
                      <div>
                        <span className="font-semibold text-slate-300">Missing:</span>{' '}
                        {profile.missing_count.toLocaleString()} ({profile.missing_percentage.toFixed(1)}%)
                      </div>
                      <svg
                        className={`h-5 w-5 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Profile Stats */}
                  {isExpanded && (
                    <div className="bg-slate-950/30 border-t border-slate-800/40 p-6 space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Statistics Grid */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary Statistics</h4>
                          
                          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Count</span>
                              <span className="font-semibold text-white">{profile.total_count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Nulls</span>
                              <span className="font-semibold text-white">{profile.missing_count.toLocaleString()} ({profile.missing_percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Distinct Values</span>
                              <span className="font-semibold text-white">{profile.unique_count.toLocaleString()} ({profile.unique_percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Type Specific Profile */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Semantic Profiles</h4>

                          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4">
                            {column.type === 'numeric' && (
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 block">Min Value</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.min !== undefined && profile.min !== null ? profile.min.toLocaleString() : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Max Value</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.max !== undefined && profile.max !== null ? profile.max.toLocaleString() : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Mean</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.mean !== undefined && profile.mean !== null ? profile.mean.toFixed(3) : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Median</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.median !== undefined && profile.median !== null ? profile.median.toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className="col-span-2 border-t border-slate-800 pt-2">
                                  <span className="text-slate-400 block">Std Dev</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.std !== undefined && profile.std !== null ? profile.std.toFixed(4) : 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {column.type === 'date' && (
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 block">Earliest Date</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.min_date || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Latest Date</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.max_date || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {column.type === 'text' && (
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 block">Min Length</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.min_length !== undefined ? `${profile.min_length} chars` : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Max Length</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.max_length !== undefined ? `${profile.max_length} chars` : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Mean Length</span>
                                  <span className="text-sm font-semibold text-white mt-0.5 block">{profile.mean_length !== undefined ? `${profile.mean_length.toFixed(1)} chars` : 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {(column.type === 'categorical' || column.type === 'geographic') && (
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                                  <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mode Value</span>
                                    <span className="text-white font-medium">{profile.most_frequent_value || 'N/A'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Occurrences</span>
                                    <span className="text-brand-400 font-semibold">{profile.most_frequent_count?.toLocaleString()} rows</span>
                                  </div>
                                </div>

                                {profile.category_counts && Object.keys(profile.category_counts).length > 0 && (
                                  <div className="space-y-2">
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mt-1">Value Distributions (Top 10)</span>
                                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                      {Object.entries(profile.category_counts).map(([catValue, count]) => {
                                        const percentage = (count / profile.total_count) * 100;
                                        return (
                                          <div key={catValue} className="space-y-1">
                                            <div className="flex justify-between text-[11px]">
                                              <span className="font-mono text-slate-300 truncate max-w-[200px]">{catValue === '' ? '<empty>' : catValue}</span>
                                              <span className="text-slate-400">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                              <div className="bg-brand-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
}
