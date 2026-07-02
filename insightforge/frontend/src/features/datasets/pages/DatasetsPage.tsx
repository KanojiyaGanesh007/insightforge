import { useState, useRef, DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { useDatasets, useUploadDataset, useDeleteDataset, useDatasetPreview } from '../hooks/useDatasets';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/services/api';

export function DatasetsPage() {
  const { data: datasets = [], isLoading, error } = useDatasets();
  const uploadMutation = useUploadDataset();
  const deleteMutation = useDeleteDataset();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Preview State
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewDatasetName, setPreviewDatasetName] = useState('');
  const { data: previewData, isLoading: isLoadingPreview } = useDatasetPreview(previewId || '', 20);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    if (!validExtensions.includes(ext)) {
      setValidationError('Unsupported format. Please upload CSV, Excel, or JSON.');
      return false;
    }
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setValidationError('File size exceeds the 50 MB limit.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setDatasetName(file.name.substring(0, file.name.lastIndexOf('.')));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setDatasetName(file.name.substring(0, file.name.lastIndexOf('.')));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        name: datasetName.trim() || undefined,
      });
      setUploadProgress(100);
      setTimeout(() => {
        setSelectedFile(null);
        setDatasetName('');
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setValidationError(getApiErrorMessage(err));
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        alert(getApiErrorMessage(err));
      }
    }
  };

  return (
    <FeatureErrorBoundary featureName="Datasets">
      <div className="space-y-6 text-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dataset Upload Center</h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload CSV, Excel, or JSON datasets to analyze schema structure, inspect data quality, and generate insights.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white mb-4">Ingest Dataset</h2>

              {/* Drag zone */}
              <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                  dragActive
                    ? 'border-brand-500 bg-brand-500/5'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-4 text-sm text-slate-300">
                      Drag & drop your file here, or{' '}
                      <button
                        type="button"
                        onClick={triggerFileSelect}
                        className="text-brand-400 hover:text-brand-300 focus:outline-none font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">CSV, Excel, or JSON up to 50MB</p>
                  </>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-emerald-400">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold text-sm">File Ready</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-rose-400 hover:text-rose-300 underline mt-2"
                      disabled={isUploading}
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Dataset Display Name
                    </label>
                    <input
                      type="text"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                      placeholder="e.g. Sales Q1"
                      disabled={isUploading}
                    />
                  </div>

                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Uploading & parsing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    className="w-full flex justify-center items-center font-semibold py-2.5 bg-brand-600 hover:bg-brand-500 text-white"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Process Dataset'}
                  </Button>
                </div>
              )}

              {validationError && (
                <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                  {validationError}
                </div>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white mb-4">Dataset History</h2>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-10 h-10 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">Loading datasets...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-rose-400">
                  Failed to load datasets: {getApiErrorMessage(error)}
                </div>
              ) : datasets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                  <p className="text-slate-400 text-sm">No datasets uploaded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Upload a CSV, Excel, or JSON file to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="pb-3 pr-2">Name</th>
                        <th className="pb-3 px-2">Format</th>
                        <th className="pb-3 px-2">Size</th>
                        <th className="pb-3 px-2">Dimensions</th>
                        <th className="pb-3 px-2">Uploaded</th>
                        <th className="pb-3 pl-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {datasets.map((dataset) => {
                        const rows = dataset.metadata?.schema_json?.row_count ?? 0;
                        const cols = dataset.metadata?.schema_json?.column_count ?? 0;
                        const date = new Date(dataset.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <tr key={dataset.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-4 pr-2 font-medium text-white max-w-[150px] truncate">
                              {dataset.name}
                            </td>
                            <td className="py-4 px-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider ${
                                  dataset.file_format === 'csv'
                                    ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                                    : dataset.file_format === 'json'
                                    ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20'
                                    : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                }`}
                              >
                                {dataset.file_format}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-slate-300">
                              {formatBytes(dataset.file_size_bytes)}
                            </td>
                            <td className="py-4 px-2 text-slate-300">
                              {rows > 0 ? `${rows} x ${cols}` : 'Loading...'}
                            </td>
                            <td className="py-4 px-2 text-slate-400 text-xs">{date}</td>
                            <td className="py-4 pl-2 text-right space-x-1.5 whitespace-nowrap">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setPreviewId(dataset.id);
                                  setPreviewDatasetName(dataset.name);
                                }}
                                className="text-slate-400 hover:text-white px-2 py-1 text-xs"
                              >
                                Preview
                              </Button>
                              <Link
                                to={`/datasets/${dataset.id}/intelligence`}
                                className="inline-flex items-center justify-center rounded-md text-brand-400 hover:text-brand-300 hover:bg-brand-500/5 px-2 py-1 text-xs font-semibold transition-colors"
                              >
                                Semantic Info
                              </Link>
                              <Link
                                to={`/datasets/${dataset.id}/quality`}
                                className="inline-flex items-center justify-center rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 px-2 py-1 text-xs font-semibold transition-colors"
                              >
                                Quality Center
                              </Link>
                              <Button
                                variant="ghost"
                                onClick={() => handleDelete(dataset.id)}
                                className="text-rose-400 hover:text-rose-300 px-2 py-1 text-xs"
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Preview: {previewDatasetName}</h3>
                  <p className="text-xs text-slate-400 mt-1">Showing first 20 records of the dataset</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewId(null);
                    setPreviewDatasetName('');
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 bg-slate-950/40">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-10 h-10 border-4 border-slate-850 border-t-brand-500 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400 font-medium">Reading records...</span>
                  </div>
                ) : !previewData || previewData.rows.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No data records could be parsed for preview.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-medium uppercase tracking-wider">
                          <th className="p-3 border-r border-slate-800 w-12 text-center">#</th>
                          {previewData.columns.map((col) => (
                            <th key={col} className="p-3 border-r border-slate-800 font-semibold text-slate-300">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/20 text-slate-300">
                        {previewData.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-800/10">
                            <td className="p-3 border-r border-slate-800 text-slate-500 text-center font-medium">
                              {index + 1}
                            </td>
                            {previewData.columns.map((col) => (
                              <td key={col} className="p-3 border-r border-slate-800 font-normal truncate max-w-[200px]">
                                {row[col] === null || row[col] === undefined ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4 flex justify-end">
                <Button
                  onClick={() => {
                    setPreviewId(null);
                    setPreviewDatasetName('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  );
}
