import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, TrendingUp, Zap, Eye, EyeOff, Copy, Check, ArrowLeft, ChevronLeft, ChevronRight, Filter, SortDesc, Star, Clock, RefreshCw, Monitor, Smartphone, ChevronDown, ChevronUp, Trash2, X, FileText, Clipboard, ImagePlus, Images, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Label } from '../ui/Label';
import { Layout } from './Layout';
import { supabase } from '../lib/supabase';
import { VariantGeneratorModal } from './VariantGeneratorModal';
import { VariantCarousel } from './VariantCarousel';
import { VariantImageSelector } from './VariantImageSelector';

export function AiContentPage({ user }) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [aiItems, setAiItems] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showUnpublished, setShowUnpublished] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [previewStyles, setPreviewStyles] = useState({}); // Track preview style for each item
  const [expandedDetails, setExpandedDetails] = useState({}); // Track which cards have details expanded
  const [expandedReasons, setExpandedReasons] = useState({}); // Track which cards have AI reasoning expanded
  const [copiedFields, setCopiedFields] = useState({}); // Track which fields have been copied
  const [showEnglishTranslation, setShowEnglishTranslation] = useState({}); // Track translation toggle for each item
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [activeTab, setActiveTab] = useState({}); // Track active tab (preview/variants) for each item
  const [generatingLandingPage, setGeneratingLandingPage] = useState({}); // Track which items are generating landing pages
  const [generatingImage, setGeneratingImage] = useState({}); // Track which items are generating AI images
  const [imagePromptModal, setImagePromptModal] = useState({ show: false, item: null, prompt: '' });
  const [imageGalleryModal, setImageGalleryModal] = useState({ show: false, item: null, images: [] });
  const [deletingImage, setDeletingImage] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'published', 'unpublished'
    scoreRange: 'all', // 'all', 'high', 'medium', 'low'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    sortBy: 'created_at', // 'created_at', 'relevance_score', 'trend'
    sortOrder: 'desc' // 'desc', 'asc'
  });
  
  // Variant-related state
  const [variantGeneratorModal, setVariantGeneratorModal] = useState({ show: false, item: null });
  const [variantImageModal, setVariantImageModal] = useState({ show: false, item: null, variant: null });
  const itemsPerPage = 10;

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchAiItems();
    }
  }, [campaignId, currentPage, filters]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Campaign not found');
    }
  };

  const fetchAiItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No session found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        campaignId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: filters.status,
        scoreRange: filters.scoreRange,
        dateRange: filters.dateRange,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ai-content?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setAiItems(result.ai_items || []);
      setTotalItems(result.total || 0);
    } catch (err) {
      console.error('Failed to fetch AI items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (itemId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('ai_generated_items')
        .update({ is_published: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setAiItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_published: !currentStatus } : item
      ));
    } catch (err) {
      console.error('Failed to update publish status:', err);
      alert('Failed to update publish status');
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirm({ show: true, item });
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('ai_generated_items')
        .delete()
        .eq('id', deleteConfirm.item.id);

      if (error) throw error;

      // Update local state
      setAiItems(prev => prev.filter(item => item.id !== deleteConfirm.item.id));
      setTotalItems(prev => prev - 1);
      setDeleteConfirm({ show: false, item: null });
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, item: null });
  };

  const generateLandingPage = async (aiItem) => {
    try {
      setGeneratingLandingPage(prev => ({ ...prev, [aiItem.id]: true }));

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-landing-page',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ai_item_id: aiItem.id
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate landing page');
      }
      
      // Navigate to edit page
      navigate(`/pages/edit/${result.landing_page.id}`);

    } catch (err) {
      console.error('❌ Failed to generate landing page:', err);
      
      let errorMessage = 'Unknown error occurred';
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Failed to generate landing page: ${errorMessage}`);
    } finally {
      setGeneratingLandingPage(prev => ({ ...prev, [aiItem.id]: false }));
    }
  };

  const showImageGallery = async (item) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch all images from storage for this campaign/content
      const folderPath = `${campaignId}/${item.id}`;
      
      const { data: files, error } = await supabase
        .storage
        .from('public-files')
        .list(folderPath);
      
      if (error) {
        console.error('Error fetching images:', error);
      }
      
      // Build full URLs for the images
      const generatedImages = files?.map(file => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('public-files')
          .getPublicUrl(`${folderPath}/${file.name}`);
        return {
          url: publicUrl,
          name: file.name,
          type: 'generated',
          path: `${folderPath}/${file.name}`
        };
      }) || [];
      
      // Build list of all images
      const allImages = [];
      
      // Always add the original news article image first if it exists
      if (item.original_image_url) {
        allImages.push({
          url: item.original_image_url,
          name: 'Original News Article',
          type: 'news',
          path: null,
          isCurrent: item.image_url === item.original_image_url
        });
      }
      
      // Add all generated images from storage
      generatedImages.forEach(img => {
        allImages.push({
          ...img,
          isCurrent: img.url === item.image_url
        });
      });
      
      setImageGalleryModal({ show: true, item, images: allImages });
    } catch (err) {
      console.error('Error loading image gallery:', err);
      alert('Failed to load images');
    }
  };

  const selectImage = async (item, imageUrl) => {
    try {
      const { error } = await supabase
        .from('ai_generated_items')
        .update({ image_url: imageUrl })
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Update local state
      setAiItems(prevItems => prevItems.map(i => 
        i.id === item.id ? { ...i, image_url: imageUrl } : i
      ));
      
      // Update the gallery modal's item and images
      const updatedImages = imageGalleryModal.images.map(img => ({
        ...img,
        isCurrent: img.url === imageUrl
      }));
      
      setImageGalleryModal(prev => ({ 
        ...prev, 
        item: { ...prev.item, image_url: imageUrl },
        images: updatedImages 
      }));
      
      console.log('✅ Image selected successfully');
    } catch (err) {
      console.error('❌ Failed to select image:', err);
      alert('Failed to select image: ' + err.message);
    }
  };

  const deleteImage = async (item, image) => {
    if (image.type === 'news') {
      alert('Cannot delete the original news image');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      setDeletingImage(image.url);
      
      // Delete from storage
      const { error } = await supabase
        .storage
        .from('public-files')
        .remove([image.path]);
      
      if (error) throw error;
      
      // If this was the current image, clear it
      if (image.isCurrent) {
        await supabase
          .from('ai_generated_items')
          .update({ image_url: null })
          .eq('id', item.id);
        
        setAiItems(prevItems => prevItems.map(i => 
          i.id === item.id ? { ...i, image_url: null } : i
        ));
      }
      
      // Update the gallery modal
      const updatedImages = imageGalleryModal.images.filter(img => img.url !== image.url);
      setImageGalleryModal(prev => ({ ...prev, images: updatedImages }));
      
      console.log('✅ Image deleted successfully');
    } catch (err) {
      console.error('❌ Failed to delete image:', err);
      alert('Failed to delete image: ' + err.message);
    } finally {
      setDeletingImage(null);
    }
  };

  const showImagePromptModal = (item) => {
    if (!item.image_prompt) {
      alert('No image prompt available. Please regenerate the content to include image prompts.');
      return;
    }
    setImagePromptModal({ show: true, item: item, prompt: item.image_prompt });
  };

  const generateAIImage = async (item) => {
    try {
      // Close the modal
      setImagePromptModal({ show: false, item: null, prompt: '' });
      
      setGeneratingImage(prev => ({ ...prev, [item.id]: true }));

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-content-image',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content_id: item.id
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }
      
      // Update the local state with the new image URL
      setAiItems(prevItems => prevItems.map(i => 
        i.id === item.id ? { ...i, image_url: result.image_url } : i
      ));

      console.log('✅ Image generated successfully:', result.image_url);

    } catch (err) {
      console.error('❌ Failed to generate AI image:', err);
      
      let errorMessage = 'Unknown error occurred';
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Failed to generate AI image: ${errorMessage}`);
    } finally {
      setGeneratingImage(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const copyToClipboard = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleDetails = (itemId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleReason = (itemId) => {
    setExpandedReasons(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Variant-related functions
  const handleGenerateVariants = (aiItem) => {
    setVariantGeneratorModal({ show: true, item: aiItem });
  };

  const handleVariantsGenerated = (newVariants) => {
    // Refresh the AI items to get updated variant counts
    fetchAiItems();
  };

  const handleVariantUpdate = () => {
    // Refresh the AI items to get updated variant counts
    fetchAiItems();
  };

  const handleVariantDelete = () => {
    // Refresh the AI items to get updated variant counts
    fetchAiItems();
  };

  const handleVariantImageGallery = (aiItem, variant) => {
    setVariantImageModal({ show: true, item: aiItem, variant });
  };

  const handleVariantImageSelected = (imageUrl) => {
    // The variant carousel will handle the update
    fetchAiItems();
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading && currentPage === 1) {
    return (
      <Layout user={user}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-600 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-card-bg rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading AI Content</h3>
            <p className="text-red-300">{error}</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={() => navigate('/campaigns')} variant="outline">
                ← Back to Campaigns
              </Button>
              <Button onClick={fetchAiItems} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user}
      headerActions={
        <Button onClick={fetchAiItems} variant="ghost" size="sm" className="hidden md:flex text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/campaigns')}
              className="text-gray-400 hover:text-white flex-shrink-0 h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Campaigns</span>
              <span className="sm:hidden">Back to Campaigns</span>
            </Button>
            <div className="h-6 w-px bg-gray-600 hidden sm:block"></div>
            
          </div>
        </div>

        {/* Advanced Filters - Compact */}
        <div className="bg-card-bg border border-gray-600/50 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All</option>
                <option value="published">📢 Published</option>
                <option value="unpublished">📝 Draft</option>
              </select>
            </div>

            {/* Score Range Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Score</label>
              <select
                value={filters.scoreRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, scoreRange: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All</option>
                <option value="high">⭐ High</option>
                <option value="medium">🔶 Medium</option>
                <option value="low">📊 Low</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <select
                value={filters.dateRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, dateRange: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All Time</option>
                <option value="today">🕐 Today</option>
                <option value="week">📅 Week</option>
                <option value="month">📆 Month</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort</label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortBy: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-highlight focus:border-highlight"
              >
                <option value="created_at">🕒 Date</option>
                <option value="relevance_score">⭐ Score</option>
                <option value="trend">📈 Trend</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortOrder: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-highlight focus:border-highlight"
              >
                <option value="desc">↓ New</option>
                <option value="asc">↑ Old</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary - Compact */}
          {/* Only show if non-default filters are active */}
          {(filters.status !== 'all' || 
            filters.scoreRange !== 'all' || 
            filters.dateRange !== 'all' || 
            filters.sortBy !== 'created_at' || 
            filters.sortOrder !== 'desc') && (
            <div className="flex flex-wrap items-center gap-1 mt-3 pt-2 border-t border-gray-600/30">
              {Object.entries(filters).map(([key, value]) => {
                // Skip default values
                if ((key === 'status' && value === 'all') || 
                    (key === 'sortOrder' && value === 'desc') || 
                    (key === 'sortBy' && value === 'created_at') ||
                    value === 'all') return null;
                
                const labels = {
                  status: { unpublished: 'Draft', published: 'Published' },
                  scoreRange: { high: 'High', medium: 'Medium', low: 'Low' },
                  dateRange: { today: 'Today', week: 'Week', month: 'Month' },
                  sortBy: { relevance_score: 'Score', trend: 'Trend' },
                  sortOrder: { asc: 'Oldest' }
                };
                const label = labels[key]?.[value] || value;
                return (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className="text-xs bg-highlight/10 text-highlight border-highlight/30 px-1.5 py-0.5"
                  >
                    {label}
                  </Badge>
                );
              })}
              
              <span className="text-xs text-gray-500 ml-auto">
                {totalItems} items
              </span>
            </div>
          )}
          
          {/* Show item count when no filters are active */}
          {(filters.status === 'all' && 
            filters.scoreRange === 'all' && 
            filters.dateRange === 'all' && 
            filters.sortBy === 'created_at' && 
            filters.sortOrder === 'desc') && (
            <div className="flex justify-end mt-2">
              <span className="text-xs text-gray-500">
                {totalItems} items
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {aiItems.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              {/* Check if any non-default filters are active */}
              {(filters.status !== 'all' || 
                filters.scoreRange !== 'all' || 
                filters.dateRange !== 'all' || 
                filters.sortBy !== 'created_at' || 
                filters.sortOrder !== 'desc') 
                ? 'No content matches your filters' 
                : 'No AI content found'
              }
            </h2>
            <p className="text-text-paragraph mb-6">
              {(filters.status !== 'all' || 
                filters.scoreRange !== 'all' || 
                filters.dateRange !== 'all' || 
                filters.sortBy !== 'created_at' || 
                filters.sortOrder !== 'desc') 
                ? 'Try adjusting your filters or generate new AI content'
                : 'Generate AI content by viewing RSS feeds for this campaign'
              }
            </p>
            {/* Show clear filters button if non-default filters are active */}
            {(filters.status !== 'all' || 
              filters.scoreRange !== 'all' || 
              filters.dateRange !== 'all' || 
              filters.sortBy !== 'created_at' || 
              filters.sortOrder !== 'desc') && (
              <Button 
                onClick={() => {
                  setFilters({
                    status: 'all',
                    scoreRange: 'all',
                    dateRange: 'all',
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  });
                  setCurrentPage(1);
                }}
                variant="outline"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* AI Items */}
            <div className="space-y-6 mb-8">
              {aiItems.map((item) => {
                // Determine score badge color
                const getScoreBadge = (score) => {
                  if (score >= 80) return { color: 'text-green-400 bg-green-900/20 border-green-600/30', icon: '⭐', label: 'High' };
                  if (score >= 50) return { color: 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30', icon: '🔶', label: 'Medium' };
                  return { color: 'text-orange-400 bg-orange-900/20 border-orange-600/30', icon: '📊', label: 'Low' };
                };

                const scoreBadge = getScoreBadge(item.relevance_score);

                return (
                  <div
                    key={item.id}
                    className={`bg-card-bg border rounded-lg p-6 transition-all relative ${
                      item.is_published 
                        ? 'border-green-600/50 bg-green-900/5 shadow-green-900/20' 
                        : 'border-gray-600/50 hover:border-gray-500/50'
                    } hover:shadow-lg`}
                  >
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-blue-400 uppercase tracking-wide">News Headline</span>
                        </div>
                        <h3 className="font-semibold text-white text-lg lg:text-xl leading-tight mb-3">
                          {item.headline}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-blue-900/20 text-blue-400 border-blue-600/30"
                          >
                            {scoreBadge.icon} {item.relevance_score}/100 {scoreBadge.label}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-600/30">
                            📈 {item.trend}
                          </Badge>
                          
                          {item.image_url && (
                            <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-600/30">
                              🖼️ Image
                            </Badge>
                          )}
                          
                          {item.tags && item.tags.length > 0 && (
                            <>
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <Badge 
                                  key={index}
                                  variant="outline" 
                                  className="text-xs bg-purple-900/20 text-purple-400 border-purple-600/30"
                                >
                                  🏷️ {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-purple-900/20 text-purple-400 border-purple-600/30"
                                  title={`Additional tags: ${item.tags.slice(3).join(', ')}`}
                                >
                                  +{item.tags.length - 3} more
                                </Badge>
                              )}
                            </>
                          )}
                          
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-900/20 text-blue-400 border border-blue-600/30 hover:border-blue-500/50 hover:bg-blue-900/30 transition-all rounded-full px-2 py-1"
                            title="Read original article"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">Source</span>
                            <span className="sm:hidden">Link</span>
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3">
                        <div className="lg:order-2">
                          <Toggle
                            checked={item.is_published}
                            onChange={(checked) => togglePublished(item.id, item.is_published)}
                            label={item.is_published ? 'Published' : 'Draft'}
                            size="sm"
                            className="focus:ring-offset-gray-800"
                          />
                        </div>
                        <div className="lg:order-1 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateVariants(item)}
                            className="h-10 w-10 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 transition-all duration-200"
                            title="Generate Ad Variants"
                          >
                            <Wand2 className="w-4 h-4 lg:w-5 lg:h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateLandingPage(item)}
                            disabled={generatingLandingPage[item.id]}
                            className="h-10 w-10 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-all duration-200 disabled:opacity-50"
                            title="Generate Landing Page"
                          >
                            {generatingLandingPage[item.id] ? (
                              <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 lg:w-5 lg:h-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            className="h-10 w-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200"
                            title="Delete this AI content"
                          >
                            <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Main Content - Always Visible */}
                    <div className="mb-6">
                      {/* Tabs for Ad Preview and Variants */}
                      {item.ad_placement && typeof item.ad_placement === 'object' && (
                        <div>
                          {/* Tab Header */}
                          <div className="flex items-center gap-4 border-b border-gray-600 mb-4">
                            <button
                              onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'preview' }))}
                              className={`pb-3 px-2 text-sm font-medium transition-all relative ${
                                (activeTab[item.id] || 'preview') === 'preview'
                                  ? 'text-blue-400'
                                  : 'text-gray-400 hover:text-gray-300'
                              }`}
                            >
                              <Monitor className="w-4 h-4 inline mr-1.5" />
                              Ad Preview
                              {(activeTab[item.id] || 'preview') === 'preview' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                              )}
                            </button>
                            <button
                              onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'variants' }))}
                              className={`pb-3 px-2 text-sm font-medium transition-all relative ${
                                activeTab[item.id] === 'variants'
                                  ? 'text-purple-400'
                                  : 'text-gray-400 hover:text-gray-300'
                              }`}
                            >
                              <Wand2 className="w-4 h-4 inline mr-1.5" />
                              Ad Variants
                              {activeTab[item.id] === 'variants' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"></div>
                              )}
                            </button>
                          </div>

                          {/* Tab Content */}
                          {(activeTab[item.id] || 'preview') === 'preview' ? (
                            /* Ad Preview Content */
                            <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              {/* Translation toggle - only show if translations exist */}
                              {(item.ad_placement.headline_en || item.ad_placement.body_en) && (
                                <button
                                  onClick={() => setShowEnglishTranslation(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
                                    showEnglishTranslation[item.id]
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                  }`}
                                  title="Toggle English translation"
                                >
                                  <span className="text-[10px] font-bold">EN</span>
                                  <span className="hidden sm:inline">Translate</span>
                                </button>
                              )}
                            </div>
                            
                            {/* Preview Style Toggle */}
                            <div className="flex items-center gap-1 bg-card-bg border border-gray-600 rounded-md p-1 w-fit">
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'banner' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  (previewStyles[item.id] || 'banner') === 'banner'
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <TrendingUp className="w-3 h-3" />
                                <span className="hidden sm:inline">Banner</span>
                                <span className="sm:hidden">Banner</span>
                              </button>
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'desktop' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  previewStyles[item.id] === 'desktop'
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <Monitor className="w-3 h-3" />
                                <span className="hidden sm:inline">Desktop</span>
                                <span className="sm:hidden">Web</span>
                              </button>
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'mobile' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  previewStyles[item.id] === 'mobile'
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <Smartphone className="w-3 h-3" />
                                <span className="hidden sm:inline">Social</span>
                                <span className="sm:hidden">Mobile</span>
                              </button>
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'adword' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  previewStyles[item.id] === 'adword'
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <span className="hidden sm:inline">AdWord</span>
                                <span className="sm:hidden">Ad</span>
                              </button>
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'manual' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  previewStyles[item.id] === 'manual'
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                              >
                                <Clipboard className="w-3 h-3" />
                                <span className="hidden sm:inline">Manual</span>
                                <span className="sm:hidden">Copy</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Banner/Image Overlay Style */}
                          {(previewStyles[item.id] || 'banner') === 'banner' && (
                            <div>
                              <div className="flex justify-center mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const bannerHTML = `<div style="margin: 0; padding: 0; position: relative; display: block; width: 300px; height: 250px; overflow: hidden; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-decoration: none; cursor: pointer; font-family: Arial, Helvetica, sans-serif; background-color: #f8f9fa;">
  <img src="${item.image_url || 'https://via.placeholder.com/600x500.jpg?text=Your+Product+Image'}" alt="Ad Background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease;" />
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.1) 100%);"></div>
  <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; color: #fff;">
    <div style="font-size: 18px; font-weight: 600; line-height: 1.2em; max-height: 2.4em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.ad_placement.headline}</div>
    <div style="font-size: 14px; font-weight: 400; line-height: 1.3em; max-height: 5.2em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; opacity: 0.9;">${item.ad_placement.body}</div>
    <div style="align-self: start; padding: 8px 16px; background: linear-gradient(90deg, #00c6ff 0%, #7d2cff 100%); color: #fff; font-size: 14px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${item.ad_placement.cta}</div>
  </div>
</div>`;
                                    navigator.clipboard.writeText(bannerHTML);
                                    setCopiedFields(prev => ({ ...prev, [`${item.id}-banner-html`]: true }));
                                    setTimeout(() => {
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-banner-html`]: false }));
                                    }, 2000);
                                  }}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {copiedFields[`${item.id}-banner-html`] ? (
                                    <><Check className="w-4 h-4 mr-1" /> HTML Copied</>
                                  ) : (
                                    <><Copy className="w-4 h-4 mr-1" /> Copy HTML</>
                                  )}
                                </Button>
                              </div>
                              <div className="flex justify-center">
                              <div 
                                style={{
                                  margin: 0,
                                  padding: 0,
                                  position: 'relative',
                                  display: 'block',
                                  width: '300px',
                                  height: '250px',
                                  overflow: 'hidden',
                                  borderRadius: '10px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  fontFamily: 'Arial, Helvetica, sans-serif',
                                  backgroundColor: '#f8f9fa'
                                }}
                              >
                                {/* Background image */}
                                <img 
                                  src={item.image_url || 'https://via.placeholder.com/600x500.jpg?text=Your+Product+Image'}
                                  alt="Ad Background"
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.8s ease'
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/600x500.jpg?text=Your+Product+Image';
                                  }}
                                />

                                {/* Gradient overlay */}
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.1) 100%)'
                                }}></div>

                                {/* Content */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '16px',
                                  left: '16px',
                                  right: '16px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  color: '#fff'
                                }}>

                                  {/* Headline */}
                                  <div style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    lineHeight: '1.2em',
                                    maxHeight: '2.4em',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                  }}>
                                    {showEnglishTranslation[item.id] && item.ad_placement.headline_en 
                                      ? item.ad_placement.headline_en 
                                      : (item.ad_placement.headline || 'Your Catchy Placeholder Headline Fits Here')}
                                  </div>

                                  {/* Description */}
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    lineHeight: '1.3em',
                                    maxHeight: '5.2em',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    opacity: 0.9
                                  }}>
                                    {showEnglishTranslation[item.id] && item.ad_placement.body_en 
                                      ? item.ad_placement.body_en 
                                      : (item.ad_placement.body || 'A short, engaging description that automatically truncates if too long.')}
                                  </div>

                                  {/* CTA Button */}
                                  <div style={{
                                    alignSelf: 'start',
                                    padding: '8px 16px',
                                    background: 'linear-gradient(90deg, #00c6ff 0%, #7d2cff 100%)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {item.ad_placement.cta || 'Learn More'}
                                  </div>

                                </div>
                              </div>
                            </div>
                            </div>
                          )}

                          {/* Desktop/Web Ad Style */}
                          {previewStyles[item.id] === 'desktop' && (
                            <div>
                              <div className="flex justify-center mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const desktopHTML = `<div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #d1d5db; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background: linear-gradient(to right, #eff6ff, #faf5ff); border-radius: 6px; padding: 16px; border: 1px solid #bfdbfe;">
    <div style="display: flex; gap: 12px;">
      <div style="width: 40px; height: 40px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span style="color: white; font-size: 14px; font-weight: bold;">Ad</span>
      </div>
      <div style="flex: 1;">
        <h5 style="font-weight: 600; color: #111827; font-size: 16px; margin-bottom: 8px; line-height: 1.2;">${item.ad_placement.headline}</h5>
        <p style="color: #374151; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">${item.ad_placement.body}</p>
        ${item.image_url ? `<img src="${item.image_url}" alt="Article image" style="width: 100%; height: 128px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 12px;" />` : ''}
        <button style="background: #2563eb; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 14px; border: none; cursor: pointer;">${item.ad_placement.cta}</button>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(191, 219, 254, 0.3);">
      <span style="font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">Sponsored</span>
      <span style="font-size: 12px; color: #9ca3af;">${campaign?.name || 'Campaign'}</span>
    </div>
  </div>
</div>`;
                                    navigator.clipboard.writeText(desktopHTML);
                                    setCopiedFields(prev => ({ ...prev, [`${item.id}-desktop-html`]: true }));
                                    setTimeout(() => {
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-desktop-html`]: false }));
                                    }, 2000);
                                  }}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {copiedFields[`${item.id}-desktop-html`] ? (
                                    <><Check className="w-4 h-4 mr-1" /> HTML Copied</>
                                  ) : (
                                    <><Copy className="w-4 h-4 mr-1" /> Copy HTML</>
                                  )}
                                </Button>
                              </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md">
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">Ad</span>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900 text-base mb-2 leading-tight">
                                      {showEnglishTranslation[item.id] && item.ad_placement.headline_en 
                                        ? item.ad_placement.headline_en 
                                        : item.ad_placement.headline}
                                    </h5>
                                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                      {showEnglishTranslation[item.id] && item.ad_placement.body_en 
                                        ? item.ad_placement.body_en 
                                        : item.ad_placement.body}
                                    </p>
                                    
                                    {/* Article Image */}
                                    {item.image_url && (
                                      <div className="mb-3">
                                        <img 
                                          src={item.image_url} 
                                          alt="Article image" 
                                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Placeholder for missing image */}
                                    {!item.image_url && (
                                      <div className="mb-3 w-full h-32 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="text-gray-400 text-2xl mb-1">🖼️</div>
                                          <div className="text-xs text-gray-500">No image</div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors shadow-sm">
                                      {item.ad_placement.cta}
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-blue-300/30">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Sponsored
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {campaign?.name || 'Campaign'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            </div>
                          )}

                          {/* Mobile/Social Style */}
                          {previewStyles[item.id] === 'mobile' && (
                            <div>
                              <div className="flex justify-center mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const mobileHTML = `<div style="display: flex; justify-content: center;">
  <div style="background: white; border-radius: 8px; padding: 12px; border: 1px solid #d1d5db; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); width: 100%; max-width: 384px;">
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(to bottom right, #3b82f6, #9333ea); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 12px; font-weight: bold;">${campaign?.name?.substring(0, 2).toUpperCase() || 'AD'}</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <p style="font-size: 14px; font-weight: 500; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${campaign?.name || 'Campaign'}</p>
            <p style="font-size: 12px; color: #6b7280;">Sponsored</p>
          </div>
        </div>
      </div>
      <div style="padding: 12px;">
        <h6 style="font-weight: 600; color: #111827; font-size: 14px; margin-bottom: 8px; line-height: 1.2;">${item.ad_placement.headline}</h6>
        <p style="color: #374151; font-size: 12px; margin-bottom: 12px; line-height: 1.5;">${item.ad_placement.body}</p>
        ${item.image_url ? `<img src="${item.image_url}" alt="Article image" style="width: 100%; height: 96px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; margin-bottom: 12px;" />` : ''}
        <button style="width: 100%; background: #2563eb; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 12px; border: none; cursor: pointer;">${item.ad_placement.cta}</button>
      </div>
    </div>
  </div>
</div>`;
                                    navigator.clipboard.writeText(mobileHTML);
                                    setCopiedFields(prev => ({ ...prev, [`${item.id}-mobile-html`]: true }));
                                    setTimeout(() => {
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-mobile-html`]: false }));
                                    }, 2000);
                                  }}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {copiedFields[`${item.id}-mobile-html`] ? (
                                    <><Check className="w-4 h-4 mr-1" /> HTML Copied</>
                                  ) : (
                                    <><Copy className="w-4 h-4 mr-1" /> Copy HTML</>
                                  )}
                                </Button>
                              </div>
                            <div className="flex justify-center">
                              <div className="bg-white rounded-lg p-3 border border-gray-300 shadow-sm w-full max-w-sm">
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Header */}
                                  <div className="p-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{campaign?.name?.substring(0, 2).toUpperCase() || 'AD'}</span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{campaign?.name || 'Campaign'}</p>
                                        <p className="text-xs text-gray-500">Sponsored</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="p-3">
                                    <h6 className="font-semibold text-gray-900 text-sm mb-2 leading-tight">
                                      {showEnglishTranslation[item.id] && item.ad_placement.headline_en 
                                        ? item.ad_placement.headline_en 
                                        : item.ad_placement.headline}
                                    </h6>
                                    <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                                      {showEnglishTranslation[item.id] && item.ad_placement.body_en 
                                        ? item.ad_placement.body_en 
                                        : item.ad_placement.body}
                                    </p>
                                    
                                    {/* Article Image */}
                                    {item.image_url && (
                                      <div className="mb-3">
                                        <img 
                                          src={item.image_url} 
                                          alt="Article image" 
                                          className="w-full h-24 object-cover rounded border border-gray-200"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Placeholder for missing image */}
                                    {!item.image_url && (
                                      <div className="mb-3 w-full h-24 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="text-gray-400 text-lg mb-1">🖼️</div>
                                          <div className="text-xs text-gray-500">No image</div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <button className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-xs hover:bg-blue-700 transition-colors">
                                      {item.ad_placement.cta}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                          )}

                          {/* AdWord Text-Only Style */}
                          {previewStyles[item.id] === 'adword' && (
                            <div className="flex justify-center">
                              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm w-full max-w-2xl">
                                {/* Sponsored Header */}
                                <div className="mb-3">
                                  <span className="text-gray-600 text-sm font-normal">
                                    Sponsored
                                  </span>
                                </div>
                                
                                {/* Logo/Icon and Brand Info */}
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">
                                      {campaign?.name?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-gray-900 text-sm font-medium">
                                      {campaign?.name || 'Campaign'}
                                    </div>
                                    <div className="text-[#006621] text-xs">
                                      {campaign?.url ? new URL(campaign.url).hostname.replace('www.', '') : 'example.com'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Headline - Clickable Blue Link */}
                                <h5 className="text-[#1a0dab] hover:underline cursor-pointer text-xl font-normal mb-2 leading-tight">
                                  {showEnglishTranslation[item.id] && item.ad_placement.headline_en 
                                    ? item.ad_placement.headline_en 
                                    : item.ad_placement.headline}
                                </h5>
                                
                                {/* Body Text/Description */}
                                <p className="text-[#4d5156] text-sm leading-relaxed">
                                  {showEnglishTranslation[item.id] && item.ad_placement.body_en 
                                    ? item.ad_placement.body_en 
                                    : item.ad_placement.body}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Manual Copy Style */}
                          {previewStyles[item.id] === 'manual' && (
                            <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4 space-y-4">
                              {/* Headline */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-blue-400 text-sm font-medium">Headline</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.ad_placement.headline);
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-headline`]: true }));
                                      setTimeout(() => {
                                        setCopiedFields(prev => ({ ...prev, [`${item.id}-headline`]: false }));
                                      }, 2000);
                                    }}
                                    className="h-8 px-2 text-gray-400 hover:text-white"
                                  >
                                    {copiedFields[`${item.id}-headline`] ? (
                                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                                    ) : (
                                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-card-bg border border-gray-600 rounded p-3 text-white text-sm">
                                  {item.ad_placement.headline}
                                </div>
                              </div>

                              {/* Body/Description */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-blue-400 text-sm font-medium">Body Text</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.ad_placement.body);
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-body`]: true }));
                                      setTimeout(() => {
                                        setCopiedFields(prev => ({ ...prev, [`${item.id}-body`]: false }));
                                      }, 2000);
                                    }}
                                    className="h-8 px-2 text-gray-400 hover:text-white"
                                  >
                                    {copiedFields[`${item.id}-body`] ? (
                                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                                    ) : (
                                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-card-bg border border-gray-600 rounded p-3 text-white text-sm leading-relaxed">
                                  {item.ad_placement.body}
                                </div>
                              </div>

                              {/* CTA */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-blue-400 text-sm font-medium">Call to Action</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.ad_placement.cta);
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-cta`]: true }));
                                      setTimeout(() => {
                                        setCopiedFields(prev => ({ ...prev, [`${item.id}-cta`]: false }));
                                      }, 2000);
                                    }}
                                    className="h-8 px-2 text-gray-400 hover:text-white"
                                  >
                                    {copiedFields[`${item.id}-cta`] ? (
                                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                                    ) : (
                                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-card-bg border border-gray-600 rounded p-3 text-white text-sm font-medium">
                                  {item.ad_placement.cta}
                                </div>
                              </div>

                              {/* English Translations (if available for non-English ads) */}
                              {(item.ad_placement.headline_en || item.ad_placement.body_en) && (
                                <div className="pt-4 border-t border-gray-600/50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-blue-900/30 border border-blue-600/50 rounded flex items-center justify-center">
                                      <span className="text-blue-400 text-xs font-bold">EN</span>
                                    </div>
                                    <Label className="text-blue-400 text-sm font-medium">English Translations</Label>
                                  </div>
                                  
                                  {item.ad_placement.headline_en && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-gray-400 text-xs font-medium">Headline (English)</Label>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(item.ad_placement.headline_en);
                                            setCopiedFields(prev => ({ ...prev, [`${item.id}-headline-en`]: true }));
                                            setTimeout(() => {
                                              setCopiedFields(prev => ({ ...prev, [`${item.id}-headline-en`]: false }));
                                            }, 2000);
                                          }}
                                          className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                                        >
                                          {copiedFields[`${item.id}-headline-en`] ? (
                                            <><Check className="w-3 h-3 mr-1" /> Copied</>
                                          ) : (
                                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                          )}
                                        </Button>
                                      </div>
                                      <div className="bg-blue-900/10 border border-blue-600/30 rounded p-3 text-blue-300 text-sm italic">
                                        {item.ad_placement.headline_en}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {item.ad_placement.body_en && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-gray-400 text-xs font-medium">Body (English)</Label>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(item.ad_placement.body_en);
                                            setCopiedFields(prev => ({ ...prev, [`${item.id}-body-en`]: true }));
                                            setTimeout(() => {
                                              setCopiedFields(prev => ({ ...prev, [`${item.id}-body-en`]: false }));
                                            }, 2000);
                                          }}
                                          className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                                        >
                                          {copiedFields[`${item.id}-body-en`] ? (
                                            <><Check className="w-3 h-3 mr-1" /> Copied</>
                                          ) : (
                                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                          )}
                                        </Button>
                                      </div>
                                      <div className="bg-blue-900/10 border border-blue-600/30 rounded p-3 text-blue-300 text-sm leading-relaxed italic">
                                        {item.ad_placement.body_en}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Campaign URL */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-blue-400 text-sm font-medium">Campaign URL</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(campaign?.url || '');
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-url`]: true }));
                                      setTimeout(() => {
                                        setCopiedFields(prev => ({ ...prev, [`${item.id}-url`]: false }));
                                      }, 2000);
                                    }}
                                    className="h-8 px-2 text-gray-400 hover:text-white"
                                  >
                                    {copiedFields[`${item.id}-url`] ? (
                                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                                    ) : (
                                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-card-bg border border-gray-600 rounded p-3 text-blue-400 text-sm break-all">
                                  {campaign?.url || 'No URL'}
                                </div>
                              </div>

                              {/* Image URL if available */}
                              {item.image_url && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-blue-400 text-sm font-medium">Image URL</Label>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => showImageGallery(item)}
                                        className="h-8 px-2 text-purple-400 hover:text-purple-300"
                                        title="View all images and select main image"
                                      >
                                        <ImagePlus className="w-4 h-4 mr-1" /> Gallery
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.image_url);
                                          setCopiedFields(prev => ({ ...prev, [`${item.id}-image`]: true }));
                                          setTimeout(() => {
                                            setCopiedFields(prev => ({ ...prev, [`${item.id}-image`]: false }));
                                          }, 2000);
                                        }}
                                        className="h-8 px-2 text-gray-400 hover:text-white"
                                      >
                                        {copiedFields[`${item.id}-image`] ? (
                                          <><Check className="w-4 h-4 mr-1" /> Copied</>
                                        ) : (
                                          <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="bg-card-bg border border-gray-600 rounded p-3 text-blue-400 text-sm break-all">
                                    {item.image_url}
                                  </div>
                                </div>
                              )}

                              {/* Show gallery button even if no image */}
                              {!item.image_url && (
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => showImageGallery(item)}
                                    className="w-full border-purple-600/50 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                  >
                                    <ImagePlus className="w-4 h-4 mr-2" />
                                    View Generated Images
                                  </Button>
                                </div>
                              )}

                              {/* Copy All Button */}
                              <div className="pt-2 border-t border-gray-600">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    const allText = `Headline: ${item.ad_placement.headline}\n\nBody: ${item.ad_placement.body}\n\nCTA: ${item.ad_placement.cta}\n\nURL: ${campaign?.url || ''}${item.image_url ? `\n\nImage: ${item.image_url}` : ''}`;
                                    navigator.clipboard.writeText(allText);
                                    setCopiedFields(prev => ({ ...prev, [`${item.id}-all`]: true }));
                                    setTimeout(() => {
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-all`]: false }));
                                    }, 2000);
                                  }}
                                >
                                  {copiedFields[`${item.id}-all`] ? (
                                    <><Check className="w-4 h-4 mr-2" /> All Content Copied!</>
                                  ) : (
                                    <><Copy className="w-4 h-4 mr-2" /> Copy All Content</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                            ) : (
                            /* Ad Variants Content */
                            <VariantCarousel
                              aiItem={item}
                              onImageGalleryOpen={handleVariantImageGallery}
                              onVariantUpdate={handleVariantUpdate}
                              onVariantDelete={handleVariantDelete}
                              onGenerateClick={() => setVariantGeneratorModal({ show: true, item })}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    
                    {/* AI Reasoning Section */}
                    <div className="mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReason(item.id)}
                        className="text-gray-400 hover:text-white transition-colors text-sm h-auto p-2 -ml-2"
                      >
                        <div className="flex items-center gap-2">
                          {expandedReasons[item.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>Why AI thinks this is good ad copy?</span>
                        </div>
                      </Button>
                      
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedReasons[item.id] ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="bg-yellow-900/10 border border-yellow-600/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-yellow-900/30 border border-yellow-600/50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-yellow-400 text-sm">AI</span>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-yellow-400 mb-2">AI Analysis</h5>
                              <p className="text-sm text-yellow-200 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Generated Timestamp */}
                    <div className="mb-4">
                      <div className="ml-2 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Generated {formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Image Section */}
                    <div className="mb-4 flex items-center justify-between bg-gray-800/20 border border-gray-600/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-gray-300">Images</span>
                        {item.image_url && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-green-900/20 text-green-400 border-green-600/30">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Set
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showImagePromptModal(item)}
                          disabled={generatingImage[item.id] || !item.image_prompt}
                          className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 disabled:opacity-50"
                          title="Generate new AI image"
                        >
                          {generatingImage[item.id] ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <ImagePlus className="w-3.5 h-3.5 mr-1" />
                              <span>Generate</span>
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showImageGallery(item)}
                          className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          title="View and manage all images"
                        >
                          <Images className="w-3.5 h-3.5 mr-1" />
                          <span>Gallery</span>
                        </Button>
                      </div>
                    </div>

                    {/* Keywords Section */}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="mb-4">
                        <div className="bg-emerald-900/10 border border-emerald-600/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-emerald-900/30 border border-emerald-600/50 rounded flex items-center justify-center">
                              <span className="text-emerald-400 text-xs font-bold">🔑</span>
                            </div>
                            <h5 className="text-sm font-medium text-emerald-400">Targeting Keywords</h5>
                            <span className="text-xs text-emerald-500/70">({item.keywords.length} keywords)</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.keywords.map((keyword, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1 group"
                              >
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-emerald-900/20 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/30 transition-colors"
                                >
                                  {keyword}
                                </Badge>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(keyword);
                                    setCopiedFields(prev => ({ ...prev, [`${item.id}-keyword-${index}`]: true }));
                                    setTimeout(() => {
                                      setCopiedFields(prev => ({ ...prev, [`${item.id}-keyword-${index}`]: false }));
                                    }, 1500);
                                  }}
                                  className="p-0.5 hover:bg-emerald-900/30 rounded transition-colors"
                                  title={`Copy "${keyword}"`}
                                >
                                  {copiedFields[`${item.id}-keyword-${index}`] ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-emerald-500/50 hover:text-emerald-400" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-emerald-500/60 mt-2 italic">
                            Article-specific keywords for lower-cost ad targeting
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details Toggle Button */}
                    <div className="flex items-center justify-center mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetails(item.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedDetails[item.id] ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Details Section - Collapsible */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedDetails[item.id] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-gray-600/30 pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            {/* Clickbait */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-orange-400">💡 Hook</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.clickbait, `clickbait-${item.id}`)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                                >
                                  {copiedId === `clickbait-${item.id}` ? 
                                    <Check className="w-3 h-3 text-green-400" /> : 
                                    <Copy className="w-3 h-3" />
                                  }
                                </Button>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">Social media hook:</p>
                              <p className="text-orange-300 font-medium bg-orange-900/10 p-3 rounded border-l-2 border-orange-600 text-sm">
                                "{item.clickbait}"
                              </p>
                            </div>

                            {/* Tooltip */}
                            <div>
                              <h4 className="text-sm font-medium text-purple-400 mb-2">💬 Engagement</h4>
                              <p className="text-sm text-gray-400 mb-2">User interaction message:</p>
                              <p className="text-sm text-purple-300 italic bg-purple-900/10 p-3 rounded border-l-2 border-purple-600">
                                {item.tooltip}
                              </p>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            {/* Ad Placement */}
                            {item.ad_placement && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-green-400">🎯 Ad Copy</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(
                                      typeof item.ad_placement === 'string' 
                                        ? item.ad_placement 
                                        : `Headline: ${item.ad_placement.headline}\n\nBody: ${item.ad_placement.body}\n\nCall to Action: ${item.ad_placement.cta}`,
                                      `ad-${item.id}`
                                    )}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                                  >
                                    {copiedId === `ad-${item.id}` ? 
                                      <Check className="w-3 h-3 text-green-400" /> : 
                                      <Copy className="w-3 h-3" />
                                    }
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">Campaign components:</p>
                                
                                {typeof item.ad_placement === 'string' ? (
                                  <p className="text-sm text-green-300 bg-green-900/20 p-3 rounded border-l-2 border-green-600">
                                    {item.ad_placement}
                                  </p>
                                ) : (
                                  <div className="bg-green-900/20 p-3 lg:p-4 rounded border-l-2 border-green-600 space-y-3">
                                    <div>
                                      <h6 className="text-xs font-semibold text-green-400 mb-1 uppercase tracking-wide">Headline</h6>
                                      <p className="text-sm font-medium text-green-300">{item.ad_placement.headline}</p>
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-semibold text-green-400 mb-1 uppercase tracking-wide">Body</h6>
                                      <p className="text-sm text-green-300">{item.ad_placement.body}</p>
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-semibold text-green-400 mb-1 uppercase tracking-wide">CTA</h6>
                                      <p className="text-sm font-semibold text-green-300 bg-green-800/30 px-3 py-1 rounded inline-block">
                                        {item.ad_placement.cta}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Source Link */}
                            <div className="pt-3 border-t border-gray-600/30">
                              <h4 className="text-sm font-medium text-blue-400 mb-2">📰 Source</h4>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-900/10 px-3 py-2 rounded border border-blue-600/30 hover:border-blue-500/50 transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">Read Full Article</span>
                                <span className="sm:hidden">Read More</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-text-paragraph text-center sm:text-left">
                  <span className="hidden sm:inline">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                  </span>
                  <span className="sm:hidden">
                    {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {/* Show fewer page numbers on mobile */}
                    <div className="hidden sm:flex sm:items-center sm:gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          {currentPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                          <Button
                            variant={currentPage === totalPages ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Mobile pagination - just show current page */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {currentPage} / {totalPages}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-gray-600/50 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-900/20 border border-red-600/50 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete AI Content</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-3">
                  Are you sure you want to delete this AI content?
                </p>
                <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                  <p className="font-medium text-white text-sm line-clamp-2">
                    {deleteConfirm.item?.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        deleteConfirm.item?.is_published 
                          ? 'bg-green-900/30 text-green-400 border-green-600/30'
                          : 'bg-gray-800/50 text-gray-400 border-gray-600/30'
                      }`}
                    >
                      {deleteConfirm.item?.is_published ? '📢 Published' : '📝 Draft'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Score: {deleteConfirm.item?.relevance_score}/100
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="flex-1 border-gray-600 hover:border-gray-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Prompt Modal */}
        {imagePromptModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-gray-600/50 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-900/20 border border-purple-600/50 rounded-full flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Generate AI Image</h3>
                  <p className="text-sm text-gray-400">Review the image prompt before generating</p>
                </div>
                <button
                  onClick={() => setImagePromptModal({ show: false, item: null, prompt: '' })}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Content:</h4>
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                    <p className="font-medium text-white text-sm line-clamp-2">
                      {imagePromptModal.item?.headline}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">AI Image Prompt:</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(imagePromptModal.prompt);
                        setCopiedId('image-prompt');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      {copiedId === 'image-prompt' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <textarea
                    value={imagePromptModal.prompt}
                    onChange={(e) => setImagePromptModal(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 text-gray-300 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={8}
                    placeholder="Enter image generation prompt..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Edit the prompt to customize how the AI generates the image
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setImagePromptModal({ show: false, item: null, prompt: '' })}
                  variant="outline"
                  className="flex-1 border-gray-600 hover:border-gray-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => generateAIImage(imagePromptModal.item)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Generate Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Gallery Modal */}
        {imageGalleryModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-gray-600/50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-900/20 border border-purple-600/50 rounded-full flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Image Gallery</h3>
                    <p className="text-sm text-gray-400">Select main image or delete unused images</p>
                  </div>
                </div>
                <button
                  onClick={() => setImageGalleryModal({ show: false, item: null, images: [] })}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {imageGalleryModal.images.length === 0 ? (
                  <div className="text-center py-12">
                    <ImagePlus className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No images available</p>
                    <p className="text-gray-500 text-sm mt-2">Generate an AI image to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imageGalleryModal.images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative group bg-gray-800/50 border rounded-lg overflow-hidden transition-all ${
                          image.isCurrent
                            ? 'border-green-500 ring-2 ring-green-500/50'
                            : 'border-gray-600 hover:border-purple-500/50'
                        }`}
                      >
                        {/* Image */}
                        <div className="aspect-video relative">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                          />
                          
                          {/* Current Badge */}
                          {image.isCurrent && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-600 text-white">
                                <Check className="w-3 h-3 mr-1" />
                                Current
                              </Badge>
                            </div>
                          )}

                          {/* Type Badge */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="outline" className={`text-xs ${
                              image.type === 'news'
                                ? 'bg-blue-900/80 text-blue-300 border-blue-600'
                                : 'bg-purple-900/80 text-purple-300 border-purple-600'
                            }`}>
                              {image.type === 'news' ? '📰 News' : '🤖 AI Generated'}
                            </Badge>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!image.isCurrent && (
                              <Button
                                size="sm"
                                onClick={() => selectImage(imageGalleryModal.item, image.url)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Select
                              </Button>
                            )}
                            {image.type === 'generated' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteImage(imageGalleryModal.item, image)}
                                disabled={deletingImage === image.url}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingImage === image.url ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Image Info */}
                        <div className="p-3">
                          <p className="text-white text-sm font-medium truncate" title={image.name}>
                            {image.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-600/50 p-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">
                    {imageGalleryModal.images.length} {imageGalleryModal.images.length === 1 ? 'image' : 'images'} available
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setImageGalleryModal({ show: false, item: null, images: [] });
                        if (imageGalleryModal.item) {
                          showImagePromptModal(imageGalleryModal.item);
                        }
                      }}
                      disabled={!imageGalleryModal.item?.image_prompt || generatingImage[imageGalleryModal.item?.id]}
                      className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Generate New Image
                    </Button>
                    <Button
                      onClick={() => setImageGalleryModal({ show: false, item: null, images: [] })}
                      variant="outline"
                      className="border-gray-600 hover:border-gray-500"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Variant Generator Modal */}
        <VariantGeneratorModal
          isOpen={variantGeneratorModal.show}
          onClose={() => setVariantGeneratorModal({ show: false, item: null })}
          aiItem={variantGeneratorModal.item}
          onVariantsGenerated={handleVariantsGenerated}
        />

        {/* Variant Image Selector Modal */}
        <VariantImageSelector
          isOpen={variantImageModal.show}
          onClose={() => setVariantImageModal({ show: false, item: null, variant: null })}
          aiItem={variantImageModal.item}
          variant={variantImageModal.variant}
          onImageSelected={handleVariantImageSelected}
        />
      </div>
    </Layout>
  );
}