import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, ImageIcon, Wand2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';
import { supabase } from '../lib/supabase';

export function VariantCarousel({ 
  aiItem, 
  onImageGalleryOpen, 
  onVariantUpdate,
  onVariantDelete 
}) {
  const [variants, setVariants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

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
      <div className="bg-gray-800/20 border border-gray-600/50 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading variants...</span>
        </div>
      </div>
    );
  }

  if (totalVariants === 0) {
    return null; // No variants to show
  }

  return (
    <div className="bg-gray-800/20 border border-gray-600/50 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-400">
            🎯 Ad Variants
          </span>
          <span className="text-xs text-gray-500">
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
            className="p-1 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={totalVariants <= 1}
            className="p-1 text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Variant Content */}
      {currentVariant && (
        <div className="space-y-3">
          {/* Ad Preview */}
          <div className="border border-gray-600/30 rounded-md p-3 bg-gray-900/20">
            <h5 className="font-medium text-white text-sm mb-1 line-clamp-2">
              {currentVariant.headline}
            </h5>
            <p className="text-xs text-gray-300 mb-2 line-clamp-3">
              {currentVariant.body}
            </p>
            <div className="text-xs">
              <span className="text-purple-400 font-medium">
                {currentVariant.cta}
              </span>
              {currentVariant.tone && (
                <span className="ml-2 text-gray-500">
                  · {currentVariant.tone}
                </span>
              )}
            </div>
          </div>

          {/* Image Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ImageIcon className="w-3 h-3" />
              <span>Image for this variant</span>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-600 rounded-md p-3 cursor-pointer hover:border-gray-500 transition-colors"
              onClick={() => onImageGalleryOpen && onImageGalleryOpen(aiItem, currentVariant)}
            >
              {currentVariant.image_url ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={currentVariant.image_url} 
                    alt="Variant image"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-white">Image selected</p>
                    <p className="text-xs text-gray-500">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <ImageIcon className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Click to select image</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                disabled={updatingFavorite}
                className={`flex items-center gap-1 text-xs ${
                  currentVariant.is_favorite 
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Star className={`w-3 h-3 ${currentVariant.is_favorite ? 'fill-current' : ''}`} />
                {currentVariant.is_favorite ? 'Favorited' : 'Favorite'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageGalleryOpen && onImageGalleryOpen(aiItem, currentVariant)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
              >
                <ImageIcon className="w-3 h-3" />
                Gallery
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={generateImage}
                disabled={generatingImage}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400"
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
        <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-600/30">
          {variants.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-purple-400' 
                  : 'bg-gray-600 hover:bg-gray-500'
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