import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignForm } from './CampaignForm';
import { CampaignList } from './CampaignList';
import { Layout } from './Layout';
import { Button } from '../ui/Button';
import { Plus, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { campaignService } from '../lib/supabase';

export function CampaignDashboard({ user }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleSaveCampaign = async (campaignData) => {
    try {
      if (editingCampaign) {
        // Update existing campaign
        const updatedCampaign = await campaignService.updateCampaign(editingCampaign.id, campaignData);
        setCampaigns(prev => 
          prev.map(c => c.id === editingCampaign.id ? updatedCampaign : c)
        );
      } else {
        // Create new campaign
        const newCampaign = await campaignService.createCampaign(campaignData);
        setCampaigns(prev => [newCampaign, ...prev]);
      }
      
      setShowForm(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Error saving campaign. Please try again.');
    }
  };

  const handleEditCampaign = (campaign) => {
    navigate(`/edit/${campaign.id}`, { state: { campaign } });
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await campaignService.deleteCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign. Please try again.');
    }
  };

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  return (
    <Layout 
      user={user}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-gray-600 border-t-highlight rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading your campaigns...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-medium text-red-400">Error loading campaigns</h3>
                <p className="text-red-300">{error}</p>
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
        )}

        {/* Form View */}
        {showForm && !loading && (
          <div className="max-w-2xl mx-auto">
            <CampaignForm 
              campaign={editingCampaign}
              onSave={handleSaveCampaign}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* List View */}
        {!showForm && !loading && !error && (
          <div>
            {/* Welcome Section for Empty State */}
            {campaigns.length === 0 && (
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-card-bg border border-gray-600/50 rounded-3xl mb-6">
                  <Sparkles className="w-10 h-10 text-highlight" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to create your first campaign?
                </h2>
                <p className="text-lg text-text-paragraph mb-8 max-w-2xl mx-auto">
                  Start building amazing campaigns! Add URLs, organize with tags, 
                  configure RSS feed categories, and track everything in one place.
                </p>
                <Button 
                  onClick={handleNewCampaign}
                  size="lg"
                  className="bg-gradient-to-r from-highlight to-purple-600 hover:from-highlight/90 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            )}

            {/* Campaigns List */}
            <CampaignList 
              campaigns={campaigns}
              onEdit={handleEditCampaign}
              onDelete={handleDeleteCampaign}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}