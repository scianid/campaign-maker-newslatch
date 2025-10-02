import { Check, X, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { CTAPreview } from './CTAPreview';

export function CTAConfigEditor({ 
  section, 
  sectionIndex, 
  editingField, 
  setEditingField,
  handleSaveCtaConfig,
  cancelEdit 
}) {
  const defaults = {
    simple: {
      type: 'simple',
      buttonText: 'Get Started',
      subtitleText: 'Join thousands of satisfied customers'
    },
    exclusive: {
      type: 'exclusive',
      buttonText: 'Get Access',
      badgeText: 'EXCLUSIVE OFFER',
      subtitleText: 'Unlock your exclusive access now'
    },
    urgency: {
      type: 'urgency',
      buttonText: 'Claim Now',
      badgeText: 'LIMITED TIME',
      subtitleText: "Don't miss out - offer ends soon"
    },
    testimonial: {
      type: 'testimonial',
      buttonText: 'Join Today',
      subtitleText: 'Join 10,000+ happy customers',
      testimonialQuote: 'This product changed my life!',
      testimonialAuthor: 'Sarah M., Verified Customer'
    },
    guarantee: {
      type: 'guarantee',
      buttonText: 'Try Risk-Free',
      guaranteeText: '30-Day Money-Back Guarantee',
      subtitleText: '100% satisfaction guaranteed'
    },
    discount: {
      type: 'discount',
      buttonText: 'Apply Discount',
      badgeText: 'SPECIAL DISCOUNT',
      discountCode: 'SAVE20',
      subtitleText: 'Use code at checkout for instant savings'
    }
  };

  return (
    <div>
      <div className="bg-gray-50 border-2 border-blue-600 rounded-lg p-6 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">CTA Configuration</h3>
        
        {/* CTA Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">CTA Type</label>
          <select
            value={editingField.value?.type || 'simple'}
            onChange={(e) => {
              const newType = e.target.value;
              const currentValues = editingField.value || {};
              const newDefaults = defaults[newType] || defaults.simple;
              
              setEditingField({
                ...editingField,
                value: {
                  ...newDefaults,
                  buttonText: currentValues.buttonText || newDefaults.buttonText,
                  subtitleText: currentValues.subtitleText || newDefaults.subtitleText
                }
              });
            }}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
          >
            <option value="simple">Simple Button</option>
            <option value="exclusive">Exclusive Opportunity</option>
            <option value="urgency">Urgency/Limited Time</option>
            <option value="testimonial">With Testimonial</option>
            <option value="guarantee">Money-Back Guarantee</option>
            <option value="discount">Apply Discount Code</option>
          </select>
        </div>

        {/* Button Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
          <Input
            value={editingField.value?.buttonText || ''}
            onChange={(e) => setEditingField({
              ...editingField,
              value: {
                ...editingField.value,
                buttonText: e.target.value
              }
            })}
            placeholder="e.g., Get Started, Visit Site, Learn More"
            className="border-2 border-gray-300 rounded-lg bg-white"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
            maxLength={15}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(editingField.value?.buttonText || '').length}/15 characters
          </div>
        </div>

        {/* Badge Text (for exclusive/urgency/discount types) */}
        {(editingField.value?.type === 'exclusive' || 
          editingField.value?.type === 'urgency' || 
          editingField.value?.type === 'discount') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
            <Input
              value={editingField.value?.badgeText || ''}
              onChange={(e) => setEditingField({
                ...editingField,
                value: {
                  ...editingField.value,
                  badgeText: e.target.value
                }
              })}
              placeholder="e.g., EXCLUSIVE OFFER, LIMITED TIME ONLY"
              className="border-2 border-gray-300 rounded-lg bg-white"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              maxLength={30}
            />
          </div>
        )}

        {/* Discount Code (for discount type) */}
        {editingField.value?.type === 'discount' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
            <Input
              value={editingField.value?.discountCode || ''}
              onChange={(e) => setEditingField({
                ...editingField,
                value: {
                  ...editingField.value,
                  discountCode: e.target.value.toUpperCase()
                }
              })}
              placeholder="e.g., SAVE20, WINTER25"
              className="border-2 border-gray-300 rounded-lg bg-white font-mono tracking-wider"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              maxLength={20}
            />
            <div className="text-xs text-gray-500 mt-1">
              {(editingField.value?.discountCode || '').length}/20 characters
            </div>
          </div>
        )}

        {/* Subtitle Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle Text</label>
          <Input
            value={editingField.value?.subtitleText || ''}
            onChange={(e) => setEditingField({
              ...editingField,
              value: {
                ...editingField.value,
                subtitleText: e.target.value
              }
            })}
            placeholder="e.g., Join thousands of satisfied customers"
            className="border-2 border-gray-300 rounded-lg bg-white"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
            maxLength={100}
          />
        </div>

        {/* Testimonial Quote (for testimonial type) */}
        {editingField.value?.type === 'testimonial' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial Quote</label>
            <Textarea
              value={editingField.value?.testimonialQuote || ''}
              onChange={(e) => setEditingField({
                ...editingField,
                value: {
                  ...editingField.value,
                  testimonialQuote: e.target.value
                }
              })}
              placeholder="e.g., This product changed my life!"
              className="border-2 border-gray-300 rounded-lg bg-white"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              rows={2}
              maxLength={150}
            />
          </div>
        )}

        {/* Testimonial Author (for testimonial type) */}
        {editingField.value?.type === 'testimonial' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
            <Input
              value={editingField.value?.testimonialAuthor || ''}
              onChange={(e) => setEditingField({
                ...editingField,
                value: {
                  ...editingField.value,
                  testimonialAuthor: e.target.value
                }
              })}
              placeholder="e.g., Sarah M., Verified Customer"
              className="border-2 border-gray-300 rounded-lg bg-white"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              maxLength={50}
            />
          </div>
        )}

        {/* Guarantee Text (for guarantee type) */}
        {editingField.value?.type === 'guarantee' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Guarantee Text</label>
            <Input
              value={editingField.value?.guaranteeText || ''}
              onChange={(e) => setEditingField({
                ...editingField,
                value: {
                  ...editingField.value,
                  guaranteeText: e.target.value
                }
              })}
              placeholder="e.g., 30-Day Money-Back Guarantee"
              className="border-2 border-gray-300 rounded-lg bg-white"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              maxLength={60}
            />
          </div>
        )}

        {/* Live Preview */}
        <div className="mt-6 pt-6 border-t border-gray-300">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Live Preview</h3>
          <CTAPreview config={editingField.value} isEditor={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-300">
          <Button
            size="sm"
            onClick={() => {
              handleSaveCtaConfig(sectionIndex, editingField.value);
              setEditingField(null);
            }}
            style={{ backgroundColor: '#2563eb', color: 'white' }}
            className="hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-1" />
            Save CTA
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={cancelEdit}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          {section.cta_config && (
            <Button
              size="sm"
              onClick={() => {
                cancelEdit();
                handleSaveCtaConfig(sectionIndex, null);
              }}
              style={{ backgroundColor: '#dc2626', color: 'white' }}
              className="shadow-lg hover:opacity-90 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove CTA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
