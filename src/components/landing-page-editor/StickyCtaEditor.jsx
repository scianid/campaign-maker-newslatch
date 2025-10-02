import { Edit2, Check, X, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export function StickyCtaEditor({ 
  landingPage, 
  editingField,
  isEditing,
  startEdit,
  cancelEdit,
  setEditingField,
  handleSaveStickyCtaTitle,
  handleSaveStickyCtaSubtitle,
  handleSaveStickyCtaButton,
  handleToggleStickyCtaVisible
}) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Sticky Bottom CTA</h3>
        <Button
          size="sm"
          onClick={handleToggleStickyCtaVisible}
          variant={landingPage.sticky_cta_visible === false ? "outline" : "default"}
        >
          {landingPage.sticky_cta_visible === false ? 'Show' : 'Hide'} Sticky CTA
        </Button>
      </div>

      {/* Sticky CTA Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        {isEditing('sticky_cta_title') ? (
          <div className="flex gap-2">
            <Input
              value={editingField.value}
              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
              className="border-2 border-blue-600"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={() => {
                handleSaveStickyCtaTitle(editingField.value);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 rounded hover:bg-gray-50 cursor-pointer group flex items-center justify-between"
            onClick={() => startEdit('sticky_cta_title', null, null, landingPage.sticky_cta_title || 'Ready to Take Action?')}
          >
            <span className="text-gray-900">
              {landingPage.sticky_cta_title || 'Ready to Take Action?'}
            </span>
            <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Sticky CTA Subtitle */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
        {isEditing('sticky_cta_subtitle') ? (
          <div className="flex gap-2">
            <Input
              value={editingField.value}
              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
              className="border-2 border-blue-600"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={() => {
                handleSaveStickyCtaSubtitle(editingField.value);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 rounded hover:bg-gray-50 cursor-pointer group flex items-center justify-between"
            onClick={() => startEdit('sticky_cta_subtitle', null, null, landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more')}
          >
            <span className="text-gray-900">
              {landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more'}
            </span>
            <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Sticky CTA Button Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
        {isEditing('sticky_cta_button') ? (
          <div className="flex gap-2">
            <Input
              value={editingField.value}
              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
              className="border-2 border-blue-600"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={() => {
                handleSaveStickyCtaButton(editingField.value);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 rounded hover:bg-gray-50 cursor-pointer group flex items-center justify-between"
            onClick={() => startEdit('sticky_cta_button', null, null, landingPage.sticky_cta_button || 'Visit Site →')}
          >
            <span className="text-gray-900">
              {landingPage.sticky_cta_button || 'Visit Site →'}
            </span>
            <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  );
}
