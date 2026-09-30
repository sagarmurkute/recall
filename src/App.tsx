import { useEffect, useState } from 'react';
import { checkSupabaseConnection, type BackendStatusReport } from './lib/status';
import { Database, ShieldCheck, HardDrive, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [status, setStatus] = useState<BackendStatusReport | null>(null);
  const [loading, setLoading] = useState(true);

  const runStatusCheck = async () => {
    setLoading(true);
    try {
      const report = await checkSupabaseConnection();
      setStatus(report);
    } catch (err) {
      console.error('Failed to check backend status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runStatusCheck();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 selection:bg-blue-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              R
            </div>
            <div>
              <span className="font-semibold text-slate-900 tracking-tight text-lg">Recall</span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Phase 1: Foundation
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <span>BuildX Hackathon</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Header Block */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            Recall Architecture Foundation
          </h1>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            "You already have the answer. Recall finds it."
          </p>
        </div>

        {/* Backend Diagnostic Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Supabase Connection Diagnostics</h2>
                <p className="text-xs text-slate-500">Live configuration and reachability verification</p>
              </div>
            </div>
            <button
              onClick={runStatusCheck}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Recheck Connection
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Indicator Banner */}
            {loading ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 flex items-center space-x-3">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Checking Supabase backend reachability...</span>
              </div>
            ) : status?.isConnected ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-emerald-950">Supabase Backend Connected</div>
                  <div className="text-emerald-700 text-xs mt-0.5">{status.message}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-950">Backend Setup Required</div>
                  <div className="text-amber-800 text-xs mt-0.5">{status?.message}</div>
                </div>
              </div>
            )}

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Environment URL
                </div>
                <div className="font-mono text-xs text-slate-800 break-all">
                  {status?.supabaseUrl || 'Not set in .env.local'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Configuration Status
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      status?.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-800">
                    {status?.isConfigured ? 'Environment Configured' : 'Missing .env.local Keys'}
                  </span>
                </div>
              </div>
            </div>

            {/* Foundation Layer Checklist */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Phase 1 Foundation Components
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center space-x-3">
                    <Database className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">PostgreSQL Schema & Tables</div>
                      <div className="text-xs text-slate-500">
                        profiles, sources, documents, document_chunks, collections, search_history
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                    Migration Ready
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">Row Level Security (RLS)</div>
                      <div className="text-xs text-slate-500">
                        Strict user ownership policies on all tables (auth.uid() = user_id)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Configured in SQL
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">Supabase Storage Bucket</div>
                      <div className="text-xs text-slate-500">
                        Private 'user_files' bucket for PDFs, screenshots, and text files (25MB limit)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Private / Signed Access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Instructions Block */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-6 text-xs text-slate-600 space-y-3">
          <div className="font-semibold text-slate-800 text-sm">How to Connect Your Supabase Project:</div>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
            <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">supabase.com</a>.</li>
            <li>Copy <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">.env.example</code> to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">.env.local</code> and fill in your Project URL and Anon Key.</li>
            <li>Run the SQL migration located at <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">supabase/migrations/20261001000000_recall_initial_schema.sql</code> in the Supabase SQL Editor.</li>
            <li>Click <strong>"Recheck Connection"</strong> above to verify backend connectivity.</li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Recall &copy; 2026 &bull; BuildX Hackathon &bull; Phase 1: Supabase Foundation
      </footer>
    </div>
  );
}

export default App;
