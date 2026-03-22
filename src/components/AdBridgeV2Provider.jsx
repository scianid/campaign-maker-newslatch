import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { argusAdService, campaignService, supabase, supabaseUrl } from '../lib/supabase';
import {
  buildFbCopy,
  combinedScore,
  exportAdBridgeCsv,
  extractCompanyName,
  normalizeSavedResult,
  parseAdBridgeUrls,
} from '../lib/adBridgeUtils';

const AdBridgeV2Context = createContext(null);

const BATCH_SIZE = 5;

function getJobExportMap(rawResults) {
  const exportMap = {};

  rawResults.forEach(result => {
    exportMap[result.campaign_id] = {
      companyName: result.company_name,
      url: result.source_url,
    };
  });

  return exportMap;
}

export function AdBridgeV2Provider({ children }) {
  const [rawInput, setRawInput] = useState('');
  const [parsedUrls, setParsedUrls] = useState([]);
  const [invalidUrls, setInvalidUrls] = useState([]);
  const [targetGeo, setTargetGeo] = useState('GLOBAL');
  const [apiKey, setApiKey] = useState('');

  const [pipelineStage, setPipelineStage] = useState('idle');
  const [analyzedUrls, setAnalyzedUrls] = useState([]);
  const [argusProgress, setArgusProgress] = useState(null);
  const [adResults, setAdResults] = useState([]);
  const [adStatus, setAdStatus] = useState('idle');
  const [generatingError, setGeneratingError] = useState(null);

  const [historyJobs, setHistoryJobs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobResults, setJobResults] = useState({});
  const [jobResultsLoading, setJobResultsLoading] = useState(new Set());

  const [activeJobDbId, setActiveJobDbId] = useState(null);
  const [activeArgusJobId, setActiveArgusJobId] = useState(null);

  const pipelineRunningRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const activeUrlMapRef = useRef({});

  useEffect(() => () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  }, []);

  const handleRawInput = useCallback(value => {
    setRawInput(value);
    const { valid, invalid } = parseAdBridgeUrls(value);
    setParsedUrls(valid);
    setInvalidUrls(invalid);
  }, []);

  const handleFileUpload = useCallback(file => {
    if (!file) return;

    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (isXlsx) {
      import('xlsx').then(XLSX => {
        const reader = new FileReader();
        reader.onload = event => {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const text = rows.flat().filter(value => value && String(value).trim()).join('\n');
          handleRawInput(text);
        };
        reader.readAsArrayBuffer(file);
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => handleRawInput(event.target.result);
    reader.readAsText(file);
  }, [handleRawInput]);

  const copyToClipboard = useCallback(async text => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const element = document.createElement('textarea');
      element.value = text;
      document.body.appendChild(element);
      element.select();
      document.execCommand('copy');
      document.body.removeChild(element);
    }
  }, []);

  const pollAnalysisJob = useCallback(jobId => new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const data = await campaignService.checkJobStatus(jobId);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          resolve(data.result || {});
          return;
        }

        if (data.status === 'FAILED' || attempts >= 60) {
          clearInterval(interval);
          reject(new Error(data.status === 'FAILED' ? 'Analysis failed' : 'Timed out'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 3000);
  }), []);

  const startAnalysis = useCallback(() => {
    if (pipelineRunningRef.current || parsedUrls.length === 0 || !apiKey.trim()) {
      return false;
    }

    pipelineRunningRef.current = true;
    setPipelineStage('analyzing');
    setGeneratingError(null);
    setAdResults([]);
    setArgusProgress(null);
    setAdStatus('idle');
    setActiveJobDbId(null);
    setActiveArgusJobId(null);

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

    const run = async () => {
      const working = initial.map(item => ({ ...item }));

      const updateItem = (index, patch) => {
        working[index] = { ...working[index], ...patch };
        setAnalyzedUrls(prev => {
          const next = [...prev];
          next[index] = { ...next[index], ...patch };
          return next;
        });
      };

      const analyzeOne = async (item, index) => {
        updateItem(index, { status: 'analyzing' });

        try {
          const jobData = await campaignService.submitAnalysisJob(item.url);
          const result = await pollAnalysisJob(jobData.jobId);

          updateItem(index, {
            status: 'completed',
            companyName: extractCompanyName(result, item.url),
            companyDescription: result.suggestedDescription || '',
            productDescription: result.productDescription || '',
            targetAudience: result.targetAudience || '',
            tags: result.suggestedTags || [],
          });
        } catch (error) {
          console.error(`Analysis failed for ${item.url}:`, error);
          updateItem(index, { status: 'failed' });
        }
      };

      for (let batchStart = 0; batchStart < working.length; batchStart += BATCH_SIZE) {
        const batch = working.slice(batchStart, batchStart + BATCH_SIZE);
        await Promise.allSettled(
          batch.map((item, index) => analyzeOne(item, batchStart + index)),
        );
      }

      window.refreshUserCredits?.();

      const readyForReview = working.filter(item => item.status === 'completed');
      if (readyForReview.length === 0) {
        setGeneratingError('No URLs were successfully analyzed.');
        setAdStatus('failed');
        setPipelineStage('failed');
        pipelineRunningRef.current = false;
        return;
      }

      setPipelineStage('review');
      setAdStatus('idle');
      pipelineRunningRef.current = false;
    };

    run().catch(error => {
      console.error('V2 pipeline error:', error);
      setGeneratingError(error.message || 'Failed to run AdBridge pipeline');
      setAdStatus('failed');
      setPipelineStage('failed');
      pipelineRunningRef.current = false;
    });

    return true;
  }, [apiKey, parsedUrls, pollAnalysisJob, targetGeo]);

  const toggleExcluded = useCallback(campaignId => {
    setAnalyzedUrls(prev => prev.map(item => (
      item.campaignId === campaignId
        ? { ...item, excluded: !item.excluded }
        : item
    )));
  }, []);

  const startGeneration = useCallback(async () => {
    if (pipelineRunningRef.current || !apiKey.trim()) {
      return false;
    }

    const toGenerate = analyzedUrls.filter(item => item.status === 'completed' && !item.excluded);
    if (toGenerate.length === 0) {
      setGeneratingError('Select at least one analyzed URL to generate ads.');
      return false;
    }

    pipelineRunningRef.current = true;
    setPipelineStage('generating');
    setGeneratingError(null);
    setAdResults([]);
    setArgusProgress(null);
    setAdStatus('submitting');
    setActiveJobDbId(null);
    setActiveArgusJobId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const payload = {
        targetGeo,
        campaigns: toGenerate.map(item => ({
          campaignId: item.campaignId,
          companyName: item.companyName,
          companyDescription: item.companyDescription,
          productDescription: item.productDescription,
          targetAudience: item.targetAudience,
          campaignTags: item.tags,
        })),
      };

      const response = await fetch(
        `${supabaseUrl}/functions/v1/argus-server/api/v1/ad-campaigns/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const jobData = await response.json();
      setArgusProgress(jobData.progress || null);

      const urlMap = {};
      toGenerate.forEach(item => {
        urlMap[item.campaignId] = item;
      });
      activeUrlMapRef.current = urlMap;

      let dbJobId = null;
      try {
        const dbJob = await argusAdService.saveJob({
          argus_job_id: jobData.jobId,
          target_geo: targetGeo,
          status: 'SUBMITTED',
          total_campaigns: toGenerate.length,
        });
        dbJobId = dbJob.id;
      } catch (error) {
        console.error('Failed to save job to DB:', error);
      }

      setActiveJobDbId(dbJobId);
      setActiveArgusJobId(jobData.jobId);
      setAdStatus('polling');
      return true;
    } catch (error) {
      console.error('V2 generation error:', error);
      setGeneratingError(error.message || 'Failed to start generation');
      setAdStatus('failed');
      setPipelineStage('failed');
      return false;
    } finally {
      pipelineRunningRef.current = false;
    }
  }, [analyzedUrls, apiKey, targetGeo]);

  useEffect(() => {
    if (adStatus !== 'polling' || !activeArgusJobId) {
      return undefined;
    }

    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(
          `${supabaseUrl}/functions/v1/argus-server/api/v1/ad-campaigns/${activeArgusJobId}/status`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'X-API-Key': apiKey,
            },
          },
        );

        const statusData = await response.json();
        if (!response.ok) {
          throw new Error(statusData.error || `HTTP ${response.status}`);
        }

        if (statusData.progress) {
          setArgusProgress(statusData.progress);
        }

        if (statusData.campaigns?.length > 0) {
          setAdResults(statusData.campaigns);
        }

        const done =
          statusData.status === 'COMPLETED' ||
          statusData.status === 'FAILED' ||
          attempts >= 120;

        if (!done) {
          return;
        }

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        const completed = statusData.status === 'COMPLETED';
        setAdStatus(completed ? 'completed' : 'failed');
        setPipelineStage(completed ? 'completed' : 'failed');

        if (activeJobDbId) {
          try {
            if (statusData.campaigns?.length > 0) {
              await argusAdService.saveResults(activeJobDbId, statusData.campaigns, activeUrlMapRef.current);
            }

            await argusAdService.updateJob(activeJobDbId, {
              status: completed ? 'COMPLETED' : 'FAILED',
              completed_campaigns: statusData.progress?.completedCampaigns ?? 0,
              completed_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to persist results:', error);
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
        setGeneratingError(error.message || 'Failed to poll generation status');
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeArgusJobId, activeJobDbId, adStatus, apiKey]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const jobs = await argusAdService.getJobs();
      setHistoryJobs(jobs);
      return jobs;
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadJobResults = useCallback(async jobId => {
    if (!jobId) return [];

    setJobResultsLoading(prev => new Set([...prev, jobId]));
    try {
      const results = await argusAdService.getJobResults(jobId);
      setJobResults(prev => ({ ...prev, [jobId]: results }));
      return results;
    } catch (error) {
      console.error('Failed to load job results:', error);
      setJobResults(prev => ({ ...prev, [jobId]: [] }));
      return [];
    } finally {
      setJobResultsLoading(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }, []);

  const deleteHistoryJob = useCallback(async jobId => {
    if (!jobId) return false;

    try {
      await argusAdService.deleteJob(jobId);
      setHistoryJobs(prev => prev.filter(job => job.id !== jobId));
      setJobResults(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      return true;
    } catch (error) {
      console.error('Failed to delete job:', error);
      return false;
    }
  }, []);

  const latestJob = historyJobs[0] || null;
  const completedCount = analyzedUrls.filter(item => item.status === 'completed').length;
  const failedCount = analyzedUrls.filter(item => item.status === 'failed').length;
  const includedCount = analyzedUrls.filter(item => item.status === 'completed' && !item.excluded).length;

  const analyzedMap = useMemo(() => {
    const map = {};
    analyzedUrls.forEach(item => {
      map[item.campaignId] = item;
    });
    return map;
  }, [analyzedUrls]);

  const pipelineProgressPercent = useMemo(() => {
    if (argusProgress?.totalCampaigns > 0) {
      return Math.round((argusProgress.completedCampaigns / argusProgress.totalCampaigns) * 100);
    }

    if (analyzedUrls.length > 0) {
      const finished = analyzedUrls.filter(item => item.status === 'completed' || item.status === 'failed').length;
      return Math.round((finished / analyzedUrls.length) * 100);
    }

    return 0;
  }, [analyzedUrls, argusProgress]);

  const value = useMemo(() => ({
    rawInput,
    parsedUrls,
    invalidUrls,
    targetGeo,
    apiKey,
    pipelineStage,
    analyzedUrls,
    argusProgress,
    adResults,
    adStatus,
    generatingError,
    historyJobs,
    historyLoading,
    jobResults,
    jobResultsLoading,
    activeJobDbId,
    activeArgusJobId,
    latestJob,
    completedCount,
    failedCount,
    includedCount,
    analyzedMap,
    pipelineProgressPercent,
    setTargetGeo,
    setApiKey,
    handleRawInput,
    handleFileUpload,
    startAnalysis,
    startGeneration,
    toggleExcluded,
    loadHistory,
    loadJobResults,
    deleteHistoryJob,
    copyToClipboard,
    buildFbCopy,
    combinedScore,
    normalizeSavedResult,
    exportAdBridgeCsv,
    getJobExportMap,
  }), [
    activeArgusJobId,
    activeJobDbId,
    adResults,
    adStatus,
    analyzedMap,
    analyzedUrls,
    apiKey,
    argusProgress,
    copyToClipboard,
    generatingError,
    handleFileUpload,
    handleRawInput,
    historyJobs,
    historyLoading,
    jobResults,
    jobResultsLoading,
    latestJob,
    completedCount,
    failedCount,
    includedCount,
    parsedUrls,
    pipelineProgressPercent,
    pipelineStage,
    rawInput,
    startAnalysis,
    startGeneration,
    targetGeo,
    toggleExcluded,
    invalidUrls,
    loadHistory,
    loadJobResults,
    deleteHistoryJob,
  ]);

  return <AdBridgeV2Context.Provider value={value}>{children}</AdBridgeV2Context.Provider>;
}

export function useAdBridgeV2() {
  const context = useContext(AdBridgeV2Context);
  if (!context) {
    throw new Error('useAdBridgeV2 must be used within AdBridgeV2Provider');
  }

  return context;
}
