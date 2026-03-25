import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bolt,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Lightbulb,
  Link as LinkIcon,
  MessageCircle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';

function StepItem({ label, current, complete, step }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
      <div
        className={[
          'flex items-center justify-center rounded-full',
          current
            ? 'h-12 w-12 scale-110 border-4 border-white bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-xl'
            : complete
              ? 'h-10 w-10 bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-300/30'
              : 'h-10 w-10 bg-slate-200 text-slate-500',
        ].join(' ')}
      >
        {complete ? <Check className="h-4 w-4" /> : <span className="text-sm font-black">{step}</span>}
      </div>
      <span
        className={[
          'text-xs font-black uppercase tracking-[0.16em] sm:text-sm',
          current ? 'text-blue-700' : 'text-slate-500',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
        <Check className="h-4 w-4" />
        COMPLETED
      </span>
    );
  }

  if (status === 'drafting') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-bold italic text-blue-700">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-700" />
        </span>
        DRAFTING COPY...
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
        <XCircle className="h-4 w-4" />
        FAILED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" />
      ANALYZING WEBSITE...
    </span>
  );
}

export function AdBridgeGeneratingPageV2() {
  const navigate = useNavigate();
  const {
    analyzedUrls,
    argusProgress,
    adResults,
    adStatus,
    activeJobDbId,
    completedCount,
    failedCount,
    generatingError,
    includedCount,
    pipelineStage,
    pipelineProgressPercent,
    startGeneration,
    toggleExcluded,
  } = useAdBridgeV2();

  useEffect(() => {
    if (pipelineStage === 'completed') {
      const target = activeJobDbId
        ? `/ad-bridge-v2/history/${activeJobDbId}`
        : '/ad-bridge-v2/history';
      navigate(target, { replace: true });
    }
  }, [pipelineStage, activeJobDbId, navigate]);

  const resultsByCampaignId = Object.fromEntries(
    adResults.map(result => [result.campaignId, result]),
  );

  const processingItems = analyzedUrls.map(item => {
    const result = resultsByCampaignId[item.campaignId];

    if (item.status === 'failed') {
      return { url: item.url, stage: 'Landing Page Analysis', status: 'failed' };
    }

    if (item.status === 'pending' || item.status === 'analyzing') {
      return {
        url: item.url,
        stage: 'Landing Page Analysis',
        status: item.status === 'analyzing' ? 'analyzing' : 'pending',
      };
    }

    if (result?.status === 'COMPLETED') {
      return { url: item.url, stage: 'Ad Copy Generation', status: 'completed' };
    }

    if (result?.status === 'FAILED') {
      return { url: item.url, stage: 'Ad Copy Generation', status: 'failed' };
    }

    if (pipelineStage === 'generating' || adStatus === 'submitting' || adStatus === 'polling') {
      return { url: item.url, stage: 'Ad Copy Generation', status: 'drafting' };
    }

    return { url: item.url, stage: 'Landing Page Analysis', status: 'completed' };
  });

  const heading =
    pipelineStage === 'analyzing'
      ? 'Analyzing your affiliate URLs...'
      : pipelineStage === 'review'
        ? 'Analysis complete. Review before generation'
      : pipelineStage === 'completed'
        ? 'Your ad creatives are ready'
        : pipelineStage === 'failed'
          ? 'AdBridge hit a problem'
          : 'Crafting your ad creatives...';

  const progressCircumference = 552.92;
  const progressOffset = progressCircumference * (1 - pipelineProgressPercent / 100);

  const body =
    pipelineStage === 'analyzing'
      ? `Processed ${processingItems.filter(item => item.status === 'completed' || item.status === 'failed').length} of ${processingItems.length} URLs. AdBridge is extracting company and offer context before generation starts.`
      : pipelineStage === 'review'
        ? `${processingItems.filter(item => item.status === 'completed').length} URLs are ready. Exclude anything you do not want before generation starts.`
      : pipelineStage === 'completed'
        ? `${adResults.filter(result => result.status === 'COMPLETED').length} creatives were generated successfully. You can review the dedicated results screen now.`
        : pipelineStage === 'failed'
          ? generatingError || 'The current pipeline did not complete successfully.'
          : `Generated ${argusProgress?.completedCampaigns ?? 0} of ${argusProgress?.totalCampaigns ?? processingItems.length} variations. We're refining the remaining campaigns now.`;

  if (analyzedUrls.length === 0 && adStatus === 'idle') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">No active AdBridge run</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Start a new V2 generation from the generator page, then this screen will show live analysis and generation progress.
          </p>
          <button
            onClick={() => navigate('/ad-bridge-v2')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/40"
          >
            Back to Generator
            <ChevronRight className="h-4 w-4" />
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
        <section className="mb-14">
          <div className="relative mx-auto flex max-w-4xl items-start justify-between">
            <div className="absolute left-10 right-10 top-5 z-0 h-1 rounded-full bg-slate-200" />
            <div
              className="absolute left-10 top-5 z-0 h-1 rounded-full bg-gradient-to-r from-blue-700 to-blue-500"
              style={{
                width: `${pipelineStage === 'review' ? 58 : pipelineStage === 'completed' ? 100 : 58}%`,
                maxWidth: 'calc(100% - 5rem)',
              }}
            />
            <StepItem label="Input" complete step="1" />
            <StepItem label="Analysis" complete step="2" />
            <StepItem label="Generation" current={pipelineStage === 'generating'} complete={pipelineStage === 'completed'} step="3" />
            <StepItem label="Results" current={pipelineStage === 'review' || pipelineStage === 'completed'} complete={pipelineStage === 'completed'} step="4" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-10">
                <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      stroke="url(#progress-gradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={progressCircumference}
                      strokeDashoffset={progressOffset}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0057bd" />
                        <stop offset="100%" stopColor="#6e9fff" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tight text-slate-900">{pipelineProgressPercent}%</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
                      Complete
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
                    {heading}
                  </h1>
                  <p className="text-lg leading-relaxed text-slate-600">
                    {body}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {pipelineStage !== 'failed' && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        High Efficiency Mode
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-800">
                      <Bolt className="h-3.5 w-3.5" />
                      {pipelineStage === 'analyzing' ? 'AI Analysis' : 'AI-Optimized'}
                    </span>
                    {argusProgress?.currentStep && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-800">
                        <Sparkles className="h-3.5 w-3.5" />
                        {argusProgress.currentStep}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="px-2 text-xl font-bold text-slate-600">Real-time Processing</h2>

              <div className="space-y-1 rounded-3xl bg-slate-100 p-1.5">
                {processingItems.map(item => {
                  const isDrafting = item.status === 'drafting';
                  const isCompleted = item.status === 'completed';
                  const isFailed = item.status === 'failed';

                  return (
                    <div
                      key={`${item.url}-${item.stage}`}
                      className={[
                        'flex flex-col gap-4 rounded-2xl bg-white p-5 transition-all hover:translate-x-1 sm:flex-row sm:items-center sm:justify-between',
                        isDrafting ? 'border-l-4 border-blue-700' : '',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={[
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : isFailed
                                ? 'bg-red-100 text-red-700'
                              : isDrafting
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-500',
                          ].join(' ')}
                        >
                          {isCompleted ? (
                            <LinkIcon className="h-5 w-5" />
                          ) : isFailed ? (
                            <XCircle className="h-5 w-5" />
                          ) : isDrafting ? (
                            <Sparkles className="h-5 w-5" />
                          ) : (
                            <Globe className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{item.url}</p>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            {item.stage}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>
                  );
                })}
              </div>

              {generatingError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {generatingError}
                </div>
              )}

              {pipelineStage === 'review' && (
                <div className="space-y-6">
                  <div className="flex justify-end">
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

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Analyzed', completedCount, 'bg-emerald-500'],
                      ['Failed', failedCount, 'bg-red-500'],
                      ['Included', includedCount, 'bg-blue-600'],
                    ].map(([label, count, accent]) => (
                      <div key={label} className="min-w-[96px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                        <div className={`h-1.5 w-full ${accent}`} />
                        <div className="p-4">
                          <p className="text-2xl font-black text-slate-900">{count}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                  </div>

                  <div className="flex justify-end">
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
                </div>
              )}

              {adStatus === 'completed' && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/ad-bridge-v2/results')}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/40"
                  >
                    View Results
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-sm backdrop-blur-xl">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-blue-700/10 to-blue-300/10" />

              <div className="mb-6 flex items-center gap-2 text-blue-700">
                <Lightbulb className="h-4 w-4" />
                <h3 className="text-sm font-black uppercase tracking-[0.16em]">While You Wait</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-lg font-bold leading-tight text-slate-900">
                    Emotional hooks raise CTR by roughly 15% on average.
                  </p>
                  <p className="text-sm text-slate-600">
                    AdBridge is currently testing multiple emotional angles for your strongest offer.
                  </p>
                </div>

                <div className="h-px w-full bg-slate-200" />

                <div className="space-y-3 opacity-70 transition-opacity hover:opacity-100">
                  <p className="font-bold leading-tight text-slate-900">
                    GEO targeting is already influencing the news bridge logic for the selected region.
                  </p>
                  <p className="text-sm italic text-slate-600">
                    This keeps campaigns locally relevant instead of using generic global angles.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-1">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-700 to-blue-500" />
                <div className="h-1 w-2 rounded-full bg-slate-300" />
                <div className="h-1 w-2 rounded-full bg-slate-300" />
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-3xl bg-slate-200 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <MessageCircle className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Need help?</p>
                <p className="mb-3 text-xs text-slate-600">
                  Our strategists are online if you have questions about the active generation run.
                </p>
                <button className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                  Chat with us
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
