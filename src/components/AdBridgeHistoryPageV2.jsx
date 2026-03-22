import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';
import { formatBridgeType } from '../lib/adBridgeUtils';

const FILTERS = ['All', 'Breaking News', 'Top Scored'];

function qualityClasses(tone) {
  if (tone === 'excellent') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-amber-100 text-amber-700';
}

export function AdBridgeHistoryPageV2() {
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sort, setSort] = useState('score');

  const {
    historyJobs,
    historyLoading,
    jobResults,
    jobResultsLoading,
    latestJob,
    loadHistory,
    loadJobResults,
    deleteHistoryJob,
    copyToClipboard,
    buildFbCopy,
    combinedScore,
    normalizeSavedResult,
    exportAdBridgeCsv,
    getJobExportMap,
  } = useAdBridgeV2();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!selectedJobId && latestJob?.id) {
      setSelectedJobId(latestJob.id);
    }
  }, [latestJob, selectedJobId]);

  useEffect(() => {
    if (selectedJobId && !jobResults[selectedJobId]) {
      loadJobResults(selectedJobId);
    }
  }, [jobResults, loadJobResults, selectedJobId]);

  useEffect(() => {
    if (selectedJobId && !historyJobs.some(job => job.id === selectedJobId)) {
      setSelectedJobId(historyJobs[0]?.id ?? null);
    }
  }, [historyJobs, selectedJobId]);

  const selectedJob = historyJobs.find(job => job.id === selectedJobId) || latestJob;
  const rawResults = selectedJob ? jobResults[selectedJob.id] || [] : [];
  const normalizedResults = useMemo(
    () => rawResults.map(normalizeSavedResult),
    [normalizeSavedResult, rawResults],
  );
  const exportMap = useMemo(() => getJobExportMap(rawResults), [rawResults, getJobExportMap]);

  const filteredResults = useMemo(() => {
    const next = normalizedResults.filter(result => {
      if (activeFilter === 'Breaking News') return result.bridgeType?.includes('TIER_1');
      if (activeFilter === 'Top Scored') return (result.urgencyScore ?? 0) >= 80 || (result.qualityScore ?? 0) >= 80;
      return true;
    });

    return next.sort((a, b) => {
      if (sort === 'quality') return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      if (sort === 'urgency') return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
      return combinedScore(b) - combinedScore(a);
    });
  }, [activeFilter, combinedScore, normalizedResults, sort]);

  const loadingSelectedJob = selectedJob ? jobResultsLoading.has(selectedJob.id) : false;
  const completedResults = normalizedResults.filter(result => result.status === 'COMPLETED');

  const handleCopyAll = async () => {
    if (filteredResults.length === 0) return;

    const text = filteredResults
      .filter(result => result.status === 'COMPLETED')
      .map((result, index) => `Variation ${index + 1}\n${buildFbCopy(result)}`)
      .join('\n\n----------------\n\n');

    if (text) {
      await copyToClipboard(text);
    }
  };

  const handleDeleteJob = async jobId => {
    const confirmed = window.confirm('Delete this saved generation job? This will also remove its saved results.');
    if (!confirmed) return;

    await deleteHistoryJob(jobId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-black tracking-tight text-blue-700">AdBridge Studio</div>
          <div className="hidden items-center gap-8 md:flex">
            <NavLink
              to="/ad-bridge-v2"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
            >
              Generator
            </NavLink>
            <NavLink
              to="/ad-bridge-v2/history"
              className="border-b-2 border-blue-700 pb-1 text-sm font-bold text-blue-700"
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
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>Step 4</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-blue-700">Results Dashboard</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {selectedJob ? 'Saved AdBridge generations' : 'AdBridge history'}
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600 sm:text-lg">
              {selectedJob
                ? `Review ${completedResults.length} saved creatives from ${selectedJob.target_geo}. Export or copy the strongest variations.`
                : 'Your completed AdBridge jobs will appear here once a generation run finishes.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => selectedJob && exportAdBridgeCsv(filteredResults, exportMap)}
              disabled={!selectedJob || filteredResults.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button
              onClick={handleCopyAll}
              disabled={filteredResults.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/50 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Copy all for FB
            </button>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {historyLoading && historyJobs.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 lg:col-span-3">
              Loading saved jobs...
            </div>
          ) : historyJobs.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 lg:col-span-3">
              No completed jobs yet. Run a V2 generation first.
            </div>
          ) : (
            historyJobs.map(job => (
              <div
                key={job.id}
                className={[
                  'rounded-3xl border bg-white p-5 text-left shadow-sm transition-colors',
                  selectedJob?.id === job.id
                    ? 'border-blue-400 bg-blue-50/70'
                    : 'border-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                <button onClick={() => setSelectedJobId(job.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-900">{job.target_geo}</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {job.completed_campaigns} / {job.total_campaigns} campaigns completed
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </button>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="mb-10 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white p-1 shadow-sm">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-6',
                  activeFilter === filter
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-500 hover:text-slate-900',
                ].join(' ')}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative min-w-[220px] flex-1 md:flex-none">
              <select
                value={sort}
                onChange={event => setSort(event.target.value)}
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-5 pr-12 text-sm font-medium text-slate-800 shadow-sm outline-none ring-blue-700/20 focus:ring-4"
              >
                <option value="score">Sort by Score</option>
                <option value="quality">Highest Quality</option>
                <option value="urgency">Highest Urgency</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-blue-700">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loadingSelectedJob ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 xl:col-span-3">
              Loading results...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 xl:col-span-3">
              No results match the selected job and filters.
            </div>
          ) : (
            filteredResults.map((card, index) => {
              const info = exportMap[card.campaignId] || {};
              const qualityTone = (card.qualityScore ?? 0) >= 80 ? 'excellent' : 'great';

              return (
                <article
                  key={card.campaignId}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative border-b border-slate-200 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-400 p-6 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                          Variation {index + 1}
                        </p>
                        <h2 className="mt-2 text-xl font-bold leading-tight">
                          {card.adHeader || 'Untitled creative'}
                        </h2>
                        <p className="mt-2 text-sm text-blue-100">
                          {info.companyName || 'Unknown company'}
                          {card.bridgeType ? ` • ${formatBridgeType(card.bridgeType)}` : ''}
                        </p>
                      </div>
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm',
                          qualityClasses(qualityTone),
                        ].join(' ')}
                      >
                        {qualityTone === 'excellent' ? (
                          <Star className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <ThumbsUp className="h-3.5 w-3.5" />
                        )}
                        Quality: {card.qualityScore ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6 lg:p-8">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Urgency {card.urgencyScore ?? '—'}
                      </span>
                      <div className="flex items-center gap-2">
                        {info.url && (
                          <a
                            href={info.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                            title="Open source URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => copyToClipboard(buildFbCopy(card))}
                          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                          title="Quick copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mb-3 text-sm font-semibold leading-6 text-slate-800">
                      {card.callToAction || 'No CTA available'}
                    </p>
                    <p className="mb-6 flex-1 text-sm leading-6 text-slate-600">
                      {card.adBody || 'No ad body returned for this creative.'}
                    </p>

                    <button
                      onClick={() => copyToClipboard(buildFbCopy(card))}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-slate-200"
                    >
                      Copy for FB
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {filteredResults.length > 0 && (
          <div className="mt-14 flex flex-col items-center gap-5">
            <p className="text-sm italic text-slate-500">
              Showing {filteredResults.length} of {normalizedResults.length} results
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
