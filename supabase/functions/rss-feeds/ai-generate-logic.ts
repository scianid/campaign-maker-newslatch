// Shared AI generation logic that can be called from multiple edge functions
import { getLatestRssContent } from './rss-filter.ts';
import { buildPrompt2, runGpt } from './ai.ts';
import { extractImagesForNewsItems } from './image-extractor.ts';

export interface AIGenerateResult {
  success: boolean;
  message?: string;
  items_generated?: number;
  items_with_images?: number;
  campaign_id?: string;
  ai_analysis?: any;
  saved_items?: any[];
  error?: string;
  details?: string;
}

/**
 * Generate AI content for a campaign
 * @param supabaseClient - Supabase client with appropriate permissions
 * @param campaignId - Campaign ID to generate content for
 * @param userId - User ID for credit deduction
 * @returns AIGenerateResult with generation results
 */
export async function generateAIContent(
  supabaseClient: any,
  campaignId: string,
  userId: string
): Promise<AIGenerateResult> {
  try {
    console.log('🤖 Starting AI content generation for campaign:', campaignId);

    // Fetch RSS content for the campaign
    const rssResult = await getLatestRssContent(supabaseClient, campaignId);
    
    if (!rssResult.success) {
      return {
        success: false,
        error: rssResult.error,
        details: rssResult.details
      };
    }

    // Prepare data for AI analysis
    const news = (rssResult.items || []).map(item => ({ 
      headline: item.title, 
      link: item.link,
      imageUrl: item.imageUrl
    }));
    const tags = rssResult.campaign?.rss_categories || [];
    
    // Get campaign details for better AI context
    const { data: campaignDetails } = await supabaseClient
      .from('campaigns')
      .select('name, description, url, tags, product_description, target_audience, rss_countries')
      .eq('id', campaignId)
      .single();
    
    const campaignInfo = campaignDetails || {
      name: 'Unknown Campaign',
      description: '',
      url: '',
      tags: [],
      product_description: '',
      target_audience: '',
      rss_countries: ['US']
    };
    
    console.log('🎯 AI Analysis Input:', {
      newsCount: news.length,
      rssCategories: tags.length,
      campaignName: campaignInfo.name
    });
    
    // Validate we have enough data for AI analysis
    if (news.length === 0) {
      return {
        success: false,
        error: 'No RSS content found',
        details: 'No RSS items found for this campaign. Please ensure RSS feeds are configured and contain recent content.'
      };
    }
    
    if (tags.length === 0) {
      return {
        success: false,
        error: 'No RSS categories configured',
        details: 'Please configure RSS categories for this campaign before generating AI content.'
      };
    }

    // Extract images from news articles
    console.log('🖼️ Extracting images from news articles...');
    const newsWithImages = await extractImagesForNewsItems(news);
    console.log('✅ Image extraction completed');

    // Run AI analysis
    console.log('🤖 Running AI analysis...');
    const prompt = buildPrompt2(news, tags, campaignInfo);
    const gptResponse = await runGpt(prompt, supabaseClient, userId);
    
    const aiResults = JSON.parse(gptResponse);
    console.log('✅ AI Analysis completed successfully');
    
    // Save AI-generated items to database
    if (aiResults.results && aiResults.results.length > 0) {
      console.log('💾 Saving AI items to database...');
      
      // Create a map of link to extracted image URL for quick lookup
      const imageMap = new Map(
        newsWithImages.map(item => [item.link, item.extractedImageUrl])
      );
      
      const aiItemsToSave = aiResults.results.map((item: any) => ({
        campaign_id: campaignId,
        headline: item.headline,
        clickbait: item.clickbait,
        link: item.link,
        relevance_score: item.relevance_score,
        tags: item.tags ? item.tags : [],
        keywords: item.keywords ? item.keywords : [],
        trend: item.trend,
        description: item.description,
        tooltip: item.tooltip,
        ad_placement: item.ad_placement || null,
        image_url: imageMap.get(item.link) || null,
        original_image_url: imageMap.get(item.link) || null,
        image_prompt: item.image_prompt || null,
        is_published: false // Default to unpublished
      }));
      
      const { data: savedItems, error: saveError } = await supabaseClient
        .from('ai_generated_items')
        .insert(aiItemsToSave)
        .select();
      
      if (saveError) {
        console.error('❌ Failed to save AI items:', saveError);
        return {
          success: false,
          error: 'Failed to save AI content',
          details: saveError.message
        };
      }
      
      console.log('✅ Saved AI items to database:', savedItems?.length || 0);
      
      // Count items with images
      const itemsWithImages = savedItems?.filter((item: any) => item.image_url).length || 0;
      
      return {
        success: true,
        message: 'AI content generated successfully',
        items_generated: savedItems?.length || 0,
        items_with_images: itemsWithImages,
        campaign_id: campaignId,
        ai_analysis: aiResults,
        saved_items: savedItems || []
      };
    } else {
      return {
        success: false,
        error: 'No AI content generated',
        details: 'AI analysis completed but no relevant content was generated. Try adjusting your RSS categories or feeds.'
      };
    }
    
  } catch (error) {
    console.error('❌ AI generation error:', error);
    return {
      success: false,
      error: 'AI generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
