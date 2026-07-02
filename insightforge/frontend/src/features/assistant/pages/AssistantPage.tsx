import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
  useDatasetInsights,
} from '../hooks/useAssistant';
import { useDatasets } from '@/features/datasets/hooks/useDatasets';
import { Button } from '@/components/ui/Button';

export function AssistantPage() {
  const { data: conversations = [], isLoading: isLoadingConvos } = useConversations();
  const { data: datasets = [] } = useDatasets();

  const createConvoMutation = useCreateConversation();
  const deleteConvoMutation = useDeleteConversation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: activeConvo, isLoading: isLoadingActive } = useConversation(activeId || '');

  const sendMessageMutation = useSendMessage(activeId || '');

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [inputMessage, setInputMessage] = useState('');

  // Fetch quality of dataset associated with active conversation
  const activeDatasetId = activeConvo?.dataset_id || '';
  const { data: insights } = useDatasetInsights(activeDatasetId);
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages, sendMessageMutation.isPending]);

  const handleCreateSession = async () => {
    if (!selectedDatasetId) return;
    try {
      const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
      const title = sessionTitle.trim() || `Chat: ${selectedDataset?.name || 'Dataset'}`;
      
      const newConvo = await createConvoMutation.mutateAsync({
        datasetId: selectedDatasetId,
        title,
      });
      setActiveId(newConvo.id);
      setShowNewModal(false);
      setSelectedDatasetId('');
      setSessionTitle('');
    } catch (err) {
      alert('Failed to create chat session');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat history?')) {
      try {
        await deleteConvoMutation.mutateAsync(id);
        if (activeId === id) {
          setActiveId(null);
        }
      } catch (err) {
        alert('Failed to delete chat session');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    const content = inputMessage.trim();
    setInputMessage('');
    try {
      await sendMessageMutation.mutateAsync(content);
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    if (sendMessageMutation.isPending) return;
    setInputMessage(question);
  };

  return (
    <FeatureErrorBoundary featureName="AI Assistant">
      <div className="flex h-[calc(100vh-8rem)] text-slate-200 gap-6 overflow-hidden">
        {/* Left Panel: Conversations Sidebar */}
        <div className="w-80 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">AI Copilot Sessions</h2>
            <Button
              onClick={() => setShowNewModal(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg"
            >
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {isLoadingConvos ? (
              <div className="flex justify-center items-center h-20">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-lg">
                No active chat sessions
              </div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => setActiveId(convo.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    activeId === convo.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-800/60 bg-slate-950/20 hover:bg-slate-950/40'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-semibold text-white truncate">{convo.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {convo.messages?.length || 0} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, convo.id)}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Panel: Active Chat Room */}
        <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="rounded-full bg-brand-500/10 p-4 border border-brand-500/20 text-brand-400 mb-4 animate-bounce">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">AI Analytics Assistant</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Select or start a chat session to query statistics, review data quality warnings, and locate business trends.
              </p>
              <Button
                onClick={() => setShowNewModal(true)}
                className="mt-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4"
              >
                Create New Chat
              </Button>
            </div>
          ) : (
            <>
              {/* Active Convo Header */}
              <div className="border-b border-slate-800 p-4 bg-slate-950/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeConvo?.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Dataset context active
                  </p>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/10 custom-scrollbar">
                {isLoadingActive ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  activeConvo?.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-3 border text-sm leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-brand-600/10 text-slate-200 border-brand-500/20'
                            : 'bg-slate-900/60 text-slate-200 border-slate-800/80'
                        }`}
                      >
                        <span className={`text-[10px] uppercase font-bold block mb-1.5 ${
                          msg.role === 'user' ? 'text-brand-400' : 'text-slate-400'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'AI Copilot'}
                        </span>
                        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}

                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-xl px-4 py-3 border bg-slate-900/60 border-slate-800/80 shadow-sm flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-225"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions and Bottom Input */}
              <div className="border-t border-slate-800 p-4 bg-slate-950/20 space-y-3">
                {/* Suggestions Chips */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickQuestion('Describe the overall data quality issues.')}
                    className="rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1 text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    🔍 Quality Issues?
                  </button>
                  <button
                    onClick={() => handleQuickQuestion('What visualization charts do you recommend?')}
                    className="rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1 text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    📊 Chart Recs?
                  </button>
                  <button
                    onClick={() => handleQuickQuestion('What are the key opportunities in this dataset?')}
                    className="rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1 text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    💡 Opportunities?
                  </button>
                </div>

                <div className="flex items-end gap-2 bg-slate-950/50 rounded-xl border border-slate-800/80 p-2 focus-within:border-brand-500 transition-colors">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask assistant about schema stats, duplicate rows, or insights..."
                    className="flex-1 bg-transparent resize-none outline-none border-none py-1.5 px-2 text-xs text-slate-200 max-h-24 min-h-[36px] font-sans custom-scrollbar"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    className="bg-brand-600 hover:bg-brand-500 text-white rounded-lg p-2 flex items-center justify-center shrink-0 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Dataset Context HUD */}
        {activeId && activeConvo && (
          <div className="w-80 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md overflow-hidden">
            <h2 className="text-sm font-semibold text-white mb-4">Dataset Context HUD</h2>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-850 space-y-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Linked Schema</span>
                <span className="text-xs font-semibold text-white block truncate">{activeDataset?.name || 'Dataset'}</span>
                <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded w-fit block uppercase">
                  .{activeDataset?.file_format || 'csv'}
                </span>
              </div>

              {/* Insights List */}
              {insights && (
                <div className="space-y-4 border-t border-slate-800/80 pt-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-emerald-400 tracking-wider mb-2">Opportunities</h3>
                    <ul className="space-y-1.5">
                      {insights.opportunities?.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 pl-3 relative">
                          <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-rose-400 tracking-wider mb-2">Warnings</h3>
                    <ul className="space-y-1.5">
                      {insights.warnings?.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 pl-3 relative">
                          <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Create Analysis Session</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Select Dataset
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">-- Choose uploaded file --</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (.{d.file_format})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Session Title (Optional)
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Sales Forecast Q2"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowNewModal(false);
                  setSelectedDatasetId('');
                  setSessionTitle('');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={!selectedDatasetId || createConvoMutation.isPending}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4"
              >
                Start Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </FeatureErrorBoundary>
  );
}
