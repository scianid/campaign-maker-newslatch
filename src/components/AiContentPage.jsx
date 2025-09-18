import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, TrendingUp, Zap, Eye, EyeOff, Copy, Check, ArrowLeft, ChevronLeft, ChevronRight, Filter, SortDesc, Star, Clock, RefreshCw, Monitor, Smartphone, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Layout } from './Layout';
import { supabase } from '../lib/supabase';

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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'published', 'unpublished'
    scoreRange: 'all', // 'all', 'high', 'medium', 'low'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    sortBy: 'created_at', // 'created_at', 'relevance_score', 'trend'
    sortOrder: 'desc' // 'desc', 'asc'
  });
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

      console.log('🔍 Fetching AI items with filters:', filters);
      console.log('📡 Request URL:', `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ai-content?${params}`);

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
      
      console.log('📊 API Response:', {
        success: !result.error,
        itemsReceived: result.ai_items?.length || 0,
        totalItems: result.total || 0,
        currentFilters: filters
      });
      
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
        <Button onClick={fetchAiItems} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
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
                        <div className="lg:order-1">
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

                    {/* Main Content - Always Visible */}
                    <div className="mb-6">
                      {/* Ad Preview Demo */}
                      {item.ad_placement && typeof item.ad_placement === 'object' && (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <h4 className="text-sm font-medium text-blue-400">Ad Preview</h4>
                            
                            {/* Preview Style Toggle */}
                            <div className="flex items-center gap-1 bg-card-bg border border-gray-600 rounded-md p-1 w-fit">
                              <button
                                onClick={() => setPreviewStyles(prev => ({ ...prev, [item.id]: 'desktop' }))}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  (previewStyles[item.id] || 'desktop') === 'desktop'
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
                            </div>
                          </div>
                          
                          {/* Desktop/Web Ad Style */}
                          {(previewStyles[item.id] || 'desktop') === 'desktop' && (
                            <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md">
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">Ad</span>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900 text-base mb-2 leading-tight">
                                      {item.ad_placement.headline}
                                    </h5>
                                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                      {item.ad_placement.body}
                                    </p>
                                    
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
                          )}

                          {/* Mobile/Social Style */}
                          {previewStyles[item.id] === 'mobile' && (
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
                                      {item.ad_placement.headline}
                                    </h6>
                                    <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                                      {item.ad_placement.body}
                                    </p>
                                    
                                    <button className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-xs hover:bg-blue-700 transition-colors">
                                      {item.ad_placement.cta}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Generated Timestamp */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Generated {formatDate(item.created_at)}</span>
                      </div>
                    </div>

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
      </div>
    </Layout>
  );
}