import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../lib/supabase';

export function VariantGeneratorModal({ 
  isOpen, 
  onClose, 
  aiItem, 
  onVariantsGenerated 
}) {
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState({
    count: 3,
    vary_headline: true,
    vary_body: true,
    vary_cta: true,
    tones: ['professional', 'casual', 'urgent']
  });

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-ad-variants',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ai_item_id: aiItem.id,
            count: options.count,
            options: {
              vary_headline: options.vary_headline,
              vary_body: options.vary_body,
              vary_cta: options.vary_cta,
              tones: options.tones
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate variants');
      }

      console.log('✅ Variants generated:', result);
      
      // Call the callback to refresh the parent component
      if (onVariantsGenerated) {
        onVariantsGenerated(result.variants);
      }

      onClose();

    } catch (error) {
      console.error('❌ Failed to generate variants:', error);
      alert(`Failed to generate variants: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleToneToggle = (tone) => {
    setOptions(prev => ({
      ...prev,
      tones: prev.tones.includes(tone)
        ? prev.tones.filter(t => t !== tone)
        : [...prev.tones, tone]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-bg border border-gray-600 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Generate Variants</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Original Content Preview */}
          <div className="bg-gray-800/30 border border-gray-600/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Original Content</h4>
            <p className="text-xs text-white font-medium mb-1 line-clamp-2">
              {aiItem.headline}
            </p>
            <p className="text-xs text-gray-400 line-clamp-2">
              {aiItem.description}
            </p>
          </div>

          {/* Number of Variants */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Number of variants
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((count) => (
                <Button
                  key={count}
                  variant={options.count === count ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, count }))}
                  className="flex-1"
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Focus areas
            </label>
            <div className="space-y-2">
              {[
                { key: 'vary_headline', label: 'Different headlines' },
                { key: 'vary_body', label: 'Different body copy' },
                { key: 'vary_cta', label: 'Different CTAs' }
              ].map((focus) => (
                <label key={focus.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options[focus.key]}
                    onChange={(e) => 
                      setOptions(prev => ({ ...prev, [focus.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300">{focus.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tones */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Tones to explore
            </label>
            <div className="flex flex-wrap gap-2">
              {['professional', 'casual', 'urgent', 'friendly', 'authoritative'].map((tone) => (
                <Button
                  key={tone}
                  variant={options.tones.includes(tone) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleToneToggle(tone)}
                  className="text-xs"
                >
                  {tone}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-600">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerate}
            disabled={generating || options.tones.length === 0}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate {options.count} Variants
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}