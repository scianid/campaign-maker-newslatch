import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';
import { Edit3, Trash2, ExternalLink, Calendar, Tag, Globe, Plus, Sparkles, Loader2, AlertCircle, X, Copy, Check, Rss, Search, Eye, Bell } from 'lucide-react';
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
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });
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
      setToast({
        isOpen: true,
        message: 'Error deleting campaign. Please try again.',
        type: 'error'
      });
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
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

      const result = await response.json();

      if (!response.ok) {
        // Extract error message from response
        const errorMsg = result.message || result.error || 'Failed to generate AI content';
        throw new Error(errorMsg);
      }
      
      if (result.error) {
        throw new Error(result.error || 'Failed to generate AI content');
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Generate AI content for campaign and show success message
  const showAiContentGeneration = async (campaign) => {
    try {
      
      // Show loading state
      setLoadingRss(true);
      setLoadingCampaignId(campaign.id);
      
      const result = await generateAiContent(campaign.id);
      
      // Refresh credits display
      if (typeof window.refreshUserCredits === 'function') {
        window.refreshUserCredits();
      }
      
      // Show success message
      const itemsGenerated = result.items_generated || 0;
      
      // Navigate to the AI content page for this campaign
      navigate(`/content/${campaign.id}`);
      
      } catch (error) {      // Show user-friendly error message
      const errorMessage = handleEdgeFunctionError(error, 'Failed to generate AI content');
      alert(`${errorMessage}\n\nPlease check:\n- RSS feeds are configured\n- RSS categories are set\n- Recent RSS content is available`);
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

  // Handle updates toggle
  const handleUpdateToggle = async (campaign, newValue) => {
    try {
      await campaignService.updateCampaign(campaign.id, {
        ...campaign,
        get_updates: newValue,
        rssCategories: campaign.rss_categories,
        rssCountries: campaign.rss_countries
      });
      // Update the local state if needed - parent component should handle refresh
      window.location.reload();
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update notification settings. Please try again.');
    }
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

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and New Button */}
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Your Campaigns
          </h2>
          {/* Campaign count - only show on larger screens */}
          <div className="hidden sm:block">
            <span className="text-sm text-text-paragraph">
              ({filteredCampaigns.length}{(campaigns?.length || 0) !== filteredCampaigns.length ? ` of ${campaigns?.length || 0}` : ''})
            </span>
          </div>
        </div>
        
        {/* Search and Actions Row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-11 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent bg-white/5 text-white placeholder-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.25)] text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* New Campaign Button */}
          <Button 
            onClick={() => navigate('/new')}
            size="sm"
            className="shadow-[0_14px_36px_rgba(0,230,208,0.15)] hover:shadow-[0_18px_46px_rgba(0,230,208,0.22)] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
        
        {/* Mobile campaign count */}
        <div className="sm:hidden">
          <span className="text-xs text-text-paragraph">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}{(campaigns?.length || 0) !== filteredCampaigns.length ? ` of ${campaigns?.length || 0} total` : ''}
          </span>
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
              "relative rounded-3xl border border-white/10 bg-card-bg/60 p-6 transition-all duration-300 shadow-[0_18px_44px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_26px_64px_rgba(0,0,0,0.55)]",
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
                    <code className="font-mono bg-primary-bg/50 border border-white/10 px-2 py-0.5 rounded-lg text-white/70 text-xs break-all">
                      <span className="sm:hidden">{campaign.id.slice(0, 8)}...</span>
                      <span className="hidden sm:inline">{campaign.id}</span>
                    </code>
                    <button
                      onClick={() => handleCopyId(campaign.id)}
                      className="p-1.5 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                      title="Copy full campaign ID"
                    >
                      {copiedId === campaign.id ? (
                        <Check className="w-3.5 h-3.5 text-highlight" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/45 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Action buttons - responsive grid */}
                <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                  <Button
                    variant="dashed"
                    size="sm"
                    onClick={() => showAiContentGeneration(campaign)}
                    disabled={loadingRss && loadingCampaignId === campaign.id}
                    className={cn(
                      'w-full lg:w-auto justify-center',
                      loadingRss && loadingCampaignId === campaign.id && 'opacity-70'
                    )}
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
                        <span className="hidden sm:inline">Generate Ads</span>
                        <span className="sm:hidden">Gen AI</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToAiContent(campaign)}
                    className="w-full lg:w-auto justify-center"
                    title="View AI Content"
                  >
                    <Eye className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">View Ads</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(campaign)}
                    className="w-full lg:w-9 px-0 justify-center border-highlight/25 bg-highlight/5 text-highlight hover:border-highlight/45 hover:bg-highlight/10"
                    title="Edit Campaign"
                    aria-label="Edit Campaign"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(campaign)}
                    className="w-full lg:w-9 px-0 justify-center border-red-400/25 bg-red-500/5 text-red-300 hover:border-red-400/45 hover:bg-red-500/10"
                    title="Delete Campaign"
                    aria-label="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom metadata section */}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              {/* Tags Row */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-text-paragraph flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {/* Show fewer tags on mobile */}
                    <div className="flex flex-wrap gap-1 sm:hidden">
                      {campaign.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs break-words border-white/10 bg-white/5 text-white/75">
                          {highlightText(tag, searchTerm)}
                        </Badge>
                      ))}
                      {campaign.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
                          +{campaign.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    {/* Show more tags on desktop */}
                    <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                      {campaign.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs break-words border-white/10 bg-white/5 text-white/75">
                          {highlightText(tag, searchTerm)}
                        </Badge>
                      ))}
                      {campaign.tags.length > 5 && (
                        <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
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
                    <Globe className="w-4 h-4 text-highlight/70 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {/* Mobile: show 2, Desktop: show 3 */}
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {campaign.rss_countries.slice(0, 2).map((countryCode, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-white/10 bg-white/5 text-white/75">
                            {getCountryDisplayName(countryCode)}
                          </Badge>
                        ))}
                        {campaign.rss_countries.length > 2 && (
                          <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
                            +{campaign.rss_countries.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                        {campaign.rss_countries.slice(0, 3).map((countryCode, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-white/10 bg-white/5 text-white/75">
                            {getCountryDisplayName(countryCode)}
                          </Badge>
                        ))}
                        {campaign.rss_countries.length > 3 && (
                          <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
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
                    <Rss className="w-4 h-4 text-highlight/70 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {campaign.rss_categories.includes('all') ? (
                        <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/75">
                          All Categories
                        </Badge>
                      ) : (
                        <>
                          {/* Mobile: show 2, Desktop: show 3 */}
                          <div className="flex flex-wrap gap-1 sm:hidden">
                            {campaign.rss_categories.slice(0, 2).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-white/10 bg-white/5 text-white/75 capitalize">
                                {highlightText(category, searchTerm)}
                              </Badge>
                            ))}
                            {campaign.rss_categories.length > 2 && (
                              <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
                                +{campaign.rss_categories.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
                            {campaign.rss_categories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-white/10 bg-white/5 text-white/75 capitalize">
                                {highlightText(category, searchTerm)}
                              </Badge>
                            ))}
                            {campaign.rss_categories.length > 3 && (
                              <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/70">
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

              {/* Updates Notification Toggle */}
              <div className="flex items-center justify-between p-4 bg-primary-bg/30 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-highlight/70 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-white font-medium">Content Updates</span>
                    {campaign.get_updates && campaign.updates_hour !== undefined && (
                      <span className="text-xs text-text-paragraph ml-2">@ {campaign.updates_hour.toString().padStart(2, '0')}:00 UTC</span>
                    )}
                  </div>
                </div>
                <Toggle
                  checked={campaign.get_updates || false}
                  onChange={(value) => handleUpdateToggle(campaign, value)}
                  size="md"
                />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete campaign"
        message={`Are you sure you want to delete "${deleteConfirm.campaign?.name ?? 'this campaign'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Toast Notifications */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}