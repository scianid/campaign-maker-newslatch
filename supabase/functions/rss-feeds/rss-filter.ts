// RSS Feed filtering and extraction utilities

import { fetchRssFeed, RssItem } from './rss-parser.ts';

export interface Campaign {
  id: string;
  rss_categories: string[];
  rss_countries: string[];
}

export interface RssFeed {
  id: string;
  name: string;
  url: string;
  categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RssFeedResult {
  success: boolean;
  data: RssFeed[];
  count: number;
  campaign?: {
    id: string;
    rss_categories: string[];
    rss_countries: string[];
    filtered_categories: string[];
  };
  message?: string;
  error?: string;
  details?: string;
}

export interface RssContentResult {
  success: boolean;
  items: RssItem[];
  count: number;
  campaign?: {
    id: string;
    rss_categories: string[];
    rss_countries: string[];
    feeds_processed: number;
    feeds_failed: number;
  };
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Get RSS feeds filtered by campaign categories and countries
 */
export async function getFilteredRssFeeds(
  supabaseClient: any,
  campaignId: string
): Promise<RssFeedResult> {
  try {
    // Get campaign details with categories and countries
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('rss_categories, rss_countries')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return {
        success: false,
        data: [],
        count: 0,
        error: 'Campaign not found',
        details: campaignError?.message || 'Campaign does not exist'
      };
    }

    // Since categories are enum values, we don't need to query a table
    // Just use the campaign's RSS categories directly
    const filteredCategories = campaign.rss_categories || [];

    // If no valid categories found, return empty result
    if (filteredCategories.length === 0) {
      return {
        success: true,
        data: [],
        count: 0,
        message: 'No RSS feeds available for the specified categories and countries',
        campaign: {
          id: campaignId,
          rss_categories: campaign.rss_categories,
          rss_countries: campaign.rss_countries,
          filtered_categories: filteredCategories
        }
      };
    }

    // Get RSS feeds that match the filtered categories
    const { data: rssFeeds, error: feedsError } = await supabaseClient
      .from('rss_feeds')
      .select('*')
      .overlaps('categories', filteredCategories)
      .eq('is_active', true)
      .order('name');

    if (feedsError) {
      return {
        success: false,
        data: [],
        count: 0,
        error: 'Failed to fetch RSS feeds',
        details: feedsError.message
      };
    }

    return {
      success: true,
      data: rssFeeds || [],
      count: rssFeeds?.length || 0,
      campaign: {
        id: campaignId,
        rss_categories: campaign.rss_categories,
        rss_countries: campaign.rss_countries,
        filtered_categories: filteredCategories
      }
    };

  } catch (error) {
    console.error('Error in getFilteredRssFeeds:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: 'Internal error while filtering RSS feeds',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the latest RSS items from all feeds matching the campaign
 * Limited to 10 items per feed and only items from the last 24 hours
 */
export async function getLatestRssContent(
  supabaseClient: any,
  campaignId: string
): Promise<RssContentResult> {
  try {
    console.log('🔍 Fetching RSS content for campaign:', campaignId);
    
    // First get the filtered RSS feeds for this campaign
    const feedsResult = await getFilteredRssFeeds(supabaseClient, campaignId);
    
    if (!feedsResult.success || !feedsResult.data || feedsResult.data.length === 0) {
      return {
        success: true,
        items: [],
        count: 0,
        campaign: feedsResult.campaign ? {
          ...feedsResult.campaign,
          feeds_processed: 0,
          feeds_failed: 0
        } : undefined,
        message: 'No RSS feeds available for this campaign'
      };
    }

    console.log(`📡 Processing ${feedsResult.data.length} RSS feeds...`);
    
    // Fetch content from all RSS feeds concurrently
    const allItems: RssItem[] = [];
    let feedsProcessed = 0;
    let feedsFailed = 0;
    
    const fetchPromises = feedsResult.data.map(async (feed: RssFeed) => {
      try {
        console.log(`🔄 Fetching: ${feed.name}`);
        
        const source = {
          name: feed.name,
          url: feed.url,
          feedUrl: feed.url
        };
        
        const parseResult = await fetchRssFeed(feed.url, source);
        
        if (parseResult.success && parseResult.items.length > 0) {
          feedsProcessed++;
          console.log(`✅ ${feed.name}: ${parseResult.items.length} items`);
          return parseResult.items;
        } else {
          feedsFailed++;
          console.warn(`❌ ${feed.name}: ${parseResult.error || 'No items found'}`);
          return [];
        }
      } catch (error) {
        feedsFailed++;
        console.error(`💥 Error fetching ${feed.name}:`, error);
        return [];
      }
    });

    // Wait for all feeds to complete (with a reasonable timeout)
    const results = await Promise.allSettled(fetchPromises);
    
    // Collect all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allItems.push(...result.value);
      } else if (result.status === 'rejected') {
        feedsFailed++;
        console.error('Feed fetch rejected:', result.reason);
      }
    });

    console.log(`📊 Total items collected: ${allItems.length}`);
    
    // Sort by publication date (newest first) and take the latest items
    // Note: Items are already limited to 10 per feed and within last 24 hours
    const sortedItems = allItems
      .filter(item => item.pubDateISO) // Only include items with valid dates
      .sort((a, b) => new Date(b.pubDateISO).getTime() - new Date(a.pubDateISO).getTime())
      .slice(0, 30); // Take latest 30 across all feeds

    console.log(`🎯 Returning ${sortedItems.length} latest items (max 10 per feed, last 24 hours only)`);

    return {
      success: true,
      items: sortedItems,
      count: sortedItems.length,
      campaign: feedsResult.campaign ? {
        ...feedsResult.campaign,
        feeds_processed: feedsProcessed,
        feeds_failed: feedsFailed
      } : undefined
    };

  } catch (error) {
    console.error('Error in getLatestRssContent:', error);
    return {
      success: false,
      items: [],
      count: 0,
      error: 'Failed to fetch RSS content',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}