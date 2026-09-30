import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Source } from './types';
import { authService } from './services/authService';
import { sourcesService } from './services/sourcesService';
import { isSupabaseConfigured } from './lib/supabase';
import { checkSupabaseConnection, type BackendStatusReport } from './lib/status';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { FileUpload } from './components/FileUpload';
import { SourceList } from './components/SourceList';
import { ShieldCheck, HardDrive, RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  // Backend config diagnostics (if env is missing or needs setup)
  const [backendStatus, setBackendStatus] = useState<BackendStatusReport | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const loadSources = useCallback(async () => {
    if (!user) return;
    setSourcesLoading(true);
    try {
      const { data, error } = await sourcesService.getSources();
      if (!error && data) {
        setSources(data);
      }
    } catch (err) {
      console.error('[Recall] Error fetching sources:', err);
    } finally {
      setSourcesLoading(false);
    }
  }, [user]);

  // Initial Auth Check & Session Listener
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { session } = await authService.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user || null);
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('[Recall] Auth init error:', err);
        if (mounted) setAuthLoading(false);
      }
    };

    initAuth();

    const subscription = authService.onAuthStateChange((newSession, newUser) => {
      if (mounted) {
        setSession(newSession);
        setUser(newUser);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch sources when authenticated user changes
  useEffect(() => {
    if (user) {
      loadSources();
    } else {
      setSources([]);
    }
  }, [user, loadSources]);

  const handleSignOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
  };

  const runDiagnosticCheck = async () => {
    setDiagLoading(true);
    try {
      const report = await checkSupabaseConnection();
      setBackendStatus(report);
    } finally {
      setDiagLoading(false);
    }
  };

  // 1. If Supabase is completely unconfigured, show setup guide
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-2xs">
                R
              </div>
              <span className="font-semibold text-slate-900 tracking-tight text-lg">Recall</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Configuration Needed
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
              Supabase Configuration Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Recall requires your Supabase project URL and Anon public key to initialize authentication and private storage.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-950">Setup Steps</div>
                <div className="mt-1 leading-relaxed text-amber-800">
                  1. Copy <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">.env.example</code> to <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">.env.local</code><br />
                  2. Fill in <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.<br />
                  3. Run <code className="font-mono">supabase/migrations/20261001000000_recall_initial_schema.sql</code> in your Supabase SQL editor.
                </div>
              </div>
            </div>

            <button
              onClick={runDiagnosticCheck}
              disabled={diagLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? 'animate-spin' : ''}`} />
              <span>Recheck Configuration</span>
            </button>

            {backendStatus && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                {backendStatus.message}
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          Recall &copy; 2026 &bull; BuildX Hackathon
        </footer>
      </div>
    );
  }

  // 2. Loading session state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm animate-pulse">
            R
          </div>
          <span className="text-xs text-slate-500 font-medium">Initializing Recall...</span>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State (Show Sign In / Sign Up)
  if (!session || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-2xs">
                R
              </div>
              <span className="font-semibold text-slate-900 tracking-tight text-lg">Recall</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              BuildX Hackathon &bull; Phase 2
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-2">
              "You already have the answer. Recall finds it."
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Securely store and retrieve your college syllabi, lecture slides, whiteboard screenshots, and notes.
            </p>
          </div>

          <AuthForm onAuthSuccess={() => authService.getSession().then(({ session }) => {
            setSession(session);
            setUser(session?.user || null);
          })} />
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          Recall &copy; 2026 &bull; Protected by PostgreSQL Row Level Security (RLS)
        </footer>
      </div>
    );
  }

  // 4. Authenticated Application (/app view)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      <Navbar user={user} onSignOut={handleSignOut} />

      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Welcome & Storage Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Your Digital Memory Vault</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload course files and screenshots to your private, encrypted storage vault.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">RLS Active</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
              <HardDrive className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-medium">user_files bucket</span>
            </div>
          </div>
        </div>

        {/* Section 1: Upload Dropzone */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Upload Materials
            </h2>
          </div>
          <FileUpload userId={user.id} onUploadComplete={loadSources} />
        </section>

        {/* Section 2: Stored Sources List */}
        <section className="pt-2">
          <SourceList
            sources={sources}
            loading={sourcesLoading}
            onRefresh={loadSources}
          />
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Recall &copy; 2026 &bull; BuildX Hackathon &bull; Phase 2: Ingestion & Storage
      </footer>
    </div>
  );
}

export default App;
