import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';

export function AdBridgeReviewPageV2() {
  const navigate = useNavigate();
  const {
    analyzedUrls,
    completedCount,
    failedCount,
    includedCount,
    generatingError,
    pipelineStage,
    toggleExcluded,
    startGeneration,
  } = useAdBridgeV2();

  if (analyzedUrls.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">No analyzed URLs to review</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Start a V2 run first, then come back here to approve which URLs should proceed to generation.
          </p>
          <button
            onClick={() => navigate('/ad-bridge-v2')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/40"
          >
            Back to Generator
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-black tracking-tight text-blue-700">AdBridge Studio</div>
          <div className="hidden items-center gap-8 md:flex">
            <NavLink to="/ad-bridge-v2" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-700">Generator</NavLink>
            <NavLink to="/ad-bridge-v2/history" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-700">History</NavLink>
          </div>
          <div className="rounded-full bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700">V2 Prototype</div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium text-blue-700">Step 3 of 4</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Review analyzed URLs</h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Keep only the offers you want to generate against. Failed analyses stay visible but are skipped automatically.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Analyzed', completedCount, 'text-emerald-700 bg-emerald-50 border-emerald-200'],
              ['Failed', failedCount, 'text-red-700 bg-red-50 border-red-200'],
              ['Included', includedCount, 'text-blue-700 bg-blue-50 border-blue-200'],
            ].map(([label, count, tone]) => (
              <div key={label} className={`min-w-[96px] rounded-2xl border p-4 text-center ${tone}`}>
                <p className="text-2xl font-black">{count}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">Approval queue</h2>
            <p className="mt-1 text-sm text-slate-500">Toggle any analyzed URL off to exclude it from generation.</p>
          </div>

          <div className="divide-y divide-slate-200">
            {analyzedUrls.map(item => (
              <div key={item.campaignId} className={`px-6 py-5 ${item.excluded ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4">
                  {item.status === 'completed' ? (
                    <input
                      type="checkbox"
                      checked={!item.excluded}
                      onChange={() => toggleExcluded(item.campaignId)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-blue-700"
                    />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.companyName || 'Unknown company'}</span>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : item.status === 'analyzing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.url}</p>
                    {item.companyDescription && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.companyDescription}</p>
                    )}
                    {!!item.tags?.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.slice(0, 6).map(tag => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {generatingError && pipelineStage === 'failed' && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {generatingError}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={async () => {
              const started = await startGeneration();
              if (started) {
                navigate('/ad-bridge-v2/generating');
              }
            }}
            disabled={includedCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Generate ads for {includedCount} URL{includedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </main>
    </div>
  );
}
