import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { MultiSelect } from '../ui/MultiSelect';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Plus, X, Save, Edit3, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Loader2, Check, Globe, Rss } from 'lucide-react';
import { campaignService, supabase } from '../lib/supabase';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '../constants/locales';
import { Layout } from './Layout';

const RSS_CATEGORIES = [
  'news',
  'entertainment', 
  'business',
  'sport',
  'politics',
  'technology',
  'health',
  'retail'
];

export function MultiStepCampaignForm({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = Boolean(id);
  const campaign = location.state?.campaign;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    url: '',
    impressionPixel: '',
    clickPixel: '',
    
    // Step 2: AI Generated
    tags: [],
    description: '',
    productDescription: '',
    targetAudience: '',
    jobId: null,
    jobStatus: null,
    currentStep: null,
    progressMessage: null,
    campaignId: null, // Track campaign ID for new campaigns
    aiSuggestions: {
      tags: [],
      description: '',
      productDescription: '',
      targetAudience: '',
      loading: false
    },
    
    // Step 3: Manual Selection
    rssCategories: [],
    rssCountries: [DEFAULT_COUNTRY]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [showPixelFields, setShowPixelFields] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (isEdit && campaign) {
      setFormData(prev => ({
        ...prev,
        name: campaign.name || '',
        url: campaign.url || '',
        impressionPixel: campaign.impression_pixel || '',
        clickPixel: campaign.click_pixel || '',
        tags: campaign.tags || [],
        description: campaign.description || '',
        productDescription: campaign.product_description || '',
        targetAudience: campaign.target_audience || '',
        rssCategories: (campaign.rss_categories || []).filter(cat => cat !== 'all'),
        rssCountries: campaign.rss_countries || [DEFAULT_COUNTRY]
      }));
      
      // Skip to step 3 for editing since we already have the data
      setCurrentStep(3);
    }
  }, [isEdit, campaign]);

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Campaign name is required';
        }
        if (!formData.url.trim()) {
          newErrors.url = 'Product Website Url is required';
        } else if (!isValidUrl(formData.url)) {
          newErrors.url = 'Please enter a valid URL';
        }
        break;
      case 2:
        if (formData.tags.length === 0) {
          newErrors.tags = 'Please select at least one tag';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        break;
      case 3:
        if (formData.rssCountries.length === 0) {
          newErrors.rssCountries = 'Please select at least one country';
        }
        if (formData.rssCategories.length === 0) {
          newErrors.rssCategories = 'Please select at least one RSS category';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const deriveCampaignNameFromUrl = (rawUrl) => {
    if (!rawUrl) return '';

    const candidate = String(rawUrl).trim();
    if (!candidate) return '';

    const tryParse = (value) => {
      try {
        return new URL(value);
      } catch {
        return null;
      }
    };

    const parsed = tryParse(candidate) ?? tryParse(`https://${candidate}`);
    if (!parsed?.hostname) return '';

    let hostname = parsed.hostname.toLowerCase();
    hostname = hostname.replace(/^www\./, '');

    const parts = hostname.split('.').filter(Boolean);
    if (parts.length === 0) return '';

    let base;
    if (parts.length <= 2) {
      base = parts[0];
    } else {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];

      // Handle common public-suffix patterns like "co.uk", "com.au".
      const commonSecondLevel = new Set(['co', 'com', 'net', 'org', 'gov', 'ac']);
      const looksLikeCountry = last.length === 2;

      if (looksLikeCountry && commonSecondLevel.has(secondLast) && parts.length >= 3) {
        base = parts[parts.length - 3];
      } else {
        base = secondLast;
      }
    }

    const sanitized = String(base)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/^-+|-+$/g, '');

    return sanitized;
  };

  // Generate AI suggestions based on URL using async job
  const generateAISuggestions = async () => {
    if (!formData.url) return;

    setFormData(prev => ({
      ...prev,
      aiSuggestions: { ...prev.aiSuggestions, loading: true }
    }));

    try {
      // Submit analysis job
      console.log('Submitting analysis job for URL:', formData.url);
      const jobData = await campaignService.submitAnalysisJob(formData.url);
      
      console.log('Job submitted:', jobData);
      
      // Refresh credits display after analyze-url call
      if (typeof window.refreshUserCredits === 'function') {
        window.refreshUserCredits();
      }
      
      setFormData(prev => ({
        ...prev,
        jobId: jobData.jobId,
        jobStatus: jobData.status
      }));

      // For new campaigns (not edit), create the campaign record immediately with job_id
      // so we can update it when the job completes
      if (!isEdit) {
        try {
          console.log('Creating campaign record with job_id...');
          const newCampaign = await campaignService.createCampaign({
            name: formData.name,
            url: formData.url,
            impression_pixel: formData.impressionPixel,
            click_pixel: formData.clickPixel,
            description: '',
            product_description: '',
            target_audience: '',
            tags: [],
            rssCategories: [],
            rssCountries: [DEFAULT_COUNTRY],
            job_id: jobData.jobId,
            job_status: jobData.status,
            job_submitted_at: new Date().toISOString()
          });
          
          console.log('✅ Campaign created with job_id:', newCampaign.id);
          
          setFormData(prev => ({
            ...prev,
            campaignId: newCampaign.id
          }));
        } catch (error) {
          console.error('Failed to create campaign record:', error);
          throw error;
        }
      }

      // Poll for job completion
      const pollInterval = 3000; // 3 seconds
      const maxAttempts = 60; // 3 minutes max
      let attempts = 0;

      const pollJobStatus = async () => {
        try {
          attempts++;
          console.log(`Polling job status (attempt ${attempts}/${maxAttempts})`);
          
          const statusData = await campaignService.checkJobStatus(jobData.jobId);
          console.log('Job status:', statusData);

          setFormData(prev => ({
            ...prev,
            jobStatus: statusData.status,
            currentStep: statusData.currentStep,
            progressMessage: statusData.progressMessage
          }));

          if (statusData.status === 'COMPLETED') {
            // Job completed successfully, extract the data
            console.log('Job completed, processing results:', statusData.result);
            
            const result = statusData.result || {};
            
            setFormData(prev => ({
              ...prev,
              aiSuggestions: {
                tags: result.suggestedTags || [],
                description: result.suggestedDescription || '',
                productDescription: result.productDescription || '',
                targetAudience: result.targetAudience || '',
                loading: false
              },
              description: result.suggestedDescription || prev.description,
              productDescription: result.productDescription || prev.productDescription,
              targetAudience: result.targetAudience || prev.targetAudience,
              jobStatus: 'COMPLETED'
            }));
            
            // Update database with completed job results and clear job_id
            const campaignIdToUpdate = isEdit ? id : formData.campaignId;
            
            if (campaignIdToUpdate) {
              try {
                await campaignService.updateCampaign(campaignIdToUpdate, {
                  job_status: 'COMPLETED',
                  job_completed_at: statusData.completedAt || new Date().toISOString(),
                  job_id: null, // Clear job_id after completion
                  product_description: result.productDescription || formData.productDescription,
                  target_audience: result.targetAudience || formData.targetAudience,
                  description: result.suggestedDescription || formData.description
                });
                console.log('✅ Campaign updated with AI results and job_id cleared');
              } catch (error) {
                console.error('Failed to update campaign with AI results:', error);
              }
            }
            
            return; // Stop polling
          } else if (statusData.status === 'FAILED') {
            // Job failed, clear job_id and update status in database
            const campaignIdToUpdate = isEdit ? id : formData.campaignId;
            
            if (campaignIdToUpdate) {
              try {
                await campaignService.updateCampaign(campaignIdToUpdate, {
                  job_status: 'FAILED',
                  job_completed_at: new Date().toISOString(),
                  job_id: null // Clear job_id after failure
                });
                console.log('⚠️ Campaign updated with FAILED status and job_id cleared');
              } catch (error) {
                console.error('Failed to update campaign after job failure:', error);
              }
            }
            
            throw new Error('Analysis job failed');
          } else if (attempts >= maxAttempts) {
            // Job timed out, clear job_id and update status
            const campaignIdToUpdate = isEdit ? id : formData.campaignId;
            
            if (campaignIdToUpdate) {
              try {
                await campaignService.updateCampaign(campaignIdToUpdate, {
                  job_status: 'FAILED',
                  job_completed_at: new Date().toISOString(),
                  job_id: null // Clear job_id after timeout
                });
                console.log('⚠️ Campaign updated with FAILED status (timeout) and job_id cleared');
              } catch (error) {
                console.error('Failed to update campaign after timeout:', error);
              }
            }
            
            throw new Error('Analysis job timed out');
          } else {
            // Continue polling
            setTimeout(pollJobStatus, pollInterval);
          }
        } catch (error) {
          console.error('Error polling job status:', error);
          setFormData(prev => ({
            ...prev,
            aiSuggestions: {
              tags: [],
              description: '',
              productDescription: '',
              targetAudience: '',
              loading: false
            }
          }));
          alert('Failed to get analysis results. You can continue manually or try again.');
        }
      };

      // Start polling
      setTimeout(pollJobStatus, pollInterval);

    } catch (error) {
      console.error('Failed to submit analysis job:', error);
      setFormData(prev => ({
        ...prev,
        aiSuggestions: {
          tags: [],
          description: '',
          productDescription: '',
          targetAudience: '',
          loading: false
        }
      }));
      alert('Failed to start analysis. You can continue manually or try again.');
    }
  };

  // Step navigation
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        // Generate AI suggestions when moving from step 1 to step 2
        generateAISuggestions();
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const campaignData = {
        name: formData.name,
        url: formData.url,
        impression_pixel: formData.impressionPixel,
        click_pixel: formData.clickPixel,
        description: formData.description,
        product_description: formData.productDescription,
        target_audience: formData.targetAudience,
        tags: formData.tags,
        rssCategories: formData.rssCategories,
        rssCountries: formData.rssCountries
      };

      if (isEdit) {
        // Update existing campaign
        await campaignService.updateCampaign(id, campaignData);
      } else if (formData.campaignId) {
        // Campaign was already created during job submission, just update it
        await campaignService.updateCampaign(formData.campaignId, campaignData);
      } else {
        // No job was run (or it failed), create new campaign
        await campaignService.createCampaign({
          ...campaignData,
          job_id: null,
          job_status: null,
          job_submitted_at: null
        });
      }

      navigate('/campaigns');
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Error saving campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update form data
  const updateFormData = (field, value) => {
    const shouldAutofillName = field === 'url' && !formData.name.trim();
    const derivedName = shouldAutofillName ? deriveCampaignNameFromUrl(value) : '';

    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'url' && !String(prev.name ?? '').trim() && derivedName) {
        next.name = derivedName;
      }

      return next;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    if (field === 'url' && derivedName && errors.name) {
      setErrors(prev => ({
        ...prev,
        name: undefined
      }));
    }
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    
    updateFormData('tags', newTags);
  };

  // Add custom tag
  const addCustomTag = () => {
    const tag = newTag.trim().toLowerCase();
    const aiTags = formData.aiSuggestions.tags || [];
    if (tag && !formData.tags.includes(tag) && !aiTags.includes(tag)) {
      updateFormData('tags', [...formData.tags, tag]);
      setNewTag('');
    }
  };

  // Remove custom tag
  const removeCustomTag = (tagToRemove) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Handle Enter key for adding tags
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign Basics</h2>
        <p className="text-text-paragraph">Let's start with the fundamental information about your campaign</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="url" className="text-white">Product Website Url</Label>
          <p className="mt-1 text-sm text-text-paragraph">
            Our AI agent will analyze this page to generate a brief about the company, the product, and the target audience.
          </p>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => updateFormData('url', e.target.value)}
            placeholder="https://example.com"
            className={`mt-1 ${errors.url ? 'border-red-500' : ''}`}
          />
          {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
        </div>

        <div>
          <Label htmlFor="name" className="text-white">Name the campaign</Label>
          <p className="mt-1 text-sm text-text-paragraph">
            This is for your internal reference. You can change it later.
          </p>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter campaign name"
            className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPixelFields(!showPixelFields)}
            className="group inline-flex items-center gap-2 text-left text-sm font-medium text-white/55 transition-colors hover:text-white/80"
          >
            Tracking pixels
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/50">
              Optional
            </span>
            <ChevronRight
              className={`h-4 w-4 text-white/45 transition-transform group-hover:text-white/65 ${
                showPixelFields ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showPixelFields && (
            <div className="mt-3 space-y-4 rounded-2xl border border-white/10 bg-primary-bg/30 p-4">
              <div>
                <Label htmlFor="impressionPixel" className="text-white">Impression Pixel URL</Label>
                <Input
                  id="impressionPixel"
                  type="url"
                  value={formData.impressionPixel}
                  onChange={(e) => updateFormData('impressionPixel', e.target.value)}
                  placeholder="https://tracking.example.com/impression?id=123"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-text-paragraph">
                  Fires when your ad is displayed.
                </p>
              </div>

              <div>
                <Label htmlFor="clickPixel" className="text-white">Click Pixel URL</Label>
                <Input
                  id="clickPixel"
                  type="url"
                  value={formData.clickPixel}
                  onChange={(e) => updateFormData('clickPixel', e.target.value)}
                  placeholder="https://tracking.example.com/click?id=123"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-text-paragraph">
                  Fires when your ad is clicked.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: AI Suggestions
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Suggestions</h2>
        <p className="text-text-paragraph">Based on your company URL, here are our intelligent recommendations</p>
      </div>

      {formData.aiSuggestions.loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-highlight" />
          <p className="text-text-paragraph mb-2">Analyzing your company and generating suggestions...</p>
          {formData.jobStatus && (
            <div className="mt-4 max-w-md mx-auto rounded-2xl border border-white/10 bg-primary-bg/30 p-4">
              <p className="text-sm text-text-paragraph mb-2">
                Status: <span className="font-semibold text-highlight">{formData.jobStatus}</span>
              </p>
              {formData.progressMessage && (
                <p className="text-sm text-white/60 mb-2">
                  {formData.progressMessage}
                </p>
              )}
              {formData.currentStep && (
                <p className="text-xs text-white/50">
                  Current Step: {formData.currentStep}
                </p>
              )}
              {formData.jobId && (
                <p className="text-xs text-white/40 mt-2 font-mono">Job ID: {formData.jobId}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tags (compact) */}
          <div className="rounded-3xl border border-white/10 bg-primary-bg/30 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-highlight" />
                  <h3 className="text-base font-semibold text-white">Tags</h3>
                </div>
                <p className="mt-1 text-sm text-text-paragraph">
                  Pick a few keywords so NewsLatch can match you to the right stories.
                </p>
              </div>
              <div className="text-sm text-white/60">
                Selected: <span className="font-semibold text-white">{formData.tags.length}</span>
              </div>
            </div>

            {errors.tags && <p className="mt-3 text-sm text-red-400">{errors.tags}</p>}

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-3">
                <p className="text-xs font-semibold text-white/60">Custom tag</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add a custom tag"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addCustomTag}
                    disabled={
                      !newTag.trim() ||
                      formData.tags.includes(newTag.trim().toLowerCase()) ||
                      (formData.aiSuggestions.tags || []).includes(newTag.trim().toLowerCase())
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-card-bg/30 p-4 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-highlight" />
                    <p className="text-xs font-semibold text-white/80">AI Suggestions</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                    {(formData.aiSuggestions.tags || []).length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/55">Click a suggestion to add.</p>

                <div className="mt-2 max-h-52 overflow-auto pr-1">
                  {(formData.aiSuggestions.tags || []).length === 0 ? (
                    <p className="text-sm text-text-paragraph">No suggestions yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(formData.aiSuggestions.tags || []).map((tag) => {
                        const selected = formData.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                              selected
                                ? 'border-highlight/70 bg-highlight/10 text-highlight'
                                : 'border-white/10 bg-white/5 text-white/75 hover:border-highlight/40 hover:bg-white/10'
                            }`}
                          >
                            {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-70" />}
                            <span className="max-w-[22ch] truncate">{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-highlight/20 bg-highlight/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-white/80">Selected</p>
                  <span className="rounded-full border border-highlight/25 bg-highlight/10 px-2 py-0.5 text-[11px] font-semibold text-highlight">
                    {formData.tags.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/55">Click a tag to remove.</p>

                <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-auto pr-1">
                  {formData.tags.length === 0 ? (
                    <p className="text-sm text-text-paragraph">No tags yet.</p>
                  ) : (
                    formData.tags.map((tag) => {
                      const isAi = (formData.aiSuggestions.tags || []).includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            isAi
                              ? 'border-highlight/45 bg-highlight/15 text-highlight hover:bg-highlight/20'
                              : 'border-white/15 bg-white/5 text-white/85 hover:bg-white/10'
                          }`}
                          title="Remove tag"
                        >
                          <span className="max-w-[18ch] truncate">{tag}</span>
                          <X className="h-3 w-3 opacity-80" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggested Description */}
          <div>
            <Label htmlFor="description" className="text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-highlight" />
              Suggested Description
            </Label>
            <p className="text-text-paragraph text-sm mb-3">
              We've generated a description based on your company. Feel free to edit it.
            </p>
            
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Campaign description..."
              rows={4}
              className={`mt-1 ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* AI Suggested Product Description */}
          <div>
            <Label htmlFor="productDescription" className="text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-highlight" />
              Suggested Product Description
            </Label>
            <p className="text-text-paragraph text-sm mb-3">
              A focused description of your product or service offering. Feel free to edit it.
            </p>
            
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => updateFormData('productDescription', e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* AI Suggested Target Audience */}
          <div>
            <Label htmlFor="targetAudience" className="text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-highlight" />
              Suggested Target Audience
            </Label>
            <p className="text-text-paragraph text-sm mb-3">
              Who your ideal customers are based on your business. This helps optimize ad targeting.
            </p>
            
            <Textarea
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => updateFormData('targetAudience', e.target.value)}
              placeholder="Target audience description..."
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Manual Configuration
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Target Settings</h2>
        <p className="text-text-paragraph">Configure your target countries and RSS feed categories</p>
      </div>

      <div className="space-y-6">
        {/* Target Countries */}
        <div>
          <Label className="text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-highlight" />
            Target Countries
          </Label>
          <MultiSelect
            options={SUPPORTED_COUNTRIES.map(country => ({ value: country.code, label: country.label }))}
            value={formData.rssCountries}
            onChange={(value) => updateFormData('rssCountries', value)}
            placeholder="Select target countries"
            className={errors.rssCountries ? 'border-red-500' : ''}
          />
          {errors.rssCountries && <p className="text-red-400 text-sm mt-1">{errors.rssCountries}</p>}
        </div>

        {/* RSS Categories */}
        <div>
          <Label className="text-white mb-3 flex items-center gap-2">
            <Rss className="w-4 h-4 text-highlight" />
            RSS Feed Categories
          </Label>
          <MultiSelect
            options={RSS_CATEGORIES}
            value={formData.rssCategories}
            onChange={(value) => updateFormData('rssCategories', value)}
            placeholder="Select RSS categories"
            className={errors.rssCategories ? 'border-red-500' : ''}
          />
          {errors.rssCategories && <p className="text-red-400 text-sm mt-1">{errors.rssCategories}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <Layout user={user}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/campaigns')}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
            <div className="h-6 w-px bg-white/10"></div>
            <h1 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed font-semibold transition-colors ${
                    step <= currentStep
                      ? 'border-highlight/70 bg-highlight/10 text-highlight'
                      : 'border-white/10 bg-white/5 text-white/50'
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5 text-highlight" /> : step}
                </div>
                
                {step < 3 && (
                  <div
                    className={`mx-2 h-[2px] w-16 rounded-full ${
                      step < currentStep ? 'bg-highlight/70' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <p className="text-text-paragraph text-sm">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card-bg/60 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-highlight/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={goToNextStep}
                disabled={formData.aiSuggestions.loading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}