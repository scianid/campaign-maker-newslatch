import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignList } from './CampaignList';
import { Layout } from './Layout';
import { Button } from '../ui/Button';
import { Plus, AlertCircle } from 'lucide-react';
import { campaignService } from '../lib/supabase';

export function CampaignDashboard({ user }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
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

        {/* List View */}
        {!loading && !error && (
          <div>
            {/* Welcome Section for Empty State */}
            {campaigns.length === 0 && (
              <div className="mb-12">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card-bg/60 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-10">
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-highlight/12 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

                  <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                      No campaigns yet
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-text-paragraph">
                      Create your first campaign to ride trending social and news waves!
                    </p>

                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Button onClick={() => navigate('/new')} variant="dashed" size="lg">
                        <Plus className="h-4 w-4" />
                        Create campaign
                      </Button>
                      <Button onClick={loadCampaigns} variant="outline" size="lg">
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
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