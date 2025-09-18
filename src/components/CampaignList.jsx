import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Edit3, Trash2, ExternalLink, Calendar, Tag, Globe, Plus, Sparkles, Loader2, AlertCircle, X, Copy, Check, Rss, Search, Zap } from 'lucide-react';
import { campaignService, supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
import { getCountryDisplayName } from '../constants/locales';
import { RssItemsModal } from '../ui/RssItemsModal';
import { LoadingModal } from '../ui/LoadingModal';

export function CampaignList({ campaigns = [], onEdit, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, campaign: null });
  const [copiedId, setCopiedId] = useState(null);
  const [rssModal, setRssModal] = useState({ show: false, data: null, campaignName: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRss, setLoadingRss] = useState(false);
  const [loadingCampaignId, setLoadingCampaignId] = useState(null);
  const navigate = useNavigate();

  // Load campaigns from Supabase on mount
  useEffect(() => {
    // Remove the loadCampaigns call since campaigns are passed as props
  }, []);

  const handleEdit = (campaign) => {
    onEdit(campaign);
  };

  const handleDeleteClick = (campaign) => {
    setDeleteConfirm({ show: true, campaign });
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(deleteConfirm.campaign.id);
      setDeleteConfirm({ show: false, campaign: null });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, campaign: null });
  };

  const navigateToAiContent = (campaign) => {
    navigate(`/content/${campaign.id}`);
  };

  const handleCopyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy ID:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Generate AI content for campaign
  const generateAiContent = async (campaignId) => {
    try {
      console.log('🤖 Generating AI content for campaign:', campaignId);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ Session error:', sessionError);
        throw new Error('No session found');
      }

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ai-generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campaignId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🤖 AI Generation Result:', result);
      
      if (result.error) {
        throw new Error(result.error || 'Failed to generate AI content');
      }

      return result;
    } catch (error) {
      console.error('💥 Failed to generate AI content:', error);
      throw error;
    }
  };

  // Generate AI content for campaign and show success message
  const showAiContentGeneration = async (campaign) => {
    try {
      console.log('🤖 Starting AI content generation for campaign:', campaign.name, campaign.id);
      
      // Show loading state
      setLoadingRss(true);
      setLoadingCampaignId(campaign.id);
      
      const result = await generateAiContent(campaign.id);
      
      // Show success message
      const itemsGenerated = result.items_generated || 0;
      
      console.log('✅ AI Content Generation completed:', result);
      
      // Navigate to the AI content page for this campaign
      navigate(`/content/${campaign.id}`);
      
    } catch (error) {
      console.error('💥 Failed to generate AI content:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`❌ Failed to generate AI content: ${errorMessage}\n\nPlease check:\n- RSS feeds are configured\n- RSS categories are set\n- Recent RSS content is available\n\nCheck the browser console for more details.`);
    } finally {
      // Hide loading state
      setLoadingRss(false);
      setLoadingCampaignId(null);
    }
  };

  // Filter campaigns based on search term
  const filteredCampaigns = (campaigns || []).filter(campaign => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      campaign.name?.toLowerCase().includes(term) ||
      campaign.description?.toLowerCase().includes(term) ||
      campaign.url?.toLowerCase().includes(term) ||
      campaign.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      campaign.rss_categories?.some(cat => cat.toLowerCase().includes(term))
    );
  });

  // Highlight matching text in search results
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading your campaigns...</p>
      </div>
    );
  }

  // Error state
  // Error state - parent component handles this now
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Error loading content</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-6">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to create your first campaign?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Start building amazing campaigns! Add URLs, organize with tags, 
          configure RSS feed categories, and track everything in one place.
        </p>
        <Button 
          onClick={() => navigate('/new')}
          size="lg"
          className="bg-button-primary hover:bg-button-primary/80 text-button-text hover:text-button-text shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 font-semibold"
          style={{ color: 'rgb(41, 41, 61)' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Campaign
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and New Button */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">
          Your Campaigns ({filteredCampaigns.length}{(campaigns?.length || 0) !== filteredCampaigns.length ? ` of ${campaigns?.length || 0}` : ''})
        </h2>
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-none sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight bg-card-bg text-white placeholder-gray-400 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* New Campaign Button */}
          <Button 
            onClick={() => navigate('/new')}
            className="bg-button-primary hover:bg-button-primary/80 text-button-text hover:text-button-text shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap font-semibold"
            style={{ color: 'rgb(41, 41, 61)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      {searchTerm && (
        <div className="text-sm text-text-paragraph">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-text-paragraph" />
              <p className="text-white">No campaigns found for "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-highlight hover:text-highlight/80 mt-2"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p>Found {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} matching "{searchTerm}"</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={cn(
              "bg-card-bg rounded-2xl border border-gray-600/50 p-6 transition-all duration-300 shadow-md shadow-black/40 hover:shadow-xl hover:shadow-black/60 hover:border-gray-500 hover:-translate-y-1",
              hoveredId === campaign.id && "shadow-lg shadow-black/50"
            )}
            onMouseEnter={() => setHoveredId(campaign.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Responsive layout - stacks on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
              {/* Campaign info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xl text-white mb-2 leading-tight">
                  {highlightText(campaign.name, searchTerm)}
                </h3>
                
                <div className="flex items-center gap-2 mb-3">
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a 
                    href={campaign.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-text-paragraph hover:text-highlight transition-colors break-words min-w-0"
                  >
                    {highlightText(campaign.url, searchTerm)}
                  </a>
                </div>
                
                {campaign.description && (
                  <p className="text-text-paragraph text-sm leading-relaxed line-clamp-3 lg:line-clamp-2">
                    {highlightText(campaign.description, searchTerm)}
                  </p>
                )}
              </div>
              
              {/* Campaign ID and Actions */}
              <div className="flex flex-col gap-3 lg:items-end">
                {/* Campaign ID - responsive layout */}
                <div className="flex items-center justify-between lg:justify-end gap-2">
                  <div className="flex items-center gap-2 text-xs text-text-paragraph">
                    <span className="hidden sm:inline">ID:</span>
                    <code className="font-mono bg-primary-bg px-1.5 py-0.5 rounded text-gray-300 text-xs break-all">
                      <span className="sm:hidden">{campaign.id.slice(0, 8)}...</span>
                      <span className="hidden sm:inline">{campaign.id}</span>
                    </code>
                    <button
                      onClick={() => handleCopyId(campaign.id)}
                      className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                      title="Copy full campaign ID"
                    >
                      {copiedId === campaign.id ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Action buttons - responsive grid */}
                <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showAiContentGeneration(campaign)}
                    disabled={loadingRss && loadingCampaignId === campaign.id}
                    className={`h-10 px-2 lg:px-3 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md text-xs lg:text-sm ${
                      loadingRss && loadingCampaignId === campaign.id 
                        ? 'bg-gray-700 text-orange-300 cursor-not-allowed' 
                        : 'bg-primary-bg text-orange-400 hover:bg-gray-700 hover:text-orange-300'
                    }`}
                    title={loadingRss && loadingCampaignId === campaign.id ? "Generating AI Content..." : "Generate AI Content"}
                  >
                    {loadingRss && loadingCampaignId === campaign.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 lg:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                        <span className="sm:hidden">Gen...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1 lg:mr-2" />
                        <span className="hidden sm:inline">Generate AI</span>
                        <span className="sm:hidden">Gen AI</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToAiContent(campaign)}
                    className="h-10 px-2 lg:px-3 bg-primary-bg text-purple-400 hover:bg-gray-700 hover:text-purple-300 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md text-xs lg:text-sm"
                    title="View AI Content"
                  >
                    <Zap className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">View AI</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(campaign)}
                    className="h-10 w-full lg:w-10 p-0 lg:p-0 bg-primary-bg text-highlight hover:bg-gray-700 hover:text-highlight/80 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex items-center justify-center"
                    title="Edit Campaign"
                  >
                    <Edit3 className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="ml-2 lg:hidden text-xs">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(campaign)}
                    className="h-10 w-full lg:w-10 p-0 lg:p-0 bg-primary-bg text-red-400 hover:bg-gray-700 hover:text-red-300 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex items-center justify-center"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="ml-2 lg:hidden text-xs">Delete</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom metadata section */}
            <div className="pt-4 mt-4 border-t border-gray-600/50 space-y-3">
              {/* Tags Row */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-text-paragraph flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {/* Show fewer tags on mobile */}
                    <div className="flex flex-wrap gap-1 sm:hidden">
                      {campaign.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs break-words">
                          {highlightText(tag, searchTerm)}
                        </Badge>
                      ))}
                      {campaign.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    {/* Show more tags on desktop */}
                    <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                      {campaign.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs break-words">
                          {highlightText(tag, searchTerm)}
                        </Badge>
                      ))}
                      {campaign.tags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.tags.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Countries and RSS Categories - responsive layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Countries Row */}
                {campaign.rss_countries && campaign.rss_countries.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {/* Mobile: show 2, Desktop: show 3 */}
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {campaign.rss_countries.slice(0, 2).map((countryCode, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-900/30 text-green-400 border-green-600">
                            {getCountryDisplayName(countryCode)}
                          </Badge>
                        ))}
                        {campaign.rss_countries.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{campaign.rss_countries.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                        {campaign.rss_countries.slice(0, 3).map((countryCode, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-900/30 text-green-400 border-green-600">
                            {getCountryDisplayName(countryCode)}
                          </Badge>
                        ))}
                        {campaign.rss_countries.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{campaign.rss_countries.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* RSS Categories Row */}
                {campaign.rss_categories && campaign.rss_categories.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Rss className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {campaign.rss_categories.includes('all') ? (
                        <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-600">
                          All Categories
                        </Badge>
                      ) : (
                        <>
                          {/* Mobile: show 2, Desktop: show 3 */}
                          <div className="flex flex-wrap gap-1 sm:hidden">
                            {campaign.rss_categories.slice(0, 2).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-600 capitalize">
                                {highlightText(category, searchTerm)}
                              </Badge>
                            ))}
                            {campaign.rss_categories.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-600">
                                +{campaign.rss_categories.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                            {campaign.rss_categories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-600 capitalize">
                                {highlightText(category, searchTerm)}
                              </Badge>
                            ))}
                            {campaign.rss_categories.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-600">
                                +{campaign.rss_categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Last Updated */}
              {campaign.updatedAt && (
                <div className="flex items-center gap-2 text-xs text-text-paragraph">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Updated {new Date(campaign.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={loadingRss}
        campaignName={campaigns.find(c => c.id === loadingCampaignId)?.name || 'Campaign'}
      />

      {/* RSS Items Modal */}
      <RssItemsModal
        isOpen={rssModal.show}
        onClose={() => setRssModal({ show: false, data: null, aiAnalysis: null, campaignName: '' })}
        rssData={rssModal.data}
        aiAnalysis={rssModal.aiAnalysis}
        campaignName={rssModal.campaignName}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the campaign:
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                "{deleteConfirm.campaign?.name}"
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDeleteCancel}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}