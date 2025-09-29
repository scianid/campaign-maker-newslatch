// Image extraction utilities for social media and Open Graph images

export interface ImageExtractionResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  source?: 'og:image' | 'twitter:image' | 'meta' | 'rss' | 'fallback';
}

/**
 * Extract social media image from HTML content
 */
function extractImageFromHtml(html: string): ImageExtractionResult {
  try {
    // Clean up the HTML to make regex matching more reliable
    const cleanHtml = html.replace(/\s+/g, ' ').toLowerCase();
    
    // Try Open Graph image first (most reliable for social sharing)
    let match = cleanHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/);
    if (match && match[1]) {
      return {
        success: true,
        imageUrl: match[1],
        source: 'og:image'
      };
    }
    
    // Try alternative Open Graph format
    match = cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/);
    if (match && match[1]) {
      return {
        success: true,
        imageUrl: match[1],
        source: 'og:image'
      };
    }
    
    // Try Twitter Card image
    match = cleanHtml.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/);
    if (match && match[1]) {
      return {
        success: true,
        imageUrl: match[1],
        source: 'twitter:image'
      };
    }
    
    // Try alternative Twitter format
    match = cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/);
    if (match && match[1]) {
      return {
        success: true,
        imageUrl: match[1],
        source: 'twitter:image'
      };
    }
    
    // Try generic meta image
    match = cleanHtml.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/);
    if (match && match[1]) {
      return {
        success: true,
        imageUrl: match[1],
        source: 'meta'
      };
    }
    
    // Try to find any image in the article content (first img tag)
    match = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (match && match[1]) {
      const imgSrc = match[1];
      // Only use if it looks like a real content image (not tiny icons)
      if (!imgSrc.includes('icon') && !imgSrc.includes('logo') && !imgSrc.includes('sprite')) {
        return {
          success: true,
          imageUrl: imgSrc,
          source: 'fallback'
        };
      }
    }
    
    return {
      success: false,
      error: 'No suitable image found in HTML content'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown HTML parsing error'
    };
  }
}

/**
 * Make URL absolute if it's relative
 */
function makeAbsoluteUrl(imageUrl: string, baseUrl: string): string {
  try {
    // If already absolute, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If protocol-relative, add https
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    
    // If relative, combine with base URL
    const base = new URL(baseUrl);
    if (imageUrl.startsWith('/')) {
      return `${base.protocol}//${base.host}${imageUrl}`;
    } else {
      return `${base.protocol}//${base.host}/${imageUrl}`;
    }
  } catch (error) {
    console.warn('Error making URL absolute:', error);
    return imageUrl; // Return original if URL parsing fails
  }
}

/**
 * Validate image URL by checking if it's accessible and is actually an image
 */
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'NewsLatch Image Validator 1.0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
    
  } catch (error) {
    console.warn('Image validation failed:', error);
    return false; // Assume invalid if we can't check
  }
}

/**
 * Extract social media image from a news article URL
 */
export async function extractSocialImage(articleUrl: string, rssImageUrl?: string): Promise<ImageExtractionResult> {
  try {
    console.log(`🖼️ Extracting image from: ${articleUrl}`);
    
    // If we already have an image from RSS, validate and use it
    if (rssImageUrl && rssImageUrl.trim()) {
      const absoluteRssImage = makeAbsoluteUrl(rssImageUrl.trim(), articleUrl);
      const isValid = await validateImageUrl(absoluteRssImage);
      if (isValid) {
        console.log(`✅ Using RSS image: ${absoluteRssImage}`);
        return {
          success: true,
          imageUrl: absoluteRssImage,
          source: 'rss'
        };
      }
    }
    
    // Fetch the article HTML
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'NewsLatch Social Image Extractor 1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const html = await response.text();
    console.log(`📄 Fetched HTML content (${html.length} chars)`);
    
    // Extract image from HTML
    const extractionResult = extractImageFromHtml(html);
    
    if (extractionResult.success && extractionResult.imageUrl) {
      // Make URL absolute
      const absoluteUrl = makeAbsoluteUrl(extractionResult.imageUrl, articleUrl);
      
      // Validate the image
      const isValid = await validateImageUrl(absoluteUrl);
      if (isValid) {
        console.log(`✅ Extracted ${extractionResult.source} image: ${absoluteUrl}`);
        return {
          ...extractionResult,
          imageUrl: absoluteUrl
        };
      } else {
        console.warn(`❌ Image validation failed: ${absoluteUrl}`);
        return {
          success: false,
          error: 'Extracted image URL is not accessible or not a valid image'
        };
      }
    }
    
    return extractionResult;
    
  } catch (error) {
    console.error('Error extracting social image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown image extraction error'
    };
  }
}

/**
 * Extract images for multiple news items concurrently with rate limiting
 */
export async function extractImagesForNewsItems(
  newsItems: Array<{ headline: string; link: string; imageUrl?: string }>
): Promise<Array<{ headline: string; link: string; imageUrl?: string; extractedImageUrl?: string }>> {
  console.log(`🖼️ Starting image extraction for ${newsItems.length} items`);
  
  // Process items in batches to avoid overwhelming servers
  const batchSize = 3;
  const results: Array<{ headline: string; link: string; imageUrl?: string; extractedImageUrl?: string }> = [];
  
  for (let i = 0; i < newsItems.length; i += batchSize) {
    const batch = newsItems.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newsItems.length / batchSize)}`);
    
    const batchPromises = batch.map(async (item) => {
      try {
        const extractionResult = await extractSocialImage(item.link, item.imageUrl);
        
        return {
          ...item,
          extractedImageUrl: extractionResult.success ? extractionResult.imageUrl : undefined
        };
      } catch (error) {
        console.warn(`Failed to extract image for ${item.headline}:`, error);
        return {
          ...item,
          extractedImageUrl: undefined
        };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Batch item failed:', result.reason);
      }
    });
    
    // Add delay between batches to be respectful
    if (i + batchSize < newsItems.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  const successCount = results.filter(r => r.extractedImageUrl).length;
  console.log(`✅ Image extraction completed: ${successCount}/${results.length} items have images`);
  
  return results;
}