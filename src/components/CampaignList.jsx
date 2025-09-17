import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Edit3, Trash2, ExternalLink, Calendar, Tag, Globe, Plus, Sparkles, Loader2, AlertCircle, X, Copy, Check, TestTube, Rss, Search } from 'lucide-react';
import { campaignService, supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
import { getCountryDisplayName } from '../constants/locales';
import { RssItemsModal } from '../ui/RssItemsModal';

export function CampaignList({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, campaign: null });
  const [copiedId, setCopiedId] = useState(null);
  const [rssModal, setRssModal] = useState({ show: false, data: null, campaignName: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Load campaigns from Supabase on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (campaign) => {
    navigate(`/edit/${campaign.id}`, { state: { campaign } });
  };

  const handleDeleteClick = (campaign) => {
    setDeleteConfirm({ show: true, campaign });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.campaign) return;
    
    try {
      await campaignService.deleteCampaign(deleteConfirm.campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== deleteConfirm.campaign.id));
      setDeleteConfirm({ show: false, campaign: null });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, campaign: null });
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

  // Test RSS feeds for campaign
  const testRssFeeds = async (campaign) => {
    try {
      console.log('🧪 Testing RSS feeds for campaign:', campaign.name, campaign.id);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ No session found:', sessionError);
        return;
      }

      console.log('🔑 Making request with session token...');
      
      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/rss-feeds?campaignId=${campaign.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      console.log('📡 RSS Feeds Test Result:');
      console.log('📊 Status:', response.status);
      console.log('✅ Success:', result.success);
      console.log('🎯 Campaign Info:', result.campaign);
      console.log('📈 RSS Feeds Count:', result.count);
      console.log('📋 RSS Feeds:', result.data);
      
      if (result.error) {
        console.error('❌ Error:', result.error);
        console.error('🔍 Details:', result.details);
      }
      
    } catch (error) {
      console.error('💥 Failed to test RSS feeds:', error);
    }
  };

  // Fetch RSS content for campaign and return it
  const fetchRssContent = async (campaignId) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/rss-feeds?campaignId=${campaignId}&action=content`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch RSS content');
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch RSS content:', error);
      throw error;
    }
  };

  // Show RSS content for campaign in modal
  const showRssContent = async (campaign) => {
    try {
      console.log('📰 Fetching RSS content for campaign:', campaign.name, campaign.id);
      
      // Show loading state (you could add a loading modal here)
      const result = await fetchRssContent(campaign.id);
      
      // Show the RSS items in a modal
      setRssModal({
        show: true,
        data: result,
        campaignName: campaign.name
      });
      
      // Also log to console for debugging
      console.log('📰 RSS Content Result:', result);
      
    } catch (error) {
      console.error('💥 Failed to fetch RSS content:', error);
      alert('Failed to fetch RSS content. Please try again.');
    }
  };

  // Test RSS content for campaign (console logging)
  const testRssContent = async (campaign) => {
    try {
      console.log('� Testing RSS content for campaign:', campaign.name, campaign.id);
      
      const result = await fetchRssContent(campaign.id);
      
      console.log('📰 RSS Content Test Result:');
      console.log('✅ Success:', result.success);
      console.log('🎯 Campaign Info:', result.campaign);
      console.log('📈 Content Items Count:', result.count);
      console.log('📋 Latest 30 Items:', result.items);
      
      if (result.items && result.items.length > 0) {
        console.log('🔍 Sample Item Structure:');
        console.log('Title:', result.items[0].title);
        console.log('Link:', result.items[0].link);
        console.log('Description:', result.items[0].description?.substring(0, 100) + '...');
        console.log('Published:', result.items[0].pubDate);
        console.log('Source:', result.items[0].source);
        console.log('Categories:', result.items[0].categories);
      }
      
    } catch (error) {
      console.error('💥 Failed to test RSS content:', error);
    }
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign => {
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
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Error loading campaigns</h3>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={loadCampaigns}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300"
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Your Campaigns ({filteredCampaigns.length}{campaigns.length !== filteredCampaigns.length ? ` of ${campaigns.length}` : ''})
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* New Campaign Button */}
          <Button 
            onClick={() => navigate('/new')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No campaigns found for "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 mt-2"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p>Found {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} matching "{searchTerm}"</p>
          )}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 shadow-md shadow-gray-300/40 hover:shadow-xl hover:shadow-gray-400/50 hover:border-gray-300 hover:-translate-y-1",
              hoveredId === campaign.id && "shadow-lg shadow-gray-400/40"
            )}
            onMouseEnter={() => setHoveredId(campaign.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Header */}
            <div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate mb-3">
                    {highlightText(campaign.name, searchTerm)}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a 
                      href={campaign.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-blue-600 truncate transition-colors max-w-[200px]"
                    >
                      {highlightText(campaign.url.replace(/^https?:\/\//, '').split('/')[0], searchTerm)}
                    </a>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testRssFeeds(campaign)}
                    className="h-10 w-10 p-0 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                    title="Test RSS Feeds (check console)"
                  >
                    <TestTube className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showRssContent(campaign)}
                    className="h-10 w-10 p-0 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                    title="View RSS Content"
                  >
                    <Rss className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(campaign)}
                    className="h-10 w-10 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(campaign)}
                    className="h-10 w-10 p-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Campaign ID - Full Width */}
              <div className="flex items-center gap-2 mb-4 w-full">
                <span className="text-xs text-gray-400">ID:</span>
                <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                  {campaign.id}
                </code>
                <button
                  onClick={() => handleCopyId(campaign.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
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

            {/* Description */}
            {campaign.description && (
              <div className="mb-5">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {highlightText(campaign.description, searchTerm)}
                </p>
              </div>
            )}

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {highlightText(tag, searchTerm)}
                    </Badge>
                  ))}
                  {campaign.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{campaign.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Countries */}
            {campaign.rss_countries && campaign.rss_countries.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Target Countries</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.rss_countries.map((countryCode, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 font-medium px-3 py-1">
                      {getCountryDisplayName(countryCode)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* RSS Categories */}
            {campaign.rss_categories && campaign.rss_categories.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">RSS Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.rss_categories.includes('all') ? (
                    <Badge className="text-xs bg-blue-600 text-white">
                      All Categories
                    </Badge>
                  ) : (
                    <>
                      {campaign.rss_categories.slice(0, 2).map((category, index) => (
                        <Badge key={index} className="text-xs bg-blue-600 text-white">
                          {highlightText(category, searchTerm)}
                        </Badge>
                      ))}
                      {campaign.rss_categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.rss_categories.length - 2} more
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            {campaign.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-100">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RSS Items Modal */}
      <RssItemsModal
        isOpen={rssModal.show}
        onClose={() => setRssModal({ show: false, data: null, campaignName: '' })}
        rssData={rssModal.data}
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
                Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}