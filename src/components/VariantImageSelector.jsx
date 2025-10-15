import React, { useState, useEffect } from 'react';
import { X, ImageIcon, Check, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../lib/supabase';

export function VariantImageSelector({ 
  isOpen, 
  onClose, 
  aiItem, 
  variant,
  onImageSelected 
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (isOpen && aiItem) {
      fetchImages();
    }
  }, [isOpen, aiItem]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch all images from storage for this campaign/content
      const folderPath = `${aiItem.campaign_id}/${aiItem.id}`;
      
      const { data: files, error } = await supabase
        .storage
        .from('public-files')
        .list(folderPath);
      
      if (error) {
        console.error('Error fetching images:', error);
      }
      
      // Build full URLs for the images
      const generatedImages = files?.map(file => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('public-files')
          .getPublicUrl(`${folderPath}/${file.name}`);
        return {
          url: publicUrl,
          name: file.name,
          type: 'generated',
        };
      }) || [];

      // Include original image if it exists
      const allImages = [];
      if (aiItem.original_image_url) {
        allImages.push({
          url: aiItem.original_image_url,
          name: 'Original',
          type: 'original',
        });
      }
      allImages.push(...generatedImages);

      setImages(allImages);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectImage = async (image) => {
    if (!variant || selecting) return;

    try {
      setSelecting(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/ad-variants/${variant.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_url: image.url
          })
        }
      );

      if (response.ok) {
        if (onImageSelected) {
          onImageSelected(image.url);
        }
        onClose();
      } else {
        throw new Error('Failed to update variant image');
      }
    } catch (error) {
      console.error('Failed to select image:', error);
      alert('Failed to select image. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  const generateNewImage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

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
            custom_prompt: variant?.image_prompt // Use variant's specific prompt
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }

      // Refresh images list and auto-select the new image
      await fetchImages();
      await selectImage({ url: result.image_url, name: 'New Generated', type: 'generated' });

    } catch (error) {
      console.error('Failed to generate image:', error);
      alert(`Failed to generate image: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-bg border border-gray-600 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div>
            <h3 className="text-lg font-semibold text-white">Select Image</h3>
            <p className="text-sm text-gray-400">
              for variant: "{variant?.variant_label}"
            </p>
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
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-400">Loading images...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Image Grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-purple-400 ${
                        variant?.image_url === image.url
                          ? 'border-purple-500 ring-2 ring-purple-500/20'
                          : 'border-gray-600'
                      }`}
                      onClick={() => selectImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      
                      {/* Selected indicator */}
                      {variant?.image_url === image.url && (
                        <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Image type badge */}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-xs text-white px-2 py-0.5 rounded">
                        {image.type === 'original' ? '📰' : 'AI'}
                      </div>
                      
                      {/* Image name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white truncate">{image.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">No images available</p>
                  <p className="text-sm text-gray-500">Generate an image to get started</p>
                </div>
              )}

              {/* Generate New Image Button */}
              <div className="border-t border-gray-600 pt-4">
                <Button
                  variant="outline"
                  onClick={generateNewImage}
                  disabled={selecting}
                  className="w-full flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate New Image for this Variant
                </Button>
                {variant?.image_prompt && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Using prompt: "{variant.image_prompt.slice(0, 60)}..."
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-600">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}