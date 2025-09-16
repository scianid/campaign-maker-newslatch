import { useState, useEffect } from 'react';
import { CampaignForm } from './components/CampaignForm';
import { CampaignList } from './components/CampaignList';
import { Button } from './ui/Button';
import { Plus, Megaphone, Sparkles } from 'lucide-react';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load campaigns from localStorage on mount
  useEffect(() => {
    const savedCampaigns = localStorage.getItem('campaigns');
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    }
  }, []);

  // Save campaigns to localStorage whenever campaigns change
  useEffect(() => {
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  const handleSaveCampaign = (campaignData) => {
    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(prev => 
        prev.map(c => c.id === editingCampaign.id ? campaignData : c)
      );
    } else {
      // Add new campaign
      setCampaigns(prev => [...prev, campaignData]);
    }
    
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleDeleteCampaign = (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Campaign Maker
                </h1>
                <p className="text-sm text-gray-600">Create and manage your campaigns</p>
              </div>
            </div>
            
            {!showForm && (
              <Button 
                onClick={handleNewCampaign}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <div className="max-w-2xl mx-auto">
            <CampaignForm 
              campaign={editingCampaign}
              onSave={handleSaveCampaign}
              onCancel={handleCancelForm}
            />
          </div>
        ) : (
          <div>
            {/* Welcome Section */}
            {campaigns.length === 0 && (
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-6">
                  <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Campaign Maker!
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Create and manage your marketing campaigns with ease. 
                  Add URLs, tags, RSS feed categories, and track everything in one place.
                </p>
                <Button 
                  onClick={handleNewCampaign}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300"
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
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Built with ❤️ using React, Tailwind CSS, and modern web technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App