import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { MultiSelect } from '../ui/MultiSelect';
import { Plus, X, Save, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { campaignService } from '../lib/supabase';
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

export function EditCampaignForm({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const campaign = location.state?.campaign;

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    impressionPixel: '',
    clickPixel: '',
    tags: [],
    description: '',
    rssCategories: [],
    rssCountries: [DEFAULT_COUNTRY]
  });

  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPixelFields, setShowPixelFields] = useState(false);

  // Initialize form with campaign data
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        url: campaign.url || '',
        impressionPixel: campaign.impression_pixel || '',
        clickPixel: campaign.click_pixel || '',
        tags: campaign.tags || [],
        description: campaign.description || '',
        rssCategories: (campaign.rss_categories || []),
        rssCountries: campaign.rss_countries || [DEFAULT_COUNTRY]
      });
    }
  }, [campaign]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    if (!formData.url.trim()) {
      newErrors.url = 'Company URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    if (formData.tags.length === 0) {
      newErrors.tags = 'Please select at least one tag';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.rssCountries.length === 0) {
      newErrors.rssCountries = 'Please select at least one country';
    }
    if (formData.rssCategories.length === 0) {
      newErrors.rssCategories = 'Please select at least one RSS category';
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const campaignData = {
        name: formData.name,
        url: formData.url,
        impression_pixel: formData.impressionPixel,
        click_pixel: formData.clickPixel,
        description: formData.description,
        tags: formData.tags,
        rssCategories: formData.rssCategories,
        rssCountries: formData.rssCountries
      };

      await campaignService.updateCampaign(id, campaignData);
      navigate('/campaigns');
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Error updating campaign. Please try again.');
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

  // Add custom tag
  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      updateFormData('tags', [...formData.tags, tag]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Handle Enter key for adding tags
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!campaign) {
    return (
      <Layout user={user}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">Campaign Not Found</h3>
            <p className="text-red-300">The campaign data could not be loaded.</p>
            <Button onClick={() => navigate('/campaigns')} variant="outline" className="mt-4">
              ← Back to Campaigns
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-2xl font-bold text-white">Edit Campaign</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card-bg rounded-2xl border border-gray-600/50 p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-gray-600/50 pb-3">
              Basic Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
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
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPixelFields(!showPixelFields)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <h3 className="text-white font-medium text-sm">Tracking Pixels (Optional)</h3>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                  showPixelFields ? 'rotate-90' : ''
                }`} />
              </button>
              
              {showPixelFields && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
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
                      <p className="text-text-paragraph text-xs mt-1">
                        Pixel URL that fires when your ad is displayed
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
                      <p className="text-text-paragraph text-xs mt-1">
                        Pixel URL that fires when your ad is clicked
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
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

          {/* Tags */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-gray-600/50 pb-3">
              Tags
            </h2>
            
            <div>
              <Label className="text-white mb-3">Campaign Tags</Label>
              
              {/* Add Tag Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.includes(newTag.trim().toLowerCase())}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-purple-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {errors.tags && <p className="text-red-400 text-sm mt-2">{errors.tags}</p>}
            </div>
          </div>

          {/* Target Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-gray-600/50 pb-3">
              Target Settings
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Target Countries */}
              <div>
                <Label className="text-white mb-3">Target Countries</Label>
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
              <Label className="text-white mb-3">RSS Feed Categories</Label>
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

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-600/50">
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Campaign
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}