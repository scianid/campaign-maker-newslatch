import { useState } from 'react';
import { ExternalLink, Calendar, User, Tag, X } from 'lucide-react';
import { Button } from './Button';

export function RssItemsModal({ isOpen, onClose, rssData, campaignName }) {
  if (!isOpen || !rssData) return null;

  const { items, count, campaign } = rssData;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">RSS Content</h2>
            <p className="text-sm text-gray-600">
              {count} latest items from {campaignName}
            </p>
            {campaign && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Feeds processed: {campaign.feeds_processed}</span>
                <span>Feeds failed: {campaign.feeds_failed}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
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
              <p className="text-gray-500">No RSS items found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Title and Source */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1 mr-4">
          {item.title}
        </h3>
        <div className="text-xs text-gray-500 text-right">
          <div className="font-medium">{item.source.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.pubDateISO || item.pubDate)}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Meta Information */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
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
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Read more
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}