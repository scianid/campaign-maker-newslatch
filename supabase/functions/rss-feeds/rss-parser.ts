// RSS parsing and content extraction utilities

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  pubDateISO: string;
  source: {
    name: string;
    url: string;
    feedUrl: string;
  };
  categories: string[];
  guid?: string;
  author?: string;
  content?: string;
  imageUrl?: string;
}

export interface RssParseResult {
  success: boolean;
  items: RssItem[];
  error?: string;
  source?: {
    name: string;
    url: string;
    feedUrl: string;
  };
}

/**
 * Extract text content from XML tag using regex
 */
function extractXmlTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*?(?:/>|>(.*?)<\/${tagName}>)`, 'is');
  const match = xml.match(regex);
  if (match && match[1] !== undefined) {
    return match[1].trim();
  }
  return '';
}

/**
 * Extract link attribute from Atom-style link tag
 */
function extractLinkAttribute(xml: string): string {
  const regex = /<link[^>]*href=["']([^"']*?)["'][^>]*?>/i;
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Extract image URL from various sources
 */
function extractImageUrl(xml: string): string {
  // Try enclosure with image type
  let regex = /<enclosure[^>]*type=["'][^"']*image[^"']*["'][^>]*url=["']([^"']*?)["'][^>]*?>/i;
  let match = xml.match(regex);
  if (match) return match[1];
  
  // Try media:content
  regex = /<media:content[^>]*url=["']([^"']*?)["'][^>]*?>/i;
  match = xml.match(regex);
  if (match) return match[1];
  
  return '';
}

/**
 * Extract categories from XML
 */
function extractCategories(xml: string): string[] {
  const categories: string[] = [];
  const regex = /<category[^>]*?>(.*?)<\/category>/gi;
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    const category = match[1].trim();
    if (category) {
      categories.push(category);
    }
  }
  
  return categories;
}

/**
 * Parse RSS XML content and extract items using regex-based parsing
 */
export function parseRssXml(xmlContent: string, source: { name: string; url: string; feedUrl: string }): RssParseResult {
  try {
    const items: RssItem[] = [];
    
    // Use regex to extract RSS items (both <item> and <entry> for Atom)
    const itemRegex = /<(?:item|entry)[^>]*?>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlContent)) !== null && items.length < 50) {
      const itemXml = match[1];
      
      try {
        // Extract fields using regex
        const title = extractXmlTag(itemXml, 'title') || 'No title';
        const linkFromTag = extractXmlTag(itemXml, 'link');
        const linkFromAttr = extractLinkAttribute(itemXml);
        const link = linkFromTag || linkFromAttr || '';
        
        const description = extractXmlTag(itemXml, 'description') || 
                          extractXmlTag(itemXml, 'summary') || 
                          extractXmlTag(itemXml, 'content') || '';
        
        const pubDateRaw = extractXmlTag(itemXml, 'pubDate') || 
                          extractXmlTag(itemXml, 'published') || 
                          extractXmlTag(itemXml, 'updated') || '';
        
        // Parse and normalize date
        const pubDate = pubDateRaw;
        let pubDateISO = '';
        try {
          const dateObj = new Date(pubDateRaw);
          if (!isNaN(dateObj.getTime())) {
            pubDateISO = dateObj.toISOString();
          } else {
            pubDateISO = new Date().toISOString(); // Fallback to current time
          }
        } catch {
          pubDateISO = new Date().toISOString();
        }

        // Extract additional fields
        const guid = extractXmlTag(itemXml, 'guid') || extractXmlTag(itemXml, 'id') || '';
        const author = extractXmlTag(itemXml, 'author') || extractXmlTag(itemXml, 'dc:creator') || '';
        const content = extractXmlTag(itemXml, 'content:encoded') || extractXmlTag(itemXml, 'content') || '';
        
        // Extract image URL
        const imageUrl = extractImageUrl(itemXml);
        
        // Extract categories
        const categories = extractCategories(itemXml);

        const rssItem: RssItem = {
          title: cleanText(title),
          link: link.trim(),
          description: cleanText(description),
          pubDate,
          pubDateISO,
          source,
          categories,
          guid,
          author: cleanText(author),
          content: cleanText(content),
          imageUrl: imageUrl.trim()
        };

        items.push(rssItem);
      } catch (error) {
        console.warn('Error parsing RSS item:', error);
        // Continue with other items
      }
    }

    return {
      success: true,
      items,
      source
    };

  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      source
    };
  }
}

/**
 * Fetch and parse RSS feed from URL
 */
export async function fetchRssFeed(feedUrl: string, source: { name: string; url: string; feedUrl: string }): Promise<RssParseResult> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'NewsLatch RSS Reader 1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        items: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        source
      };
    }

    const xmlContent = await response.text();
    return parseRssXml(xmlContent, source);

  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Network error',
      source
    };
  }
}

/**
 * Clean and truncate text content
 */
function cleanText(text: string, maxLength: number = 500): string {
  if (!text) return '';
  
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}