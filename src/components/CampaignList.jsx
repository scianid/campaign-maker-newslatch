import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Edit3, Trash2, ExternalLink, Calendar, Tag, Globe } from 'lucide-react';
import { cn } from '../utils/cn';

export function CampaignList({ campaigns, onEdit, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
          <Globe className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No campaigns yet</h3>
        <p className="text-gray-500">Create your first campaign to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
        Your Campaigns ({campaigns.length})
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200",
              hoveredId === campaign.id && "transform -translate-y-1"
            )}
            onMouseEnter={() => setHoveredId(campaign.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-lg">
                  {campaign.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a 
                    href={campaign.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate transition-colors"
                  >
                    {campaign.url}
                  </a>
                </div>
              </div>
              
              <div className="flex gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(campaign)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(campaign.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {campaign.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {campaign.description}
              </p>
            )}

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {campaign.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{campaign.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* RSS Categories */}
            {campaign.rssCategories && campaign.rssCategories.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  RSS Categories
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.rssCategories.includes('all') ? (
                    <Badge className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      All Categories
                    </Badge>
                  ) : (
                    <>
                      {campaign.rssCategories.slice(0, 2).map((category, index) => (
                        <Badge key={index} className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          {category}
                        </Badge>
                      ))}
                      {campaign.rssCategories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.rssCategories.length - 2} more
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            {campaign.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-100">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}