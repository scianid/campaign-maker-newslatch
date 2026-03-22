import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useAdBridgeV2 } from './AdBridgeV2Provider';
import { formatBridgeType } from '../lib/adBridgeUtils';

function qualityClasses(tone) {
  if (tone === 'excellent') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
}

export function AdBridgeResultsPageV2() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sort, setSort] = useState('score');
  const {
    adResults,
    analyzedMap,
    adStatus,
    copyToClipboard,
    buildFbCopy,
    combinedScore,
    exportAdBridgeCsv,
  } = useAdBridgeV2();

  const filteredResults = useMemo(() => {
    const next = adResults.filter(result => {
      if (activeFilter === 'breaking') return result.bridgeType?.includes('TIER_1');
      if (activeFilter === 'top') return (result.urgencyScore ?? 0) >= 80 || (result.qualityScore ?? 0) >= 80;
      if (activeFilter === 'failed') return result.status === 'FAILED';
      return true;
    });

    return next.sort((a, b) => {
      if (sort === 'quality') return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      if (sort === 'urgency') return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
      return combinedScore(b) - combinedScore(a);
    });
  }, [activeFilter, adResults, combinedScore, sort]);

  const handleCopyAll = async () => {
    const text = filteredResults
      .filter(result => result.status === 'COMPLETED')
      .map((result, index) => `Variation ${index + 1}\n${buildFbCopy(result)}`)
      .join('\n\n----------------\n\n');

    if (text) {
      await copyToClipboard(text);
    }
  };

  if (adStatus !== 'completed' && adResults.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">No generated results yet</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Finish a V2 generation run first, then this page will show the latest creatives separately from history.
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
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium text-blue-700">Step 4 of 4</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Latest generation results</h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600 sm:text-lg">
              Review the newest run separately from saved history. Filter, sort, export, and copy the best-performing creative angles.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => exportAdBridgeCsv(filteredResults, analyzedMap)}
              disabled={filteredResults.length === 0}
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

        <section className="mb-10 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white p-1 shadow-sm">
            {[
              ['all', `All (${adResults.length})`],
              ['breaking', 'Breaking News'],
              ['top', 'Top Scored'],
              ['failed', 'Failed'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-6 ${activeFilter === key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={event => setSort(event.target.value)}
            className="h-11 min-w-[220px] appearance-none rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-800 shadow-sm outline-none ring-blue-700/20 focus:ring-4"
          >
            <option value="score">Sort by Score</option>
            <option value="quality">Highest Quality</option>
            <option value="urgency">Highest Urgency</option>
          </select>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredResults.map((card, index) => {
            const info = analyzedMap[card.campaignId] || {};
            const qualityTone = (card.qualityScore ?? 0) >= 80 ? 'excellent' : 'great';

            return (
              <article key={card.campaignId} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative border-b border-slate-200 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-400 p-6 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Variation {index + 1}</p>
                      <h2 className="mt-2 text-xl font-bold leading-tight">{card.adHeader || 'Untitled creative'}</h2>
                      <p className="mt-2 text-sm text-blue-100">
                        {info.companyName || 'Unknown company'}
                        {card.bridgeType ? ` • ${formatBridgeType(card.bridgeType)}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${qualityClasses(qualityTone)}`}>
                      {qualityTone === 'excellent' ? <Star className="h-3.5 w-3.5 fill-current" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                      Quality: {card.qualityScore ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 lg:p-8">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Urgency {card.urgencyScore ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      {info.url && (
                        <a href={info.url} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="Open source URL">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => copyToClipboard(buildFbCopy(card))} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="Quick copy">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mb-3 text-sm font-semibold leading-6 text-slate-800">{card.callToAction || 'No CTA available'}</p>
                  <p className="mb-6 flex-1 text-sm leading-6 text-slate-600">{card.adBody || 'No ad body returned for this creative.'}</p>

                  <button onClick={() => copyToClipboard(buildFbCopy(card))} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-slate-200">
                    Copy for FB
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
