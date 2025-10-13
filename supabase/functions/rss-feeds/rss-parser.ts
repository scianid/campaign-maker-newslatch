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
 * Extract text content from XML tag using regex, handling CDATA sections
 */
function extractXmlTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*?(?:/>|>(.*?)<\/${tagName}>)`, 'is');
  const match = xml.match(regex);
  if (match && match[1] !== undefined) {
    let content = match[1].trim();
    
    // Handle CDATA sections
    content = content.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
    
    return content;
  }
  return '';
}

/**
 * Extract title with fallback logic
 */
function extractTitle(xml: string): string {
  // Try standard title first
  let title = extractXmlTag(xml, 'title');
  
  // If title is empty, try other possible fields
  if (!title) {
    title = extractXmlTag(xml, 'dc:title') ||
            extractXmlTag(xml, 'media:title') ||
            extractXmlTag(xml, 'itunes:title');
  }
  
  // If still empty, try to extract from link or description
  if (!title) {
    const link = extractXmlTag(xml, 'link');
    const guid = extractXmlTag(xml, 'guid');
    
    // Try to extract title from URL path
    if (link) {
      const urlParts = link.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.length > 0) {
        // Convert URL-style text to readable title
        title = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.(html?|php|aspx?)$/i, '')
          .replace(/^\d+[-_]?/, '') // Remove leading numbers
          .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      }
    } else if (guid) {
      const urlParts = guid.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.length > 0) {
        title = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.(html?|php|aspx?)$/i, '')
          .replace(/^\d+[-_]?/, '')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }
  
  return title || 'Untitled Article';
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
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Use regex to extract RSS items (both <item> and <entry> for Atom)
    const itemRegex = /<(?:item|entry)[^>]*?>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlContent)) !== null && items.length < 10) {
      const itemXml = match[1];
      
      try {
        // Extract title with improved logic
        const title = extractTitle(itemXml);
        
        // Extract link with CDATA handling
        const linkFromTag = extractXmlTag(itemXml, 'link');
        const linkFromAttr = extractLinkAttribute(itemXml);
        const link = linkFromTag || linkFromAttr || '';
        
        // Extract description with multiple fallbacks
        let description = extractXmlTag(itemXml, 'description') || 
                         extractXmlTag(itemXml, 'summary') || 
                         extractXmlTag(itemXml, 'content') ||
                         extractXmlTag(itemXml, 'content:encoded') ||
                         extractXmlTag(itemXml, 'media:description') ||
                         '';
        
        // If description is still empty, try to create one from title
        if (!description && title && title !== 'Untitled Article') {
          description = `Article: ${title}`;
        }
        
        const pubDateRaw = extractXmlTag(itemXml, 'pubDate') || 
                          extractXmlTag(itemXml, 'published') || 
                          extractXmlTag(itemXml, 'updated') || 
                          extractXmlTag(itemXml, 'dc:date') || '';
        
        // Parse and normalize date
        const pubDate = pubDateRaw;
        let pubDateISO = '';
        try {
          if (pubDateRaw) {
            const dateObj = new Date(pubDateRaw);
            if (!isNaN(dateObj.getTime())) {
              pubDateISO = dateObj.toISOString();
            } else {
              pubDateISO = new Date().toISOString();
            }
          } else {
            pubDateISO = new Date().toISOString();
          }
        } catch {
          pubDateISO = new Date().toISOString();
        }

        // Extract additional fields
        const guid = extractXmlTag(itemXml, 'guid') || extractXmlTag(itemXml, 'id') || '';
        const author = extractXmlTag(itemXml, 'author') || 
                      extractXmlTag(itemXml, 'dc:creator') || 
                      extractXmlTag(itemXml, 'managingEditor') ||
                      extractXmlTag(itemXml, 'itunes:author') || '';
        
        const content = extractXmlTag(itemXml, 'content:encoded') || 
                       extractXmlTag(itemXml, 'content') || 
                       description || '';
        
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

        // Only add items that have meaningful content and are within 24 hours
        const hasTitle = rssItem.title && rssItem.title !== 'Untitled Article';
        const hasDescription = rssItem.description && rssItem.description.trim().length > 0;
        const hasContent = rssItem.content && rssItem.content.trim().length > 0;
        const hasLink = rssItem.link && rssItem.link.trim().length > 0;
        
        // Check if the item is within the last 24 hours
        const itemDate = new Date(rssItem.pubDateISO);
        const isRecent = itemDate >= oneDayAgo;
        
        if ((hasTitle || hasDescription || hasContent || hasLink) && isRecent) {
          items.push(rssItem);
        } else if (!isRecent) {
          console.warn('Skipping RSS item older than 24 hours:', { 
            guid: rssItem.guid,
            pubDate: rssItem.pubDateISO,
            source: rssItem.source.name 
          });
        } else {
          console.warn('Skipping RSS item with no meaningful content:', { 
            guid: rssItem.guid, 
            source: rssItem.source.name 
          });
        }
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