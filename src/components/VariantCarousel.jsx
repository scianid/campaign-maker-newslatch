import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, ImageIcon, Wand2, Loader2, TrendingUp, Monitor, Smartphone, Clipboard, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';
import { Label } from '../ui/Label';
import { supabase } from '../lib/supabase';

export function VariantCarousel({ 
  aiItem, 
  onImageGalleryOpen, 
  onVariantUpdate,
  onVariantDelete,
  onGenerateClick
}) {
  const [variants, setVariants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });
  const [previewStyle, setPreviewStyle] = useState('banner');
  const [copiedFields, setCopiedFields] = useState({});

  useEffect(() => {
    if (aiItem?.id) {
      fetchVariants();
    }
  }, [aiItem?.id]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use hardcoded functions URL
      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ad-variants?ai_item_id=${aiItem.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setVariants(result.variants || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch variants:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentVariant = variants[currentIndex];
  const totalVariants = variants.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalVariants) % totalVariants);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalVariants);
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  const toggleFavorite = async () => {
    if (!currentVariant || updatingFavorite) return;

    try {
      setUpdatingFavorite(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ad-variants/${currentVariant.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_favorite: !currentVariant.is_favorite
          })
        }
      );

      if (response.ok) {
        setVariants(prev => prev.map(v => 
          v.id === currentVariant.id 
            ? { ...v, is_favorite: !v.is_favorite }
            : v
        ));
        
        if (onVariantUpdate) {
          onVariantUpdate();
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle favorite:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setUpdatingFavorite(false);
    }
  };

  const handleDelete = async () => {
    if (!currentVariant) return;

    setShowDeleteConfirm(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ad-variants/${currentVariant.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const newVariants = variants.filter(v => v.id !== currentVariant.id);
        setVariants(newVariants);
        
        // Adjust current index if needed
        if (currentIndex >= newVariants.length) {
          setCurrentIndex(Math.max(0, newVariants.length - 1));
        }
        
        if (onVariantDelete) {
          onVariantDelete();
        }

        setToast({ 
          isOpen: true, 
          message: 'Variant deleted successfully', 
          type: 'success' 
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to delete variant:', response.status, errorText);
        setToast({ 
          isOpen: true, 
          message: 'Failed to delete variant. Please try again.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Failed to delete variant:', error);
      setToast({ 
        isOpen: true, 
        message: 'Failed to delete variant. Please try again.', 
        type: 'error' 
      });
    }
  };

  const generateImage = async () => {
    if (!currentVariant || generatingImage) return;

    try {
      setGeneratingImage(true);
      const { data: { session } } = await supabase.auth.getSession();

      // Use the existing generate-content-image endpoint but with variant's image_prompt
      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-content-image',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content_id: aiItem.id,
            custom_prompt: currentVariant.image_prompt // Use variant's specific prompt
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }

      // Update the variant with the new image
      const updateResponse = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ad-variants/${currentVariant.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_url: result.image_url
          })
        }
      );

      if (updateResponse.ok) {
        setVariants(prev => prev.map(v => 
          v.id === currentVariant.id 
            ? { ...v, image_url: result.image_url }
            : v
        ));
      }

    } catch (error) {
      console.error('Failed to generate image:', error);
      setToast({ 
        isOpen: true, 
        message: `Failed to generate image: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card-bg/60 border border-white/10 rounded-3xl p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-white/60" />
          <span className="ml-2 text-white/60">Loading variants...</span>
        </div>
      </div>
    );
  }

  if (totalVariants === 0) {
    return (
      <div className="bg-card-bg/60 border border-white/10 rounded-3xl p-8">
        <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <Wand2 className="w-10 h-10 text-white/80 mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">
            No Ad Variants Yet
          </h3>
          <p className="text-sm text-white/60 mb-4">
            Create A/B testing variations to find what works best.
          </p>
          <Button
            onClick={onGenerateClick}
            variant="dashed"
            className="px-6"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Variants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg/60 border border-white/10 rounded-3xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-highlight">
            🎯 Ad Variants
          </span>
          <span className="text-xs text-white/60">
            {currentIndex + 1}/{totalVariants}: "{currentVariant?.variant_label}"
            {currentVariant?.is_favorite && <Star className="inline w-3 h-3 ml-1 text-yellow-400 fill-current" />}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={totalVariants <= 1}
            className="p-1 h-9 w-9 rounded-full border border-dashed border-highlight/40 text-highlight/90 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/70 hover:text-highlight focus-visible:ring-2 focus-visible:ring-highlight/40 disabled:opacity-50 disabled:bg-transparent disabled:border-white/10 disabled:text-white/30"
            aria-label="Previous variant"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={totalVariants <= 1}
            className="p-1 h-9 w-9 rounded-full border border-dashed border-highlight/40 text-highlight/90 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/70 hover:text-highlight focus-visible:ring-2 focus-visible:ring-highlight/40 disabled:opacity-50 disabled:bg-transparent disabled:border-white/10 disabled:text-white/30"
            aria-label="Next variant"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Variant Content */}
      {currentVariant && (
        <div className="space-y-4">
          {/* Preview Style Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setPreviewStyle('banner')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40 ${
                  previewStyle === 'banner'
                    ? 'bg-highlight text-primary-bg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Banner</span>
              </button>
              <button
                onClick={() => setPreviewStyle('desktop')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40 ${
                  previewStyle === 'desktop'
                    ? 'bg-highlight text-primary-bg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setPreviewStyle('mobile')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40 ${
                  previewStyle === 'mobile'
                    ? 'bg-highlight text-primary-bg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">Social</span>
              </button>
              <button
                onClick={() => setPreviewStyle('adword')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40 ${
                  previewStyle === 'adword'
                    ? 'bg-highlight text-primary-bg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">AdWord</span>
                <span className="sm:hidden">Ad</span>
              </button>
              <button
                onClick={() => setPreviewStyle('manual')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40 ${
                  previewStyle === 'manual'
                    ? 'bg-highlight text-primary-bg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Clipboard className="w-3 h-3" />
                <span className="hidden sm:inline">Text</span>
              </button>
            </div>
          </div>

          {/* Banner Preview */}
          {previewStyle === 'banner' && (
            <div>
              <div className="flex justify-center">
                <div 
                  style={{
                    margin: 0,
                    padding: 0,
                    position: 'relative',
                    display: 'block',
                    width: '300px',
                    height: '250px',
                    overflow: 'hidden',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <img 
                    src={currentVariant.image_url || aiItem.image_url || 'https://placehold.co/600x500/1f2937/9ca3af?text=Your+Product+Image'}
                    alt="Ad Background"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.8s ease'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x500/1f2937/9ca3af?text=Your+Product+Image';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.1) 100%)'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    color: '#fff'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      lineHeight: '1.2em',
                      maxHeight: '2.4em',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {currentVariant.headline}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '400',
                      lineHeight: '1.3em',
                      maxHeight: '5.2em',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      opacity: 0.9
                    }}>
                      {currentVariant.body}
                    </div>
                    <div style={{
                      alignSelf: 'start',
                      padding: '8px 16px',
                      background: 'linear-gradient(90deg, #22d3ee 0%, #0ea5e9 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {currentVariant.cta}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Preview */}
          {previewStyle === 'desktop' && (
            <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-md p-4 border border-cyan-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">Ad</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-base mb-2 leading-tight">
                      {currentVariant.headline}
                    </h5>
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      {currentVariant.body}
                    </p>
                    {(currentVariant.image_url || aiItem.image_url) && (
                      <div className="mb-3">
                        <img 
                          src={currentVariant.image_url || aiItem.image_url} 
                          alt="Article image" 
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors shadow-sm">
                      {currentVariant.cta}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-cyan-300/40">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Sponsored
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile/Social Preview */}
          {previewStyle === 'mobile' && (
            <div className="flex justify-center">
              <div className="bg-white rounded-lg p-3 border border-gray-300 shadow-sm w-full max-w-sm">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AD</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Campaign</p>
                        <p className="text-xs text-gray-500">Sponsored</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h6 className="font-semibold text-gray-900 text-sm mb-2 leading-tight">
                      {currentVariant.headline}
                    </h6>
                    <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                      {currentVariant.body}
                    </p>
                    {(currentVariant.image_url || aiItem.image_url) && (
                      <img 
                        src={currentVariant.image_url || aiItem.image_url} 
                        alt="Article image" 
                        className="w-full h-24 object-cover rounded border border-gray-200 mb-3"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <button className="w-full bg-cyan-600 text-white font-medium px-4 py-2 rounded-md text-xs">
                      {currentVariant.cta}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AdWord Text-Only Style */}
          {previewStyle === 'adword' && (
            <div className="flex justify-center">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm w-full max-w-2xl">
                {/* Sponsored Header */}
                <div className="mb-3">
                  <span className="text-gray-600 text-sm font-normal">
                    Sponsored
                  </span>
                </div>
                
                {/* Logo/Icon and Brand Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 text-sm font-medium">
                      Campaign
                    </div>
                    <div className="text-[#006621] text-xs">
                      example.com
                    </div>
                  </div>
                </div>
                
                {/* Headline - Clickable Blue Link */}
                <h5 className="text-[#1a0dab] hover:underline cursor-pointer text-xl font-normal mb-2 leading-tight">
                  {currentVariant.headline}
                </h5>
                
                {/* Body Text/Description */}
                <p className="text-[#4d5156] text-sm leading-relaxed">
                  {currentVariant.body}
                </p>
              </div>
            </div>
          )}

          {/* Manual/Copy Mode */}
          {previewStyle === 'manual' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-highlight text-sm font-medium">Headline</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentVariant.headline);
                      setCopiedFields(prev => ({ ...prev, headline: true }));
                      setTimeout(() => setCopiedFields(prev => ({ ...prev, headline: false })), 2000);
                    }}
                    className="h-8 px-2 text-white/60 hover:text-white"
                  >
                    {copiedFields.headline ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <div className="bg-primary-bg/60 border border-white/10 rounded-xl p-3 text-white text-sm">
                  {currentVariant.headline}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-highlight text-sm font-medium">Body Text</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentVariant.body);
                      setCopiedFields(prev => ({ ...prev, body: true }));
                      setTimeout(() => setCopiedFields(prev => ({ ...prev, body: false })), 2000);
                    }}
                    className="h-8 px-2 text-white/60 hover:text-white"
                  >
                    {copiedFields.body ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <div className="bg-primary-bg/60 border border-white/10 rounded-xl p-3 text-white text-sm leading-relaxed">
                  {currentVariant.body}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-highlight text-sm font-medium">Call to Action</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentVariant.cta);
                      setCopiedFields(prev => ({ ...prev, cta: true }));
                      setTimeout(() => setCopiedFields(prev => ({ ...prev, cta: false })), 2000);
                    }}
                    className="h-8 px-2 text-white/60 hover:text-white"
                  >
                    {copiedFields.cta ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <div className="bg-primary-bg/60 border border-white/10 rounded-xl p-3 text-white text-sm font-medium">
                  {currentVariant.cta}
                </div>
              </div>

              {currentVariant.tone && (
                <div className="pt-4 border-t border-white/10">
                  <Label className="text-white/60 text-xs font-medium mb-2 block">Tone</Label>
                  <div className="bg-highlight/10 border border-highlight/25 rounded-xl p-2 text-highlight text-xs">
                    {currentVariant.tone}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                disabled={updatingFavorite}
                className={`flex items-center gap-1 text-xs ${
                  currentVariant.is_favorite 
                    ? 'text-highlight hover:text-highlight/90' 
                    : 'text-white/60 hover:text-highlight'
                }`}
              >
                <Star className={`w-3 h-3 ${currentVariant.is_favorite ? 'fill-current' : ''}`} />
                {currentVariant.is_favorite ? 'Favorited' : 'Favorite'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageGalleryOpen && onImageGalleryOpen(aiItem, currentVariant)}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
              >
                <ImageIcon className="w-3 h-3" />
                Gallery
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={generateImage}
                disabled={generatingImage}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-highlight"
              >
                {generatingImage ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                Generate Image
              </Button>
            </div>

            {totalVariants > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dots Navigation */}
      {totalVariants > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-white/10">
          {variants.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-highlight' 
                  : 'bg-white/20 hover:bg-white/35'
              }`}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Variant"
        message={`Are you sure you want to delete "${currentVariant?.variant_label}"?${totalVariants === 1 ? ' This will remove all variants for this content.' : ''}`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Toast Notifications */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}