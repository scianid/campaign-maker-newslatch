import { useState } from 'react';
import { ExternalLink, Calendar, User, Tag, X } from 'lucide-react';
import { Button } from './Button';

export function RssItemsModal({ isOpen, onClose, rssData, campaignName }) {
  if (!isOpen || !rssData) return null;

  const { items, count, campaign } = rssData;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-primary-bg/95 backdrop-blur-sm flex items-center justify-center z-[9999]" style={{ margin: 0, padding: 0 }}>
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
          <div>
            <h2 className="text-xl font-bold text-white">RSS Content</h2>
            <p className="text-sm text-text-paragraph">
              {count} latest items from {campaignName}
            </p>
            {campaign && (
              <div className="flex items-center gap-4 mt-2 text-xs text-text-paragraph">
                <span>Feeds processed: {campaign.feeds_processed}</span>
                <span>Feeds failed: {campaign.feeds_failed}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-primary-bg text-text-paragraph hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items && items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, index) => (
                <RssItemCard key={index} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No RSS items found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function RssItemCard({ item }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  // Determine display title
  const displayTitle = item.title || 'Untitled Article';
  
  // Determine display description
  const displayDescription = item.description || 
                            item.content || 
                            (item.link ? `Link: ${item.link}` : '') ||
                            'No description available';

  return (
    <div className="border border-gray-600/50 rounded-lg p-4 hover:shadow-md hover:shadow-black/40 transition-shadow bg-card-bg">
      {/* Title and Source */}
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-semibold text-lg leading-tight flex-1 mr-4 ${
          item.title ? 'text-white' : 'text-text-paragraph italic'
        }`}>
          {displayTitle}
        </h3>
        <div className="text-xs text-text-paragraph text-right">
          <div className="font-medium">{item.source.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.pubDateISO || item.pubDate)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm mb-3 line-clamp-2 ${
        item.description ? 'text-text-paragraph' : 'text-text-paragraph italic'
      }`}>
        {displayDescription}
      </p>

      {/* Meta Information */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-text-paragraph">
          {item.author && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.author}
            </div>
          )}
          {item.categories && item.categories.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {item.categories.slice(0, 2).join(', ')}
              {item.categories.length > 2 && ' +' + (item.categories.length - 2)}
            </div>
          )}
        </div>

        {/* Link */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-highlight hover:text-highlight/80 text-sm font-medium"
          >
            Read more
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}