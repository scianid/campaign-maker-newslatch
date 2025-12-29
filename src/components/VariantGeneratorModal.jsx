import React, { useState } from 'react';
import { X, Wand2, Loader2, Briefcase, Smile, Zap, Heart, Crown, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../lib/supabase';
import { handleEdgeFunctionError } from '../utils/creditUtils';

export function VariantGeneratorModal({ 
  isOpen, 
  onClose, 
  aiItem, 
  onVariantsGenerated 
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
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
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('🔑 Using access token for Edge Function call');

      // Use fetch directly to get proper error responses
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
            },
            current_image_url: aiItem.image_url
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Extract error message from response
        const errorMsg = result.message || result.error || 'Failed to generate variants';
        throw new Error(errorMsg);
      }

      console.log('✅ Variants generated:', result);
      
      // Refresh credits display
      if (typeof window.refreshUserCredits === 'function') {
        window.refreshUserCredits();
      }
      
      // Call the callback to refresh the parent component
      if (onVariantsGenerated) {
        onVariantsGenerated(result.variants);
      }

      onClose();

    } catch (error) {
      console.error('❌ Failed to generate variants:', error);
      const errorMessage = handleEdgeFunctionError(error, 'Failed to generate variants');
      setError(errorMessage);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg/80 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-highlight/10 border border-highlight/25 rounded-full flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-highlight" />
            </div>
            <h3 className="text-lg font-semibold text-white">Generate Variants</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-900/50 border border-red-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-red-400 mb-1">
                    {error.toLowerCase().includes('credit') ? 'Insufficient Credits' : 'Error'}
                  </h5>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 -mt-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Original Content Preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <h4 className="text-sm font-medium text-white/80 mb-2">Original Content</h4>
            <p className="text-xs text-white font-medium mb-1 line-clamp-2">
              {aiItem.headline}
            </p>
            <p className="text-xs text-white/60 line-clamp-2">
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
                  <Info className="w-4 h-4 text-white/50 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-primary-bg border border-white/10 rounded-2xl text-xs text-white/70 shadow-2xl z-10">
                    Choose how many alternative versions to generate. Each variant will test different angles of your message.
                  </div>
                </div>
              </div>
              <span className="text-2xl font-bold text-highlight">
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
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-with-notches"
                style={{
                  background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${((options.count - 2) / 3) * 100}%, rgba(255,255,255,0.12) ${((options.count - 2) / 3) * 100}%, rgba(255,255,255,0.12) 100%)`
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
                        ? 'text-highlight' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className={`w-1 h-3 rounded-full ${
                      options.count === count 
                        ? 'bg-highlight' 
                        : 'bg-white/20'
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
                <Info className="w-4 h-4 text-white/50 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-primary-bg border border-white/10 rounded-2xl text-xs text-white/70 shadow-2xl z-10">
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
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-highlight focus:ring-highlight/40 focus:ring-2"
                  />
                  <span className="text-white/80">{focus.label}</span>
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
                <Info className="w-4 h-4 text-white/50 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-primary-bg border border-white/10 rounded-2xl text-xs text-white/70 shadow-2xl z-10">
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
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToneToggle(tone.value)}
                    className={`text-xs flex items-center gap-1.5 ${
                      options.tones.includes(tone.value)
                        ? 'border-2 border-highlight/70 bg-highlight/15 text-highlight hover:bg-highlight/20 ring-1 ring-highlight/20 shadow-sm'
                        : 'border-2 border-transparent bg-transparent text-white/70 hover:text-white'
                    }`}
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
        <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10 bg-white/5">
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
            className="flex-1 bg-highlight text-primary-bg hover:bg-highlight/90 border border-highlight/30 font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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