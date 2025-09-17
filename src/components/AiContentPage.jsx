import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, TrendingUp, Zap, Eye, EyeOff, Copy, Check, ArrowLeft, ChevronLeft, ChevronRight, Filter, SortDesc, Star, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
  const [filters, setFilters] = useState({
    status: 'published', // 'all', 'published', 'unpublished'
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
        action: 'ai-items',
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: filters.status,
        scoreRange: filters.scoreRange,
        dateRange: filters.dateRange,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/rss-feeds?${params}`,
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

  const copyToClipboard = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-400" />
                AI Content
              </h1>
              {campaign && (
                <p className="text-text-paragraph">
                  {campaign.name} • {totalItems} items generated
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-card-bg border border-gray-600/50 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters & Sorting</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Publication Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All Content</option>
                <option value="published">📢 Published</option>
                <option value="unpublished">📝 Draft</option>
              </select>
            </div>

            {/* Score Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Relevance Score</label>
              <select
                value={filters.scoreRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, scoreRange: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All Scores</option>
                <option value="high">⭐ High (80-100)</option>
                <option value="medium">🔶 Medium (50-79)</option>
                <option value="low">📊 Low (0-49)</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Created</label>
              <select
                value={filters.dateRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, dateRange: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-highlight focus:border-highlight"
              >
                <option value="all">All Time</option>
                <option value="today">🕐 Today</option>
                <option value="week">📅 This Week</option>
                <option value="month">📆 This Month</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortBy: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-highlight focus:border-highlight"
              >
                <option value="created_at">🕒 Date Created</option>
                <option value="relevance_score">⭐ Relevance Score</option>
                <option value="trend">📈 Trend</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, sortOrder: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full bg-primary-bg border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-highlight focus:border-highlight"
              >
                <option value="desc">↓ Newest First</option>
                <option value="asc">↑ Oldest First</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-600/30">
            <span className="text-xs text-gray-400">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              // Skip default values
              if ((key === 'status' && value === 'published') || 
                  (key === 'sortOrder' && value === 'desc') || 
                  (key === 'sortBy' && value === 'created_at') ||
                  value === 'all') return null;
              
              const labels = {
                status: { unpublished: 'Draft' },
                scoreRange: { high: 'High Score', medium: 'Medium Score', low: 'Low Score' },
                dateRange: { today: 'Today', week: 'This Week', month: 'This Month' },
                sortBy: { relevance_score: 'By Score', trend: 'By Trend' },
                sortOrder: { asc: 'Oldest First' }
              };
              const label = labels[key]?.[value] || value;
              return (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className="text-xs bg-highlight/10 text-highlight border-highlight/30"
                >
                  {label}
                </Badge>
              );
            })}
            {/* Check if any non-default filters are active */}
            {(filters.status === 'published' && 
              filters.scoreRange === 'all' && 
              filters.dateRange === 'all' && 
              filters.sortBy === 'created_at' && 
              filters.sortOrder === 'desc') && (
              <span className="text-xs text-gray-500">Default filters (published content)</span>
            )}
          </div>
        </div>

        {/* Content */}
        {aiItems.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              {/* Check if any non-default filters are active */}
              {(filters.status !== 'published' || 
                filters.scoreRange !== 'all' || 
                filters.dateRange !== 'all' || 
                filters.sortBy !== 'created_at' || 
                filters.sortOrder !== 'desc') 
                ? 'No content matches your filters' 
                : 'No published AI content found'
              }
            </h2>
            <p className="text-text-paragraph mb-6">
              {(filters.status !== 'published' || 
                filters.scoreRange !== 'all' || 
                filters.dateRange !== 'all' || 
                filters.sortBy !== 'created_at' || 
                filters.sortOrder !== 'desc') 
                ? 'Try adjusting your filters or generate new AI content'
                : 'Generate AI content by viewing RSS feeds for this campaign'
              }
            </p>
            {/* Show clear filters button if non-default filters are active */}
            {(filters.status !== 'published' || 
              filters.scoreRange !== 'all' || 
              filters.dateRange !== 'all' || 
              filters.sortBy !== 'created_at' || 
              filters.sortOrder !== 'desc') && (
              <Button 
                onClick={() => {
                  setFilters({
                    status: 'published',
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
                        ? 'border-green-600/50 bg-green-900/10 shadow-green-900/20' 
                        : 'border-gray-600/50 hover:border-gray-500/50'
                    } hover:shadow-lg`}
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_published 
                          ? 'bg-green-900/30 text-green-400 border border-green-600/30' 
                          : 'bg-gray-800/50 text-gray-400 border border-gray-600/30'
                      }`}>
                        {item.is_published ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Draft
                          </>
                        )}
                      </div>
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pr-24">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-xl leading-tight mb-3">
                          {item.headline}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-text-paragraph">
                            <Clock className="w-4 h-4" />
                            {formatDate(item.created_at)}
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${scoreBadge.color}`}
                          >
                            {scoreBadge.icon} {item.relevance_score}/100 {scoreBadge.label}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs bg-purple-900/20 text-purple-400 border-purple-600/30">
                            📈 {item.trend}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(item.id, item.is_published)}
                          className={`h-9 w-9 p-0 transition-all ${
                            item.is_published 
                              ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' 
                              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                          }`}
                          title={item.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {item.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>

                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Clickbait */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-orange-400">💡 Clickbait Hook</h4>
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
                        <p className="text-orange-300 font-medium">{item.clickbait}</p>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-blue-400 mb-2">📋 Description</h4>
                        <p className="text-sm text-text-paragraph">{item.description}</p>
                      </div>

                      {/* Tooltip */}
                      <div>
                        <h4 className="text-sm font-medium text-purple-400 mb-2">💬 Tooltip</h4>
                        <p className="text-sm text-text-paragraph italic">{item.tooltip}</p>
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
                                  : `${item.ad_placement.headline}\n\n${item.ad_placement.body}\n\n${item.ad_placement.cta}`,
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
                          
                          {typeof item.ad_placement === 'string' ? (
                            <p className="text-sm text-green-300 bg-green-900/20 p-3 rounded border-l-2 border-green-600">
                              {item.ad_placement}
                            </p>
                          ) : (
                            <div className="bg-green-900/20 p-4 rounded border-l-2 border-green-600 space-y-3">
                              <div>
                                <h6 className="text-xs font-semibold text-green-400 mb-1">HEADLINE</h6>
                                <p className="text-sm font-medium text-green-300">{item.ad_placement.headline}</p>
                              </div>
                              <div>
                                <h6 className="text-xs font-semibold text-green-400 mb-1">BODY</h6>
                                <p className="text-sm text-green-300">{item.ad_placement.body}</p>
                              </div>
                              <div>
                                <h6 className="text-xs font-semibold text-green-400 mb-1">CALL TO ACTION</h6>
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
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Source Article
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-paragraph">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}