import { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Layout } from './Layout';
import { Button } from '../ui/Button';
import { cn } from '../utils/cn';
import { campaignService, supabase, supabaseUrl, argusAdService } from '../lib/supabase';
import { SUPPORTED_COUNTRIES } from '../constants/locales';
import {
  Upload, Link2, ChevronRight, CheckCircle2, XCircle, Clock, Loader2,
  Copy, Check, Download, Zap, TrendingUp, Target, AlertTriangle,
  ExternalLink, ChevronDown, ChevronUp, Globe, History,
} from 'lucide-react';

// ─── Pure helpers (no React) ──────────────────────────────────────────────────

function parseUrls(text) {
  const seen = new Set();
  const valid = [];
  const invalid = [];
  for (const raw of text.split(/[\n,]+/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const u = new URL(trimmed);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
      if (!seen.has(trimmed)) { seen.add(trimmed); valid.push(trimmed); }
    } catch {
      invalid.push(trimmed);
    }
  }
  return { valid, invalid };
}

function deriveCompanyName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const base = hostname.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Unknown';
  }
}

function extractCompanyName(result, url) {
  return result.companyName || deriveCompanyName(url);
}

function formatBridgeType(type) {
  if (!type) return '';
  return type
    .split('_')
    .map((word, i) => {
      if (word === 'TIER') return 'Tier';
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function bridgeTypeStyle(type) {
  if (!type) return 'bg-gray-700/40 text-gray-400 border border-gray-600/30';
  if (type.includes('TIER_1')) return 'bg-orange-500/15 text-orange-400 border border-orange-500/25';
  if (type.includes('TIER_2')) return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25';
  return 'bg-gray-600/25 text-gray-400 border border-gray-600/25';
}

function scoreStyle(score) {
  if (score == null) return 'text-gray-500 bg-gray-700/40 border border-gray-600/30';
  if (score >= 80) return 'text-green-400 bg-green-500/10 border border-green-500/20';
  if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
  return 'text-red-400 bg-red-500/10 border border-red-500/20';
}

function combinedScore(c) {
  return ((c.urgencyScore ?? 0) + (c.qualityScore ?? 0)) / 2;
}

function buildFbCopy(campaign) {
  return [campaign.adHeader, '', campaign.adBody, '', campaign.callToAction]
    .filter(s => s != null)
    .join('\n');
}

function normalizeSavedResult(r) {
  return {
    campaignId: r.campaign_id,
    status: r.status,
    adHeader: r.ad_header,
    adBody: r.ad_body,
    clickBait: r.click_bait,
    callToAction: r.call_to_action,
    adImagePrompt: r.ad_image_prompt,
    urgencyScore: r.urgency_score,
    qualityScore: r.quality_score,
    bridgeType: r.bridge_type,
    sourcesLinks: r.sources_links,
    bridgeFoundation: r.bridge_foundation,
  };
}

function exportCsv(results, analyzedMap) {
  const headers = [
    'Company', 'Source URL', 'Ad Headline', 'Ad Body', 'Hook',
    'Call to Action', 'Image Prompt', 'Urgency Score', 'Quality Score',
    'Bridge Type', 'Status',
  ];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = results.map(c => {
    const info = analyzedMap[c.campaignId] || {};
    return [
      esc(info.companyName), esc(info.url), esc(c.adHeader), esc(c.adBody),
      esc(c.clickBait), esc(c.callToAction), esc(c.adImagePrompt),
      esc(c.urgencyScore), esc(c.qualityScore), esc(c.bridgeType), esc(c.status),
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adbridge-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Stepper indicator ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Input URLs' },
  { id: 2, label: 'Analyze' },
  { id: 3, label: 'Review' },
  { id: 4, label: 'Results' },
];

function Stepper({ current }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
              current > s.id  ? 'bg-highlight text-black' :
              current === s.id ? 'bg-highlight/20 border-2 border-highlight text-highlight' :
                                 'bg-gray-800 border border-gray-700 text-gray-600',
            )}>
              {current > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span className={cn(
              'text-sm font-medium whitespace-nowrap',
              current === s.id ? 'text-white' :
              current > s.id  ? 'text-gray-400' : 'text-gray-600',
            )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px mx-3', current > s.id ? 'bg-highlight/40' : 'bg-gray-700')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdBridgePage({ user }) {
  // ── Input step state
  const [step, setStep] = useState(1);
  const [inputMode, setInputMode] = useState('paste');
  const [rawInput, setRawInput] = useState('');
  const [parsedUrls, setParsedUrls] = useState([]);
  const [invalidUrls, setInvalidUrls] = useState([]);

  // ── Analysis step state
  const [analyzedUrls, setAnalyzedUrls] = useState([]);
  // shape: { url, campaignId, status, companyName, companyDescription,
  //          productDescription, targetAudience, tags, excluded }

  // ── Generate step state
  const [targetGeo, setTargetGeo] = useState('GLOBAL');
  const [apiKey, setApiKey] = useState('');

  // ── Results step state
  const [argusProgress, setArgusProgress] = useState(null);
  const [adResults, setAdResults] = useState([]);
  const [adStatus, setAdStatus] = useState('idle'); // idle|submitting|polling|completed|failed
  const [generatingError, setGeneratingError] = useState(null);

  // ── History view state
  const [view, setView] = useState('generator'); // 'generator' | 'history'
  const [historyJobs, setHistoryJobs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedJobIds, setExpandedJobIds] = useState(new Set());
  const [jobResults, setJobResults] = useState({});
  const [jobResultsLoading, setJobResultsLoading] = useState(new Set());

  // ── Results UI state
  const [sort, setSort] = useState('best'); // best|urgency|quality
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedField, setCopiedField] = useState(null);
  const [expandedBody, setExpandedBody] = useState(new Set());
  const [expandedImagePrompt, setExpandedImagePrompt] = useState(new Set());
  const [expandedSources, setExpandedSources] = useState(new Set());

  const analysisRunning = useRef(false);
  const pollIntervalRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }, []);

  // ── URL parsing ──────────────────────────────────────────────────────────

  const handleRawInput = (value) => {
    setRawInput(value);
    const { valid, invalid } = parseUrls(value);
    setParsedUrls(valid);
    setInvalidUrls(invalid);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        // Flatten all cell values into one list — one URL per cell
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const text = rows.flat().filter(v => v && String(v).trim()).join('\n');
        handleRawInput(text);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => handleRawInput(ev.target.result);
      reader.readAsText(file);
    }
  };

  // ── Copy helper ──────────────────────────────────────────────────────────

  const copyToClipboard = useCallback(async (text, fieldId) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(prev => prev === fieldId ? null : prev), 2000);
  }, []);

  // ── Analysis loop ────────────────────────────────────────────────────────

  const pollAnalysisJob = (jobId) => new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await campaignService.checkJobStatus(jobId);
        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          resolve(data.result || {});
        } else if (data.status === 'FAILED' || attempts >= 60) {
          clearInterval(interval);
          reject(new Error(data.status === 'FAILED' ? 'Analysis failed' : 'Timed out'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 3000);
  });

  const BATCH_SIZE = 5;

  const startAnalysis = async () => {
    if (analysisRunning.current || parsedUrls.length === 0) return;
    analysisRunning.current = true;

    const initial = parsedUrls.map(url => ({
      url,
      campaignId: crypto.randomUUID(),
      status: 'pending',
      companyName: '',
      companyDescription: '',
      productDescription: '',
      targetAudience: '',
      tags: [],
      excluded: false,
    }));
    setAnalyzedUrls(initial);
    setStep(2);

    const analyzeOne = async (item, index) => {
      // Mark as analyzing
      setAnalyzedUrls(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'analyzing' };
        return next;
      });

      try {
        const jobData = await campaignService.submitAnalysisJob(item.url);
        const result = await pollAnalysisJob(jobData.jobId);

        setAnalyzedUrls(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: 'completed',
            companyName: extractCompanyName(result, item.url),
            companyDescription: result.suggestedDescription || '',
            productDescription: result.productDescription || '',
            targetAudience: result.targetAudience || '',
            tags: result.suggestedTags || [],
          };
          return next;
        });
      } catch (err) {
        console.error(`Analysis failed for ${item.url}:`, err);
        setAnalyzedUrls(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'failed' };
          return next;
        });
      }
    };

    // Process in batches of BATCH_SIZE
    for (let batchStart = 0; batchStart < initial.length; batchStart += BATCH_SIZE) {
      const batch = initial.slice(batchStart, batchStart + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((item, j) => analyzeOne(item, batchStart + j))
      );
    }

    // Refresh credit display if available
    window.refreshUserCredits?.();

    analysisRunning.current = false;
    setStep(3);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const jobs = await argusAdService.getJobs();
      setHistoryJobs(jobs);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleJobExpand = async (jobId) => {
    setExpandedJobIds(prev => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    if (!jobResults[jobId]) {
      setJobResultsLoading(prev => new Set([...prev, jobId]));
      try {
        const results = await argusAdService.getJobResults(jobId);
        setJobResults(prev => ({ ...prev, [jobId]: results }));
      } catch (err) {
        console.error('Failed to load job results:', err);
        setJobResults(prev => ({ ...prev, [jobId]: [] }));
      } finally {
        setJobResultsLoading(prev => { const n = new Set(prev); n.delete(jobId); return n; });
      }
    }
  };

  // ── Ad generation ────────────────────────────────────────────────────────

  const startGeneration = async () => {
    const toGenerate = analyzedUrls.filter(u => u.status === 'completed' && !u.excluded);
    if (toGenerate.length === 0) return;

    setAdStatus('submitting');
    setGeneratingError(null);
    setAdResults([]);
    setArgusProgress(null);
    setStep(4);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const payload = {
        targetGeo,
        campaigns: toGenerate.map(u => ({
          campaignId: u.campaignId,
          companyName: u.companyName,
          companyDescription: u.companyDescription,
          productDescription: u.productDescription,
          targetAudience: u.targetAudience,
          campaignTags: u.tags,
        })),
      };

      const res = await fetch(
        `${supabaseUrl}/functions/v1/argus-server/api/v1/ad-campaigns/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const jobData = await res.json();
      setArgusProgress(jobData.progress || null);

      // Persist job to DB (non-blocking — failure doesn't break the flow)
      let dbJobId = null;
      try {
        const dbJob = await argusAdService.saveJob({
          argus_job_id: jobData.jobId,
          target_geo: targetGeo,
          status: 'SUBMITTED',
          total_campaigns: toGenerate.length,
        });
        dbJobId = dbJob.id;
      } catch (dbErr) {
        console.error('Failed to save job to DB:', dbErr);
      }

      setAdStatus('polling');

      // Build a campaign-id → analyzed-url map for later DB persistence
      const urlMap = {};
      toGenerate.forEach(u => { urlMap[u.campaignId] = u; });

      let attempts = 0;
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const { data: { session: s } } = await supabase.auth.getSession();
          const statusRes = await fetch(
            `${supabaseUrl}/functions/v1/argus-server/api/v1/ad-campaigns/${jobData.jobId}/status`,
            { headers: { 'Authorization': `Bearer ${s.access_token}`, 'X-API-Key': apiKey } },
          );
          const statusData = await statusRes.json();

          if (statusData.progress) setArgusProgress(statusData.progress);
          if (statusData.campaigns?.length > 0) setAdResults(statusData.campaigns);

          const done =
            statusData.status === 'COMPLETED' ||
            statusData.status === 'FAILED' ||
            attempts >= 120;

          if (done) {
            clearInterval(pollIntervalRef.current);
            setAdStatus(statusData.status === 'COMPLETED' ? 'completed' : 'failed');

            if (dbJobId) {
              try {
                if (statusData.campaigns?.length > 0) {
                  await argusAdService.saveResults(dbJobId, statusData.campaigns, urlMap);
                }
                await argusAdService.updateJob(dbJobId, {
                  status: statusData.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
                  completed_campaigns: statusData.progress?.completedCampaigns ?? 0,
                  completed_at: new Date().toISOString(),
                });
              } catch (saveErr) {
                console.error('Failed to persist results:', saveErr);
              }
            }
          }
        } catch (pollErr) {
          console.error('Poll error:', pollErr);
        }
      }, 3000);
    } catch (err) {
      console.error('Generation error:', err);
      setGeneratingError(err.message);
      setAdStatus('failed');
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const analyzedMap = {};
  analyzedUrls.forEach(u => { analyzedMap[u.campaignId] = u; });

  const completedCount = analyzedUrls.filter(u => u.status === 'completed').length;
  const failedCount = analyzedUrls.filter(u => u.status === 'failed').length;
  const includedCount = analyzedUrls.filter(u => u.status === 'completed' && !u.excluded).length;

  const breakingCount = adResults.filter(c => c.bridgeType?.includes('TIER_1')).length;
  const highScoreCount = adResults.filter(c => (c.urgencyScore ?? 0) >= 80 || (c.qualityScore ?? 0) >= 80).length;
  const failedResultCount = adResults.filter(c => c.status === 'FAILED').length;

  const filteredResults = adResults
    .filter(c => {
      if (activeFilter === 'breaking') return c.bridgeType?.includes('TIER_1');
      if (activeFilter === 'highscore') return (c.urgencyScore ?? 0) >= 80 || (c.qualityScore ?? 0) >= 80;
      if (activeFilter === 'failed') return c.status === 'FAILED';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'urgency') return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
      if (sort === 'quality') return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      return combinedScore(b) - combinedScore(a);
    });

  function toggleSet(setter, id) {
    setter(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Step 1: Input ─────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-900/60 rounded-xl p-1 w-fit mb-6">
          {[
            ['paste', Link2, 'Paste URLs'],
            ['upload', Upload, 'Upload file'],
          ].map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                inputMode === mode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {inputMode === 'paste' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target URLs</label>
            <textarea
              value={rawInput}
              onChange={e => handleRawInput(e.target.value)}
              placeholder={`One URL per line, or comma-separated:\nhttps://spotonfin.com\nhttps://acmecorp.com, https://example.com`}
              rows={8}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-mono resize-y focus:outline-none focus:border-highlight/60 focus:ring-1 focus:ring-highlight/30 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload CSV, XLSX or TXT</label>
            <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-highlight/50 hover:bg-highlight/5 transition-colors">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">Click to upload</span>
              <span className="text-xs text-gray-600 mt-1">URLs separated by commas or newlines</span>
              <input type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </label>
            {rawInput && (
              <p className="mt-2 text-xs text-gray-500">File loaded — {parsedUrls.length} URL{parsedUrls.length !== 1 ? 's' : ''} found</p>
            )}
          </div>
        )}

        {/* Parsed URL preview */}
        {parsedUrls.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {parsedUrls.map(url => (
                <span key={url} className="flex items-center gap-1 bg-highlight/10 border border-highlight/20 rounded-full px-3 py-1 text-xs text-highlight">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[220px]">{url}</span>
                </span>
              ))}
            </div>

            {invalidUrls.length > 0 && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-300 mb-0.5">
                    {invalidUrls.length} invalid entr{invalidUrls.length === 1 ? 'y' : 'ies'} skipped
                  </p>
                  <p className="text-xs text-yellow-600 break-all">{invalidUrls.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Credit warning */}
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-300">
                This will use <span className="font-semibold text-blue-200">{parsedUrls.length} credit{parsedUrls.length !== 1 ? 's' : ''}</span> — 1 per URL for site analysis.
              </p>
            </div>
          </div>
        )}

        {/* Settings — Geography + API Key */}
        <div className="mt-6 pt-5 border-t border-gray-700/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              Target Geography
            </label>
            <select
              value={targetGeo}
              onChange={e => setTargetGeo(e.target.value)}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-highlight/60 focus:ring-1 focus:ring-highlight/30 transition-colors"
            >
              {[{ code: 'GLOBAL', label: 'Global (all markets)' }, ...SUPPORTED_COUNTRIES].map(o => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your AdBridge API key"
              autoComplete="off"
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-highlight/60 focus:ring-1 focus:ring-highlight/30 transition-colors"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={startAnalysis} disabled={parsedUrls.length === 0 || !apiKey.trim()}>
            Start Analysis
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Analyzing ─────────────────────────────────────────────────────

  function renderStep2() {
    const total = analyzedUrls.length;
    const done = analyzedUrls.filter(u => u.status === 'completed' || u.status === 'failed').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h2 className="text-base font-semibold text-white mb-1">Analyzing URLs</h2>
        <p className="text-sm text-gray-400 mb-6">Running AI analysis on each URL — this may take a minute or two per site.</p>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{done} / {total} analyzed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-highlight rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Per-URL rows */}
        <div className="space-y-2">
          {analyzedUrls.map(item => (
            <div
              key={item.url}
              className="flex items-center gap-3 bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700/20"
            >
              <div className="flex-shrink-0 w-5 flex justify-center">
                {item.status === 'pending'   && <Clock className="w-4 h-4 text-gray-600" />}
                {item.status === 'analyzing' && <Loader2 className="w-4 h-4 text-highlight animate-spin" />}
                {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {item.status === 'failed'    && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.url}</p>
                {item.status === 'completed' && item.companyName && (
                  <p className="text-xs text-gray-400">{item.companyName}</p>
                )}
                {item.status === 'analyzing' && (
                  <p className="text-xs text-highlight/70">Analyzing…</p>
                )}
                {item.status === 'failed' && (
                  <p className="text-xs text-red-400">Analysis failed — will be skipped</p>
                )}
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize',
                item.status === 'pending'   ? 'text-gray-500 bg-gray-700/50' :
                item.status === 'analyzing' ? 'text-highlight bg-highlight/10' :
                item.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                                              'text-red-400 bg-red-500/10',
              )}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 3: Review & Configure ────────────────────────────────────────────

  function renderStep3() {
    return (
      <div className="space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Analyzed', completedCount, 'text-green-400'],
            ['Failed',   failedCount,   'text-red-400'],
            ['Ready',    includedCount,  'text-highlight'],
          ].map(([label, count, color]) => (
            <div key={label} className="bg-gray-800/50 rounded-xl border border-gray-700/30 p-4 text-center">
              <p className={cn('text-2xl font-bold', color)}>{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Review table */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/30">
            <h2 className="text-base font-semibold text-white">Review Analysis</h2>
            <p className="text-xs text-gray-400 mt-0.5">Uncheck any URLs you want to exclude from ad generation.</p>
          </div>
          <div className="divide-y divide-gray-700/20">
            {analyzedUrls.map(item => (
              <div key={item.url} className={cn('px-6 py-4', item.excluded && 'opacity-40')}>
                <div className="flex items-start gap-3">
                  {item.status === 'completed' ? (
                    <input
                      type="checkbox"
                      checked={!item.excluded}
                      onChange={() => setAnalyzedUrls(prev =>
                        prev.map(u => u.url === item.url ? { ...u, excluded: !u.excluded } : u)
                      )}
                      className="mt-1 accent-highlight cursor-pointer flex-shrink-0"
                    />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{item.companyName || '—'}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-300 flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1.5">{item.url}</p>
                    {item.companyDescription && (
                      <p className="text-xs text-gray-400 line-clamp-2">{item.companyDescription}</p>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="text-xs bg-gray-700/60 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {item.tags.length > 5 && (
                          <span className="text-xs text-gray-500">+{item.tags.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  {item.status === 'failed' && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex-shrink-0">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={startGeneration} disabled={includedCount === 0}>
            <Zap className="w-4 h-4" />
            Generate Ads for {includedCount} URL{includedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 4: Results ───────────────────────────────────────────────────────

  function renderStep4() {
    const isPolling = adStatus === 'submitting' || adStatus === 'polling';
    const progressPct = argusProgress?.totalCampaigns > 0
      ? Math.round((argusProgress.completedCampaigns / argusProgress.totalCampaigns) * 100)
      : 0;

    return (
      <div className="space-y-5">
        {/* Live progress card (shown while running or failed) */}
        {(isPolling || (adStatus === 'failed' && !adResults.length)) && (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              {isPolling
                ? <><Loader2 className="w-5 h-5 text-highlight animate-spin" /><h2 className="text-base font-semibold text-white">Generating ads…</h2></>
                : <><XCircle className="w-5 h-5 text-red-400" /><h2 className="text-base font-semibold text-white">Generation failed</h2></>
              }
            </div>

            {argusProgress && (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>
                    {argusProgress.completedCampaigns} / {argusProgress.totalCampaigns} campaigns
                    {argusProgress.currentStep ? ` — ${argusProgress.currentStep}` : ''}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-highlight rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {argusProgress.currentStepDetail && (
                  <p className="text-xs text-gray-500">{argusProgress.currentStepDetail}</p>
                )}
              </>
            )}

            {generatingError && (
              <p className="text-sm text-red-400 mt-3">{generatingError}</p>
            )}
          </div>
        )}

        {/* Completion banner + export */}
        {adStatus === 'completed' && (
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-green-300">
                {adResults.filter(c => c.status === 'COMPLETED').length} ads generated and saved
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCsv(adResults, analyzedMap)}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        )}

        {/* Results list */}
        {adResults.length > 0 && (
          <>
            {/* Sort + filter toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort */}
              <div className="flex gap-0.5 bg-gray-800/80 border border-gray-700/50 rounded-xl p-1">
                {[
                  ['best',    TrendingUp, 'Best Match'],
                  ['urgency', Zap,        'Urgency'],
                  ['quality', Target,     'Quality'],
                ].map(([val, Icon, label]) => (
                  <button
                    key={val}
                    onClick={() => setSort(val)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      sort === val ? 'bg-highlight text-black' : 'text-gray-400 hover:text-white',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  ['all',       `All (${adResults.length})`],
                  ['breaking',  `🔥 Breaking (${breakingCount})`],
                  ['highscore', `Score 80+ (${highScoreCount})`],
                  ...(failedResultCount > 0 ? [['failed', `Failed (${failedResultCount})`]] : []),
                ].map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                      activeFilter === f
                        ? 'bg-highlight/20 border-highlight/50 text-highlight'
                        : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {adStatus === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => exportCsv(filteredResults, analyzedMap)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export filtered
                </Button>
              )}
            </div>

            {/* Cards grid */}
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredResults.map(campaign => renderResultCard(campaign))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                No results match the current filter.
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Result card ───────────────────────────────────────────────────────────

  function IconCopyBtn({ text, fieldId }) {
    const copied = copiedField === fieldId;
    return (
      <button
        onClick={() => copyToClipboard(text, fieldId)}
        className={cn(
          'flex-shrink-0 p-1 rounded transition-colors',
          copied ? 'text-green-400' : 'text-gray-600 hover:text-gray-300',
        )}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    );
  }

  function renderResultCard(campaign, infoOverride) {
    const id = campaign.campaignId;
    const info = infoOverride ?? analyzedMap[id] ?? {};
    const isBodyExpanded  = expandedBody.has(id);
    const isImageExpanded = expandedImagePrompt.has(id);
    const isSrcExpanded   = expandedSources.has(id);

    if (campaign.status === 'FAILED') {
      return (
        <div key={id} className="bg-gray-800/30 rounded-xl border border-gray-700/20 px-4 py-3 opacity-60 flex items-center gap-3">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-medium text-red-400">Failed</span>
            {info.url && <p className="text-xs text-gray-600 truncate">{info.url}</p>}
          </div>
        </div>
      );
    }

    return (
      <div key={id} className="bg-gray-800/50 rounded-xl border border-gray-700/40 hover:border-gray-600/60 transition-colors flex flex-col text-sm">

        {/* ── Meta row: company · bridge type · scores ── */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-700/20">
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="font-medium text-gray-300 text-xs truncate">{info.companyName || '—'}</span>
            {campaign.bridgeType && (
              <span className="text-gray-600 text-xs flex-shrink-0">· {formatBridgeType(campaign.bridgeType)}</span>
            )}
            {info.url && (
              <a href={info.url} target="_blank" rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-500 flex-shrink-0">
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-600">
            <span>U <span className="text-gray-400 font-medium">{campaign.urgencyScore ?? '—'}</span></span>
            <span>Q <span className="text-gray-400 font-medium">{campaign.qualityScore ?? '—'}</span></span>
          </div>
        </div>

        {/* ── Ad content ── */}
        <div className="px-4 pt-3 pb-2 space-y-2.5 flex-1">
          {/* Headline — primary content, most visual weight */}
          {campaign.adHeader && (
            <div className="flex items-start gap-1">
              <p className="flex-1 font-bold text-white text-sm leading-snug">{campaign.adHeader}</p>
              <IconCopyBtn text={campaign.adHeader} fieldId={`${id}-header`} />
            </div>
          )}

          {/* Body — secondary, quiet */}
          {campaign.adBody && (
            <div>
              <div className="flex items-start gap-1">
                <p className={cn('flex-1 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap', !isBodyExpanded && 'line-clamp-3')}>
                  {campaign.adBody}
                </p>
                <IconCopyBtn text={campaign.adBody} fieldId={`${id}-body`} />
              </div>
              {campaign.adBody.length > 160 && (
                <button
                  onClick={() => toggleSet(setExpandedBody, id)}
                  className="text-xs text-gray-700 hover:text-gray-500 mt-0.5 flex items-center gap-0.5"
                >
                  {isBodyExpanded
                    ? <><ChevronUp className="w-3 h-3" />Less</>
                    : <><ChevronDown className="w-3 h-3" />More</>}
                </button>
              )}
            </div>
          )}

          {/* Hook — plain italic, clearly just ad copy context */}
          {campaign.clickBait && (
            <p className="text-xs text-gray-600 italic leading-snug">
              "{campaign.clickBait}"
            </p>
          )}

          {/* CTA — the one accent, stands apart from content via border + weight */}
          {campaign.callToAction && (
            <div className="flex items-center gap-1.5 border-l-2 border-highlight pl-2.5">
              <p className="flex-1 text-sm font-semibold text-white leading-snug">{campaign.callToAction}</p>
              <IconCopyBtn text={campaign.callToAction} fieldId={`${id}-cta`} />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-3 pt-1 space-y-1.5">
          {/* Primary action — solid fill, only colored element */}
          <button
            onClick={() => copyToClipboard(buildFbCopy(campaign), `${id}-fb`)}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-colors',
              copiedField === `${id}-fb`
                ? 'bg-gray-700 text-green-400'
                : 'bg-button-primary text-button-text hover:opacity-90',
            )}
          >
            {copiedField === `${id}-fb`
              ? <><Check className="w-3.5 h-3.5" />Copied</>
              : <><Copy className="w-3.5 h-3.5" />Copy for FB Ads</>}
          </button>

          {/* Collapsibles — plain text links, no borders competing */}
          <div className="flex gap-3 px-1">
            {campaign.adImagePrompt && (
              <div className="flex-1">
                <button
                  onClick={() => toggleSet(setExpandedImagePrompt, id)}
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-400 transition-colors"
                >
                  {isImageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Image prompt
                </button>
                {isImageExpanded && (
                  <div className="mt-1.5 flex items-start gap-1">
                    <p className="flex-1 text-xs text-gray-500 leading-relaxed">{campaign.adImagePrompt}</p>
                    <IconCopyBtn text={campaign.adImagePrompt} fieldId={`${id}-img`} />
                  </div>
                )}
              </div>
            )}
            {campaign.sourcesLinks?.length > 0 && (
              <div className="flex-1">
                <button
                  onClick={() => toggleSet(setExpandedSources, id)}
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-400 transition-colors"
                >
                  {isSrcExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {campaign.sourcesLinks.length} source{campaign.sourcesLinks.length !== 1 ? 's' : ''}
                </button>
                {isSrcExpanded && (
                  <ul className="mt-1.5 space-y-1">
                    {campaign.sourcesLinks.map((link, i) => (
                      <li key={i}>
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 truncate">
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{link}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── History view ─────────────────────────────────────────────────

  function renderHistoryView() {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-highlight animate-spin" />
        </div>
      );
    }

    if (historyJobs.length === 0) {
      return (
        <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/30">
          <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No past generations yet</p>
          <p className="text-gray-600 text-xs mt-1">Your completed ad batches will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {historyJobs.map(job => {
          const isExpanded = expandedJobIds.has(job.id);
          const rawResults = jobResults[job.id] || [];
          const normalized = rawResults.map(normalizeSavedResult);
          const isLoadingResults = jobResultsLoading.has(job.id);

          const savedInfoMap = {};
          rawResults.forEach(r => {
            savedInfoMap[r.campaign_id] = { companyName: r.company_name, url: r.source_url };
          });
          const exportMap = {};
          normalized.forEach(r => { exportMap[r.campaignId] = savedInfoMap[r.campaignId] || {}; });

          const statusStyle =
            job.status === 'COMPLETED' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
            job.status === 'FAILED'    ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                         'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

          return (
            <div key={job.id} className="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden">
              <button
                onClick={() => toggleJobExpand(job.id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-700/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
                      {job.target_geo}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusStyle)}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {job.completed_campaigns} / {job.total_campaigns} campaign{job.total_campaigns !== 1 ? 's' : ''} completed
                  </p>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-700/30 px-6 py-5">
                  {isLoadingResults ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 text-highlight animate-spin" />
                    </div>
                  ) : normalized.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">No saved results for this job.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-gray-400">{normalized.length} ad{normalized.length !== 1 ? 's' : ''}</p>
                        <Button variant="outline" size="sm" onClick={() => exportCsv(normalized, exportMap)}>
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {normalized
                          .sort((a, b) => combinedScore(b) - combinedScore(a))
                          .map(c => renderResultCard(c, savedInfoMap[c.campaignId]))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────

  return (
    <Layout user={user}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-highlight/15 border border-highlight/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-highlight" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AdBridge</h1>
              <p className="text-xs text-gray-500">Real-time news-driven ad generation</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-3 max-w-2xl">
            Submit your affiliate URLs — we'll analyze each site and generate ad copy bridged to today's breaking news, scored for urgency and quality.
          </p>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-900/60 border border-gray-700/30 rounded-xl p-1 w-fit mt-5">
            <button
              onClick={() => setView('generator')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                view === 'generator' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              <Zap className="w-4 h-4" />
              New Generation
            </button>
            <button
              onClick={() => { setView('history'); loadHistory(); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                view === 'history' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              <History className="w-4 h-4" />
              Past Results
            </button>
          </div>
        </div>

        {view === 'history' ? renderHistoryView() : (
          <>
            <Stepper current={step} />
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </>
        )}
      </div>
    </Layout>
  );
}
