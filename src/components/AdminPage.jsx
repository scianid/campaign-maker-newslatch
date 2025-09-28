import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { MultiSelect } from '../ui/MultiSelect';
import { LoadingModal } from '../ui/LoadingModal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  AlertCircle, 
  Users, 
  Rss, 
  Settings,
  Check,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('rss-feeds');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  // RSS Feeds state
  const [rssFeeds, setRssFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [feedForm, setFeedForm] = useState({
    name: '',
    url: '',
    categories: [],
    countries: [],
    is_active: true
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [updatingUsers, setUpdatingUsers] = useState(new Set());

  const categoryOptions = [
    { value: 'news', label: 'News' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'business', label: 'Business' },
    { value: 'sport', label: 'Sport' },
    { value: 'politics', label: 'Politics' },
    { value: 'technology', label: 'Technology' },
    { value: 'health', label: 'Health' }
  ];

  // Check if user is admin on component mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'rss-feeds') {
        loadRssFeeds();
      } else if (activeTab === 'users') {
        loadUsers();
      }
    }
  }, [activeTab, isAdmin]);

  const checkAdminStatus = async () => {
    try {
      setCheckingAdmin(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Call the admin-users function to get profile
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error checking admin status');
        setIsAdmin(false);
        return;
      }

      const result = await response.json();
      setIsAdmin(result?.data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadRssFeeds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-rss-feeds`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load RSS feeds');
      }

      const result = await response.json();
      setRssFeeds(result?.data || []);
    } catch (error) {
      console.error('Error loading RSS feeds:', error);
      setError('Failed to load RSS feeds');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const result = await response.json();
      setUsers(result?.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeed = async () => {
    try {
      setLoading(true);
      
      const method = editingFeed ? 'PUT' : 'POST';
      const url = editingFeed ? `?id=${editingFeed.id}` : '';
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-rss-feeds${url}`, {
        method,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save feed');
      }

      await loadRssFeeds();
      resetFeedForm();
    } catch (error) {
      console.error('Error saving feed:', error);
      setError('Failed to save RSS feed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (!confirm('Are you sure you want to delete this RSS feed?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-rss-feeds?id=${feedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete feed');
      }

      await loadRssFeeds();
    } catch (error) {
      console.error('Error deleting feed:', error);
      setError('Failed to delete RSS feed');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFeed = (feed) => {
    setEditingFeed(feed);
    setFeedForm({
      name: feed.name,
      url: feed.url,
      categories: feed.categories || [],
      countries: feed.countries || [],
      is_active: feed.is_active
    });
    setShowAddFeed(true);
  };

  const resetFeedForm = () => {
    setEditingFeed(null);
    setShowAddFeed(false);
    setFeedForm({
      name: '',
      url: '',
      categories: [],
      countries: [],
      is_active: true
    });
  };

  const handleToggleUserAdmin = async (userId, currentStatus) => {
    try {
      setUpdatingUsers(prev => new Set([...prev, userId]));
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-users?user_id=${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_admin: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user admin status:', error);
      setError('Failed to update user admin status');
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (checkingAdmin) {
    return <LoadingModal message="Checking admin permissions..." />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center p-6">
        <div className="bg-card-bg rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You need admin permissions to access this page.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage RSS feeds and user permissions</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-card-bg rounded-lg mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('rss-feeds')}
              className={cn(
                'px-6 py-4 font-medium transition-colors flex items-center gap-2',
                activeTab === 'rss-feeds'
                  ? 'text-highlight border-b-2 border-highlight'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Rss className="h-5 w-5" />
              RSS Feeds
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'px-6 py-4 font-medium transition-colors flex items-center gap-2',
                activeTab === 'users'
                  ? 'text-highlight border-b-2 border-highlight'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Users className="h-5 w-5" />
              Users
            </button>
          </div>
        </div>

        {/* RSS Feeds Tab */}
        {activeTab === 'rss-feeds' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">RSS Feeds Management</h2>
              <Button onClick={() => setShowAddFeed(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add RSS Feed
              </Button>
            </div>

            {/* RSS Feeds List */}
            <div className="grid gap-4">
              {rssFeeds.map((feed) => (
                <div key={feed.id} className="bg-card-bg rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{feed.name}</h3>
                        <Badge variant={feed.is_active ? 'default' : 'outline'}>
                          {feed.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-400 mb-3 break-all">{feed.url}</p>
                      <div className="flex flex-wrap gap-2">
                        {feed.categories?.map((category) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFeed(feed)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFeed(feed.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit Feed Modal */}
            {showAddFeed && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50">
                <div className="bg-card-bg rounded-lg max-w-2xl w-full h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h3 className="text-xl font-semibold text-white">
                      {editingFeed ? 'Edit RSS Feed' : 'Add RSS Feed'}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={resetFeedForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                    <div>
                      <Label htmlFor="feedName">Feed Name</Label>
                      <Input
                        id="feedName"
                        value={feedForm.name}
                        onChange={(e) => setFeedForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter feed name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="feedUrl">Feed URL</Label>
                      <Input
                        id="feedUrl"
                        value={feedForm.url}
                        onChange={(e) => setFeedForm(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com/feed.xml"
                      />
                    </div>

                    <div className="mb-6">
                      <Label className="block mb-3">Categories</Label>
                      <div className="grid grid-cols-2 gap-3 p-4 border border-gray-600 rounded-lg bg-gray-800/30">
                        {categoryOptions.map((category) => (
                          <label
                            key={category.value}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/30 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={feedForm.categories.includes(category.value)}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...feedForm.categories, category.value]
                                  : feedForm.categories.filter(cat => cat !== category.value);
                                setFeedForm(prev => ({ ...prev, categories: newCategories }));
                              }}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-highlight focus:ring-highlight focus:ring-1"
                            />
                            <span className="text-white text-sm">{category.label}</span>
                          </label>
                        ))}
                      </div>
                      {feedForm.categories.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          Selected: {feedForm.categories.map(cat => 
                            categoryOptions.find(opt => opt.value === cat)?.label
                          ).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <Label className="block mb-3">Countries</Label>
                      <div className="grid grid-cols-3 gap-3 p-4 border border-gray-600 rounded-lg bg-gray-800/30">
                        {[
                          { value: 'US', label: 'United States' },
                          { value: 'DE', label: 'Germany' },
                          { value: 'GB', label: 'United Kingdom' }
                        ].map((country) => (
                          <label
                            key={country.value}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/30 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={feedForm.countries?.includes(country.value) || false}
                              onChange={(e) => {
                                const currentCountries = feedForm.countries || [];
                                const newCountries = e.target.checked
                                  ? [...currentCountries, country.value]
                                  : currentCountries.filter(c => c !== country.value);
                                setFeedForm(prev => ({ ...prev, countries: newCountries }));
                              }}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-highlight focus:ring-highlight focus:ring-1"
                            />
                            <span className="text-white text-sm">{country.label}</span>
                          </label>
                        ))}
                      </div>
                      {feedForm.countries && feedForm.countries.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          Selected: {feedForm.countries.map(code => {
                            const country = [
                              { value: 'US', label: 'United States' },
                              { value: 'DE', label: 'Germany' },
                              { value: 'GB', label: 'United Kingdom' }
                            ].find(c => c.value === code);
                            return country?.label;
                          }).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={feedForm.is_active}
                        onChange={(e) => setFeedForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-700 p-6">
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetFeedForm}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveFeed} disabled={loading}>
                        {loading ? 'Saving...' : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Users Management</h2>

            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-card-bg rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {user.full_name || user.email}
                        </h3>
                        {user.is_admin && (
                          <Badge className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant={user.is_admin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleUserAdmin(user.id, user.is_admin)}
                        disabled={updatingUsers.has(user.id)}
                        className="flex items-center gap-2"
                      >
                        {updatingUsers.has(user.id) ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <LoadingModal message="Processing..." />}
      </div>
    </div>
  );
}