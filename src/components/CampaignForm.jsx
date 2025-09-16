import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { MultiSelect } from '../ui/MultiSelect';
import { Badge } from '../ui/Badge';
import { Plus, X, Save, Edit3 } from 'lucide-react';

const RSS_CATEGORIES = [
  'news',
  'entertainment', 
  'business',
  'sports',
  'politics',
  'technology',
  'health'
];

export function CampaignForm({ campaign, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    url: campaign?.url || '',
    tags: campaign?.tags || [],
    description: campaign?.description || '',
    rssCategories: campaign?.rssCategories || ['all']
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;
    
    onSave({
      ...campaign,
      ...formData,
      id: campaign?.id || Date.now(),
      updatedAt: new Date().toISOString()
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          {campaign ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Campaign Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter campaign name..."
            className="w-full"
            required
          />
        </div>

        {/* URL Field */}
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-medium text-gray-700">
            Campaign URL *
          </Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com"
            className="w-full"
            required
          />
        </div>

        {/* Tags Field */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Tags
          </Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addTag}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* RSS Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            RSS Feed Categories
          </Label>
          <MultiSelect
            options={RSS_CATEGORIES}
            value={formData.rssCategories}
            onChange={(categories) => setFormData(prev => ({ ...prev, rssCategories: categories }))}
            placeholder="Select categories..."
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your campaign..."
            rows={4}
            className="w-full resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {campaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}