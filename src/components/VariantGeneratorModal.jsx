import React, { useState } from 'react';
import { X, Wand2, Loader2, Briefcase, Smile, Zap, Heart, Crown, Info } from 'lucide-react';
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

      console.log('🔑 Using access token for Edge Function call');

      const { data, error } = await supabase.functions.invoke('generate-ad-variants', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          ai_item_id: aiItem.id,
          count: options.count,
          options: {
            vary_headline: options.vary_headline,
            vary_body: options.vary_body,
            vary_cta: options.vary_cta,
            tones: options.tones
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Variants generated:', data);
      
      // Call the callback to refresh the parent component
      if (onVariantsGenerated) {
        onVariantsGenerated(data.variants);
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-white">
                  Number of variants
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-gray-300 shadow-lg z-10">
                    Choose how many alternative versions to generate. Each variant will test different angles of your message.
                  </div>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {options.count}
              </span>
            </div>
            
            {/* Slider */}
            <div className="relative px-2">
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={options.count}
                onChange={(e) => setOptions(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-with-notches"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((options.count - 2) / 3) * 100}%, #374151 ${((options.count - 2) / 3) * 100}%, #374151 100%)`
                }}
              />
              
              {/* Notches */}
              <div className="flex justify-between mt-2 px-1">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setOptions(prev => ({ ...prev, count }))}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      options.count === count 
                        ? 'text-purple-400' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className={`w-1 h-3 rounded-full ${
                      options.count === count 
                        ? 'bg-purple-400' 
                        : 'bg-gray-600'
                    }`}></div>
                    <span className="text-xs font-medium">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* What to Regenerate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-white">
                What to regenerate
              </label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-gray-300 shadow-lg z-10">
                  Select which parts of the ad to vary. Uncheck elements you want to keep consistent across all variants.
                </div>
              </div>
            </div>
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
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-white">
                Tones to explore
              </label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-gray-300 shadow-lg z-10">
                  Select one or more tones to test. Each variant will use a different tone to appeal to different audience segments.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'professional', label: 'Professional', icon: Briefcase },
                { value: 'casual', label: 'Casual', icon: Smile },
                { value: 'urgent', label: 'Urgent', icon: Zap },
                { value: 'friendly', label: 'Friendly', icon: Heart },
                { value: 'authoritative', label: 'Authoritative', icon: Crown }
              ].map((tone) => {
                const Icon = tone.icon;
                return (
                  <Button
                    key={tone.value}
                    variant={options.tones.includes(tone.value) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleToneToggle(tone.value)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tone.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-600 bg-gray-800/30">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={generating}
            className="flex-shrink-0"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={generating || options.tones.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate {options.count} Variant{options.count > 1 ? 's' : ''}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}