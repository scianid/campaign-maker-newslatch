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
  'health'
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
    
    // Step 2: AI Generated
    tags: [],
    description: '',
    aiSuggestions: {
      tags: [],
      description: '',
      loading: false
    },
    
    // Step 3: Manual Selection
    rssCategories: ['all'],
    rssCountries: [DEFAULT_COUNTRY]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  // Initialize form for editing
  useEffect(() => {
    if (isEdit && campaign) {
      setFormData(prev => ({
        ...prev,
        name: campaign.name || '',
        url: campaign.url || '',
        tags: campaign.tags || [],
        description: campaign.description || '',
        rssCategories: campaign.rss_categories || ['all'],
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
          newErrors.url = 'Company URL is required';
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

  // Generate AI suggestions based on URL
  const generateAISuggestions = async () => {
    if (!formData.url) return;

    setFormData(prev => ({
      ...prev,
      aiSuggestions: { ...prev.aiSuggestions, loading: true }
    }));

    try {
      console.log('🤖 Generating AI suggestions for:', formData.url);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No session found');
      }

      // TODO: Create ai-campaign-suggestions endpoint
      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ai-campaign-suggestions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            url: formData.url,
            name: formData.name 
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setFormData(prev => ({
        ...prev,
        aiSuggestions: {
          tags: result.suggested_tags || [],
          description: result.suggested_description || '',
          loading: false
        },
        description: result.suggested_description || prev.description
      }));

    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      setFormData(prev => ({
        ...prev,
        aiSuggestions: {
          tags: [],
          description: '',
          loading: false
        }
      }));
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
        description: formData.description,
        tags: formData.tags,
        rssCategories: formData.rssCategories,
        rssCountries: formData.rssCountries
      };

      if (isEdit) {
        await campaignService.updateCampaign(id, campaignData);
      } else {
        await campaignService.createCampaign(campaignData);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
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
          <Label htmlFor="name" className="text-white">Campaign Name</Label>
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

        <div>
          <Label htmlFor="url" className="text-white">Company URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => updateFormData('url', e.target.value)}
            placeholder="https://example.com"
            className={`mt-1 ${errors.url ? 'border-red-500' : ''}`}
          />
          {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
          <p className="text-text-paragraph text-sm mt-1">
            We'll analyze this URL to generate intelligent suggestions for your campaign
          </p>
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-text-paragraph">Analyzing your company and generating suggestions...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected Tags Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Selected Tags</h4>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className={`text-xs ${
                    (formData.aiSuggestions.tags || []).includes(tag)
                      ? 'bg-purple-900/30 text-purple-400 border-purple-600'
                      : 'bg-green-900/30 text-green-400 border-green-600'
                  }`}
                >
                  {(formData.aiSuggestions.tags || []).includes(tag) ? '🤖' : '✏️'} {tag}
                </Badge>
              ))}
              {formData.tags.length === 0 && (
                <p className="text-text-paragraph text-sm">No tags selected yet</p>
              )}
            </div>
            
            {errors.tags && <p className="text-red-400 text-sm mt-2">{errors.tags}</p>}
            
            <div className="mt-3">
              <p className="text-sm text-text-paragraph">
                Total selected: {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''} 
                ({formData.tags.filter(tag => (formData.aiSuggestions.tags || []).includes(tag)).length} AI suggested, 
                {formData.tags.filter(tag => !(formData.aiSuggestions.tags || []).includes(tag)).length} custom)
              </p>
            </div>
          </div>

          {/* Custom Tags Input */}
          <div>
            <Label className="text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-400" />
              Add Custom Tags
            </Label>
            <p className="text-text-paragraph text-sm mb-3">
              Add your own tags that aren't in the AI suggestions below
            </p>
            
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Enter custom tag..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addCustomTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim().toLowerCase()) || (formData.aiSuggestions.tags || []).includes(newTag.trim().toLowerCase())}
                variant="outline"
                className="px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Display custom tags (those not in AI suggestions) */}
            {formData.tags.filter(tag => !(formData.aiSuggestions.tags || []).includes(tag)).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-text-paragraph mb-2">Your custom tags:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags
                    .filter(tag => !(formData.aiSuggestions.tags || []).includes(tag))
                    .map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeCustomTag(tag)}
                          className="ml-1 hover:bg-green-700 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggested Tags */}
          <div>
            <Label className="text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Suggested Tags
            </Label>
            <p className="text-text-paragraph text-sm mb-3">
              Click to select tags that best represent the product
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(formData.aiSuggestions.tags || []).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-card-bg border-gray-600 text-gray-300 hover:border-purple-500'
                  }`}
                >
                  {formData.tags.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggested Description */}
          <div>
            <Label htmlFor="description" className="text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
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
            <Globe className="w-4 h-4 text-green-400" />
            Target Countries
          </Label>
          <MultiSelect
            options={SUPPORTED_COUNTRIES.map(country => country.code)}
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
            <Rss className="w-4 h-4 text-orange-400" />
            RSS Feed Categories
          </Label>
          <MultiSelect
            options={['all', ...RSS_CATEGORIES]}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/campaigns')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
            <div className="h-6 w-px bg-gray-600"></div>
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step < currentStep ? 'bg-purple-600 text-white' :
                  step === currentStep ? 'bg-purple-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-purple-600' : 'bg-gray-600'
                  }`} />
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
        <div className="bg-card-bg rounded-2xl border border-gray-600/50 p-8">
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-600/50">
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
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
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