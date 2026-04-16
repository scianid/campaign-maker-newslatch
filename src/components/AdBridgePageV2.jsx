import { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Globe,
  KeyRound,
  Link,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';
import { GeoSelect } from '../ui/GeoSelect';

export function AdBridgePageV2() {
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef(null);

  const {
    rawInput,
    parsedUrls,
    invalidUrls,
    targetGeo,
    apiKey,
    pipelineStage,
    handleRawInput,
    handleFileUpload,
    setTargetGeo,
    setApiKey,
    startAnalysis,
  } = useAdBridgeV2();

  const validCount = parsedUrls.length;
  const invalidCount = invalidUrls.length;
  const canProceed = validCount > 0 && invalidCount === 0 && apiKey.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-black tracking-tight text-blue-700">AdBridge Studio</div>
          <div className="hidden items-center gap-8 md:flex">
            <NavLink
              to="/ad-bridge-v2"
              className="border-b-2 border-blue-700 pb-1 text-sm font-bold text-blue-700"
            >
              Generator
            </NavLink>
            <NavLink
              to="/ad-bridge-v2/history"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
            >
              History
            </NavLink>
          </div>
          <div className="rounded-full bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700">
            V2 Prototype
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-10 space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Create news-driven ad creatives
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Paste affiliate URLs, configure targeting, and launch analysis in one focused workflow.
          </p>
        </header>

        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Input', icon: Link, active: true },
              { label: 'Analysis', icon: BarChart3, active: false },
                { label: 'Generation', icon: Sparkles, active: false },
              { label: 'Results', icon: CheckCircle2, active: false },
            ].map(step => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-full border transition-colors sm:h-12 sm:w-12',
                      step.active
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-500',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={[
                      'text-xs font-semibold sm:text-sm',
                      step.active ? 'text-blue-700' : 'text-slate-500',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                  <Link className="h-5 w-5 text-blue-700" />
                  Campaign Sources
                </h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV/XLSX
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={event => handleFileUpload(event.target.files?.[0])}
                />
              </div>

              <textarea
                value={rawInput}
                onChange={e => handleRawInput(e.target.value)}
                className="h-48 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-700/20 placeholder:text-slate-400 focus:ring-4"
                placeholder="Paste your affiliate landing page URLs here (one per line)..."
              />

              <div className="mt-5 space-y-2.5">
                {parsedUrls.length === 0 && invalidUrls.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No URLs yet. Paste one URL per line.
                  </div>
                )}

                {parsedUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span className="truncate text-sm font-medium text-slate-800">{url}</span>
                    </div>
                    <span className="ml-2 flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      Valid
                    </span>
                  </div>
                ))}

                {invalidUrls.map((url, index) => (
                  <div
                    key={`${url}-invalid-${index}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                      <span className="truncate text-sm font-medium text-slate-800">{url}</span>
                    </div>
                    <span className="ml-2 flex-shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                      Invalid
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                <Globe className="h-5 w-5 text-blue-700" />
                Configuration
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-600">Target GEO</label>
                  <GeoSelect value={targetGeo} onChange={setTargetGeo} />
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-600">API Key</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="Enter your AdBridge API key"
                      autoComplete="off"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-20 text-sm text-slate-900 outline-none ring-blue-700/20 placeholder:text-slate-400 focus:ring-4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <button
                disabled={!canProceed}
                onClick={() => {
                  const started = startAnalysis();
                  if (started) {
                    navigate('/ad-bridge-v2/generating');
                  }
                }}
                className={[
                  'inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all sm:text-base',
                  canProceed
                    ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-300/50 hover:scale-[1.01]'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400',
                ].join(' ')}
              >
                Next: Start Analysis
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                {pipelineStage === 'analyzing'
                  ? 'Analysis already running.'
                  : canProceed
                    ? 'Ready to analyze campaigns.'
                    : 'Add an API key and keep only valid URLs to proceed.'}
              </p>

              <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
                {validCount} valid / {invalidCount} invalid URLs
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
