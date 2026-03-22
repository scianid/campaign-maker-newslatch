import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Images,
  ImageIcon,
  Trash2,
  X,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';

const SOCIAL_IMAGE_ENDPOINT = 'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/get-social-images';
const SOCIAL_IMAGE_TOKEN = 'cmlnX_4jzR0y5G7q1s3cJmV0dZQpYdJ0aT0kK6R3bWw';

const FILTERS = ['All', 'Breaking News', 'Top Scored'];

function qualityClasses(score) {
  if (score >= 85) return 'bg-violet-100 text-violet-700';
  if (score >= 70) return 'bg-indigo-100 text-indigo-600';
  return 'bg-slate-100 text-slate-500';
}

function statusClasses(status) {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-500';
}

async function downloadImage(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'image.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    // CORS blocked — use anchor with download attr as fallback
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename || 'image.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function GalleryModal({ images, onClose }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-800">Image Gallery</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3">
          {images.map(({ imageUrl, sourceUrl }, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <img src={imageUrl} alt="" className="aspect-video w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/50 px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Source
                </a>
                <button
                  onClick={() => downloadImage(imageUrl, `image-${i + 1}.jpg`)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30"
                >
                  <Download className="h-3 w-3" />
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdBridgeHistoryPageV2() {
  const { jobId: jobIdParam } = useParams();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState(jobIdParam ?? null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sort, setSort] = useState('score');
  const [openDrawers, setOpenDrawers] = useState(new Set());
  const [galleryCard, setGalleryCard] = useState(null); // card whose gallery is open
  // sourceUrl → imageUrl, accumulated across all loaded jobs
  const [sourceImageMap, setSourceImageMap] = useState({});

  const toggleDrawer = id => setOpenDrawers(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

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

  // Sync URL param → state when navigating in via deep link
  useEffect(() => {
    if (jobIdParam) {
      setSelectedJobId(jobIdParam);
    } else if (!selectedJobId && latestJob?.id) {
      setSelectedJobId(latestJob.id);
    }
  }, [jobIdParam, latestJob, selectedJobId]);

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

  // Gallery images for the open card
  const galleryImages = galleryCard
    ? (galleryCard.sourcesLinks ?? []).map(url => ({ sourceUrl: url, imageUrl: sourceImageMap[url] })).filter(e => e.imageUrl)
    : [];

  // Fetch social images for news source URLs (skip already-fetched)
  useEffect(() => {
    if (rawResults.length === 0) return;

    const urls = rawResults
      .flatMap(r => (Array.isArray(r.sources_links) ? r.sources_links : []))
      .filter((url, i, arr) => url && arr.indexOf(url) === i && !(url in sourceImageMap));

    if (urls.length === 0) return;

    let cancelled = false;
    fetch(SOCIAL_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-social-image-token': SOCIAL_IMAGE_TOKEN,
      },
      body: JSON.stringify({ sources: urls }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.success) return;
        const newEntries = {};
        data.results.forEach(({ sourceUrl, imageUrl }) => {
          newEntries[sourceUrl] = imageUrl || null;
        });
        setSourceImageMap(prev => ({ ...prev, ...newEntries }));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawResults]);
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
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      {galleryCard && (
        <GalleryModal images={galleryImages} onClose={() => setGalleryCard(null)} />
      )}
      {/* Top nav */}
      <div className="shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
          <div className="text-xl font-black tracking-tight text-blue-700">AdBridge Studio</div>
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

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-700">Generation Jobs</h2>
            {historyLoading && (
              <span className="text-xs text-slate-400">Loading…</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!historyLoading && historyJobs.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No jobs yet. Run a V2 generation first.</p>
            ) : (
              historyJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/ad-bridge-v2/history/${job.id}`)}
                  className={[
                    'group w-full border-b border-slate-100 px-4 py-3 text-left transition-colors',
                    selectedJob?.id === job.id
                      ? 'bg-blue-50'
                      : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={[
                      'text-xs font-bold',
                      selectedJob?.id === job.id ? 'text-blue-700' : 'text-slate-800',
                    ].join(' ')}>
                      {job.target_geo}
                    </span>
                    <span className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      statusClasses(job.status),
                    ].join(' ')}>
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {job.completed_campaigns ?? 0}/{job.total_campaigns ?? 0} campaigns
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(job.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {new Date(job.created_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); handleDeleteJob(job.id); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteJob(job.id); } }}
                      className="rounded p-1 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      title="Delete job"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
            {/* Filters */}
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    activeFilter === filter
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={event => setSort(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="score">Sort: Score</option>
              <option value="quality">Sort: Quality</option>
              <option value="urgency">Sort: Urgency</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              {filteredResults.length > 0 && (
                <span className="text-xs text-slate-400">
                  {filteredResults.length} of {normalizedResults.length} results
                </span>
              )}
              <button
                onClick={() => selectedJob && exportAdBridgeCsv(filteredResults, exportMap)}
                disabled={!selectedJob || filteredResults.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
              <button
                onClick={handleCopyAll}
                disabled={filteredResults.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy all
              </button>
            </div>
          </div>

          {/* Card list */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {!selectedJob ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">Select a job from the sidebar to view results.</p>
              </div>
            ) : loadingSelectedJob ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">Loading results…</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">No results match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((card, index) => {
                  const info = exportMap[card.campaignId] || {};
                  const qualityScore = card.qualityScore ?? 0;
                  const drawerKey = card.campaignId ?? index;
                  const isDrawerOpen = openDrawers.has(drawerKey);
                  const hasExtra = (Array.isArray(card.sourcesLinks) && card.sourcesLinks.length > 0) || card.adImagePrompt;

                  return (
                    <article
                      key={card.campaignId}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-stretch gap-0">
                        {/* Left meta */}
                        <div className="flex w-28 shrink-0 flex-col justify-center gap-1 border-r border-slate-100 px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              #{index + 1}
                            </span>
                            <span className="truncate text-xs font-semibold text-slate-700">
                              {info.companyName || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={[
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                              qualityClasses(qualityScore),
                            ].join(' ')}>
                              Q {card.qualityScore ?? '—'}
                            </span>
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              U {card.urgencyScore ?? '—'}
                            </span>
                          </div>
                        </div>

                        {/* Content: header + body, each with inline copy */}
                        <div className="min-w-0 flex-1 py-2.5 pl-4 pr-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(card.adHeader || '')}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                              title="Copy headline"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                            <h2 className="flex-1 truncate text-base font-bold text-slate-900">
                              {card.adHeader || 'Untitled creative'}
                            </h2>
                          </div>
                          <div className="mt-1 flex items-start gap-2">
                            <button
                              onClick={() => copyToClipboard(card.adBody || '')}
                              className="mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                              title="Copy body"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                            <p className="flex-1 text-sm leading-5 text-slate-500">
                              {card.adBody || 'No ad body available.'}
                            </p>
                          </div>
                          {(card.bridgeFoundation?.connectionBasis || card.bridgeFoundation?.timingUrgency) && (
                            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Why?</p>
                              {card.bridgeFoundation?.connectionBasis && (
                                <p className="text-xs leading-5 text-slate-500">{card.bridgeFoundation.connectionBasis}</p>
                              )}
                              {card.bridgeFoundation?.timingUrgency && (
                                <p className="mt-1 text-xs italic leading-5 text-slate-400">{card.bridgeFoundation.timingUrgency}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: source image — auto-height, fixed width */}
                        {(() => {
                          const firstImageUrl = Array.isArray(card.sourcesLinks)
                            ? card.sourcesLinks.find(l => sourceImageMap[l])
                            : null;
                          const firstLink = Array.isArray(card.sourcesLinks)
                            ? card.sourcesLinks[0]
                            : null;
                          const isPending = Array.isArray(card.sourcesLinks) &&
                            card.sourcesLinks.length > 0 &&
                            !firstImageUrl &&
                            card.sourcesLinks.some(l => !(l in sourceImageMap));

                          if (firstImageUrl) {
                            return (
                              <div className="relative block w-56 shrink-0 self-stretch overflow-hidden border-l border-slate-100">
                                <img
                                  src={sourceImageMap[firstImageUrl]}
                                  alt=""
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                                {/* Overlay actions */}
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    onClick={() => downloadImage(sourceImageMap[firstImageUrl], 'image.jpg')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30"
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>
                                  {Array.isArray(card.sourcesLinks) && card.sourcesLinks.filter(l => sourceImageMap[l]).length > 1 && (
                                    <button
                                      onClick={() => setGalleryCard(card)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30"
                                      title="Gallery"
                                    >
                                      <Images className="h-3 w-3" />
                                      All
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          if (isPending) {
                            return (
                              <div className="relative w-56 shrink-0 self-stretch overflow-hidden border-l border-slate-100 bg-slate-100">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-300">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Sources & image prompt — collapsed by default */}
                      {hasExtra && (
                        <div className="border-t border-slate-100">
                          <button
                            onClick={() => toggleDrawer(drawerKey)}
                            className="flex w-full items-center gap-1.5 px-5 py-2 text-left text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} />
                            Sources & image prompt
                          </button>
                          {isDrawerOpen && (
                            <div className="flex flex-wrap gap-6 bg-slate-50 px-5 pb-3">
                          {Array.isArray(card.sourcesLinks) && card.sourcesLinks.length > 0 && (
                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Sources
                              </p>
                              <ul className="space-y-0.5">
                                {card.sourcesLinks.map((link, i) => (
                                  <li key={i}>
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex max-w-xs items-center gap-1 truncate text-xs text-blue-700 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      {link}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {card.adImagePrompt && (
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Image Prompt
                              </p>
                              <p className="text-xs leading-5 text-slate-500">{card.adImagePrompt}</p>
                            </div>
                          )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
