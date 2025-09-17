import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, TrendingUp, Zap, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { supabase } from '../lib/supabase';

export function AiContentViewer({ campaignId, campaignName }) {
  const [aiItems, setAiItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (campaignId) {
      fetchAiItems();
    }
  }, [campaignId]);

  const fetchAiItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/rss-feeds?campaignId=${campaignId}&action=ai-items`,
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

  if (loading) {
    return (
      <div className="bg-card-bg rounded-2xl border border-gray-600/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-600/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-bg rounded-2xl border border-red-600/50 p-6">
        <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading AI Content</h3>
        <p className="text-red-300">{error}</p>
        <Button onClick={fetchAiItems} className="mt-4" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-gray-600/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-highlight" />
            AI-Generated Content
          </h3>
          <p className="text-sm text-text-paragraph">
            {aiItems.length} items generated for {campaignName}
          </p>
        </div>
        <Button onClick={fetchAiItems} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {aiItems.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-300 mb-2">No AI Content Yet</h4>
          <p className="text-text-paragraph">
            Generate AI content by viewing RSS feeds for this campaign
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {aiItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-all ${
                item.is_published 
                  ? 'border-green-600/50 bg-green-900/10' 
                  : 'border-gray-600/50 bg-primary-bg/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg leading-tight mb-1">
                    {item.headline}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-text-paragraph">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Score: {item.relevance_score}/100
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.trend}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublished(item.id, item.is_published)}
                    className={`h-8 w-8 p-0 ${
                      item.is_published 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    title={item.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Clickbait */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-orange-400 mb-1">💡 Clickbait Hook</h5>
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
              <div className="mb-3">
                <h5 className="text-sm font-medium text-blue-400 mb-1">📋 Description</h5>
                <p className="text-sm text-text-paragraph">{item.description}</p>
              </div>

              {/* Tooltip */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-purple-400 mb-1">💬 Tooltip</h5>
                <p className="text-sm text-text-paragraph italic">{item.tooltip}</p>
              </div>

              {/* Ad Placement */}
              {item.ad_placement && (
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-green-400 mb-1">🎯 Ad Copy</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.ad_placement, `ad-${item.id}`)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                    >
                      {copiedId === `ad-${item.id}` ? 
                        <Check className="w-3 h-3 text-green-400" /> : 
                        <Copy className="w-3 h-3" />
                      }
                    </Button>
                  </div>
                  <p className="text-sm text-green-300 bg-green-900/20 p-3 rounded border-l-2 border-green-600">
                    {item.ad_placement}
                  </p>
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
                  <ExternalLink className="w-3 h-3" />
                  View Source Article
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}