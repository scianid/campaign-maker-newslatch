import { useState } from 'react';
import { RefreshCw, Trash2, Plus, Image as ImageIcon, Loader2, Edit2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export function ImageSection({ 
  section,
  sectionIndex,
  generatingImage,
  onGenerateImage,
  onRemoveImage,
  onSetImageUrl,
  onSaveImagePrompt
}) {
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePromptValue, setImagePromptValue] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlValue, setImageUrlValue] = useState('');

  const handleGenerateImage = () => {
    if (section.image_prompt) {
      onGenerateImage(sectionIndex, section.image_prompt);
    } else {
      setShowImagePrompt(true);
    }
  };

  const handleSavePrompt = () => {
    if (imagePromptValue.trim()) {
      onSaveImagePrompt(sectionIndex, imagePromptValue);
      onGenerateImage(sectionIndex, imagePromptValue);
      setShowImagePrompt(false);
      setImagePromptValue('');
    }
  };

  const handleSetUrl = () => {
    if (imageUrlValue.trim()) {
      onSetImageUrl(sectionIndex, imageUrlValue);
      setShowImageUrlInput(false);
      setImageUrlValue('');
    }
  };

  if (section.image_url) {
    return (
      <div className="mb-8 relative group">
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            size="sm"
            onClick={handleGenerateImage}
            disabled={generatingImage === sectionIndex}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            {generatingImage === sectionIndex ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => onRemoveImage(sectionIndex)}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <img
          src={section.image_url}
          alt={section.subtitle || 'Section image'}
          className="w-full h-auto rounded-xl shadow-lg"
        />
      </div>
    );
  }

  if (showImagePrompt) {
    return (
      <div className="mb-8 p-4 border-2 border-blue-600 rounded-lg bg-blue-50">
        <h3 className="font-semibold mb-2">Image Generation Prompt</h3>
        <Input
          value={imagePromptValue}
          onChange={(e) => setImagePromptValue(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="mb-2"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSavePrompt}>
            Generate Image
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setShowImagePrompt(false);
              setImagePromptValue('');
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (showImageUrlInput) {
    return (
      <div className="mb-8 p-4 border-2 border-blue-600 rounded-lg bg-blue-50">
        <h3 className="font-semibold mb-2">Set Image URL</h3>
        <Input
          value={imageUrlValue}
          onChange={(e) => setImageUrlValue(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mb-2"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSetUrl}>
            Set Image
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setShowImageUrlInput(false);
              setImageUrlValue('');
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          size="sm"
          onClick={() => setShowImagePrompt(true)}
          disabled={generatingImage === sectionIndex}
        >
          {generatingImage === sectionIndex ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Generate Image
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowImageUrlInput(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Set Image URL
        </Button>
      </div>
    </div>
  );
}
