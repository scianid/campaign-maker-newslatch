import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Edit3, Trash2, ExternalLink, Calendar, Tag, Globe, Plus, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { campaignService } from '../lib/supabase';
import { cn } from '../utils/cn';

export function CampaignList({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, campaign: null });
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Your Campaigns ({campaigns.length})
        </h2>
        <Button 
          onClick={() => navigate('/new')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200",
              hoveredId === campaign.id && "transform -translate-y-1"
            )}
            onMouseEnter={() => setHoveredId(campaign.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-lg">
                  {campaign.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a 
                    href={campaign.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate transition-colors"
                  >
                    {campaign.url}
                  </a>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(campaign)}
                  className="h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600 text-blue-500 hover:scale-105 transition-all duration-200 rounded-lg"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(campaign)}
                  className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 text-red-500 hover:scale-105 transition-all duration-200 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {campaign.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {campaign.description}
              </p>
            )}

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
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

            {/* RSS Categories */}
            {campaign.rssCategories && campaign.rssCategories.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  RSS Categories
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.rssCategories.includes('all') ? (
                    <Badge className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      All Categories
                    </Badge>
                  ) : (
                    <>
                      {campaign.rssCategories.slice(0, 2).map((category, index) => (
                        <Badge key={index} className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          {category}
                        </Badge>
                      ))}
                      {campaign.rssCategories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.rssCategories.length - 2} more
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