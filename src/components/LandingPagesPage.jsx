import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, Eye, FileText, Trash2, RefreshCw, Plus, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Layout } from './Layout';
import { supabase } from '../lib/supabase';

export function LandingPagesPage({ user }) {
  const navigate = useNavigate();
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'inactive'
    search: '',
    sortBy: 'created_at', // 'created_at', 'title', 'view_count'
    sortOrder: 'desc' // 'desc', 'asc'
  });

  useEffect(() => {
    fetchLandingPages();
  }, [filters]);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('landing_pages')
        .select(`
          *,
          ai_generated_items (
            id,
            headline,
            clickbait,
            description,
            link,
            campaign_id,
            campaigns (
              id,
              name,
              url
            )
          )
        `);

      // Apply filters
      if (filters.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      setLandingPages(data || []);
    } catch (err) {
      console.error('Error fetching landing pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setLandingPages(prev => 
        prev.map(page => 
          page.id === id ? { ...page, is_active: !currentStatus } : page
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update page status');
    }
  };

  const handleDeleteClick = (page) => {
    setDeleteConfirm({ show: true, item: page });
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', deleteConfirm.item.id);

      if (error) throw error;

      // Update local state
      setLandingPages(prev => prev.filter(page => page.id !== deleteConfirm.item.id));
      setDeleteConfirm({ show: false, item: null });
    } catch (err) {
      console.error('Failed to delete landing page:', err);
      alert('Failed to delete landing page. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, item: null });
  };

  const toggleDetails = (pageId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPublicUrl = (slug) => {
    return `${window.location.origin}/page/${slug || 'undefined'}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-highlight animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your landing pages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="text-center py-12">
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading Landing Pages</h3>
            <p className="text-red-200 text-sm">{error}</p>
            <Button 
              onClick={fetchLandingPages}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-highlight" />
              Landing Pages
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your generated landing pages and track their performance
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/campaigns')}
            className="bg-highlight hover:bg-highlight/80 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search landing pages..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-highlight focus:outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-highlight focus:outline-none"
            >
              <option value="all">All Pages</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-highlight focus:outline-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="view_count-desc">Most Views</option>
              <option value="view_count-asc">Least Views</option>
            </select>
          </div>
        </div>

        {/* Landing Pages List */}
        {landingPages.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Landing Pages Yet</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.status !== 'all'
                ? 'No pages match your current filters'
                : 'Start by generating AI content, then create landing pages from your content items'
              }
            </p>
            <Button
              onClick={() => navigate('/campaigns')}
              className="bg-highlight hover:bg-highlight/80 text-black font-semibold"
            >
              Go to Campaigns
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {landingPages.map((page) => (
              <div
                key={page.id}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-600/50 transition-all duration-200"
              >
                {/* Main Content */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left Side - Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white line-clamp-2">
                          {page.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge
                            variant={page.is_active ? "default" : "secondary"}
                            className={page.is_active 
                              ? "bg-green-900/30 text-green-400 border-green-600/30" 
                              : "bg-gray-700/50 text-gray-300 border-gray-600/30"
                            }
                          >
                            {page.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(page.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {page.view_count} views
                        </div>
                        {page.ai_generated_items?.campaigns && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-600/30">
                              {page.ai_generated_items.campaigns.name}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Slug/URL */}
                      <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-1">Public URL:</p>
                            <code className="text-sm text-highlight break-all">
                              {getPublicUrl(page.slug)}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getPublicUrl(page.slug))}
                            className="text-gray-400 hover:text-white flex-shrink-0"
                            title="Copy URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Sections Preview */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetails(page.id)}
                        className="text-gray-400 hover:text-white transition-colors text-sm h-auto p-2 -ml-2"
                      >
                        <div className="flex items-center gap-2">
                          {expandedDetails[page.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>View Sections ({page.sections?.length || 0})</span>
                        </div>
                      </Button>

                      {expandedDetails[page.id] && page.sections && (
                        <div className="mt-3 space-y-2">
                          {page.sections.slice(0, 3).map((section, index) => (
                            <div key={index} className="bg-gray-700/20 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-white mb-1">
                                {section.subtitle || `Section ${index + 1}`}
                              </h5>
                              <p className="text-xs text-gray-400 line-clamp-2">
                                {section.paragraphs?.[0]?.substring(0, 150)}...
                              </p>
                            </div>
                          ))}
                          {page.sections.length > 3 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              +{page.sections.length - 3} more sections
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex lg:flex-col items-center gap-3">
                      <Toggle
                        checked={page.is_active}
                        onChange={(checked) => toggleActive(page.id, page.is_active)}
                        label={page.is_active ? 'Active' : 'Inactive'}
                        size="sm"
                        className="focus:ring-offset-gray-800"
                      />
                      
                      <div className="flex lg:flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = getPublicUrl(page.slug);
                            console.log('🔗 Opening public URL:', url);
                            console.log('📄 Page data:', page);
                            window.open(url, '_blank');
                          }}
                          className="h-10 w-10 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-all duration-200"
                          title="View Landing Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(page)}
                          className="h-10 w-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200"
                          title="Delete Landing Page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Delete Landing Page</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCancel}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete this landing page?
              </p>
              <p className="text-sm text-gray-400 mb-6">
                <strong>"{deleteConfirm.item?.title}"</strong>
                <br />
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
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