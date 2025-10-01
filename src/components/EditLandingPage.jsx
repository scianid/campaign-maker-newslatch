import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Loader2,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Layout } from './Layout';
import { supabase } from '../lib/supabase';

export function EditLandingPage({ user }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(null);
  const [regeneratingText, setRegeneratingText] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState({ sectionIndex: null, type: null, value: '' });

  useEffect(() => {
    if (pageId) {
      fetchLandingPage();
    }
  }, [pageId]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          *,
          ai_generated_items (
            id,
            headline,
            clickbait,
            description,
            link,
            campaign_id,
            campaigns (
              id,
              name,
              url,
              user_id
            )
          )
        `)
        .eq('id', pageId)
        .single();

      if (error) throw error;

      // Check if user owns this landing page
      if (data.ai_generated_items?.campaigns?.user_id !== user.id) {
        throw new Error('You do not have permission to edit this landing page');
      }

      setLandingPage(data);
    } catch (err) {
      console.error('Error fetching landing page:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('landing_pages')
        .update({
          title: landingPage.title,
          sections: landingPage.sections
        })
        .eq('id', pageId);

      if (error) throw error;

      alert('Landing page saved successfully!');
    } catch (err) {
      console.error('Error saving landing page:', err);
      alert('Failed to save landing page: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateImage = async (sectionIndex, prompt) => {
    setGeneratingImage(sectionIndex);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate images');
      }

      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-landing-page-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            landing_page_id: pageId,
            section_index: sectionIndex,
            image_prompt: prompt
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }

      // Update local state with new image URL
      setLandingPage(prev => ({
        ...prev,
        sections: prev.sections.map((section, idx) =>
          idx === sectionIndex
            ? { ...section, image_url: result.image_url }
            : section
        )
      }));

      alert('Image generated successfully!');
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image: ' + err.message);
    } finally {
      setGeneratingImage(null);
      setEditingPrompt({ sectionIndex: null, type: null, value: '' });
    }
  };

  const handleRegenerateText = async (sectionIndex, prompt) => {
    setRegeneratingText(sectionIndex);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to regenerate text');
      }

      // Call OpenAI to regenerate section text
      // This is a simplified version - you might want to create a separate Edge Function
      alert('Text regeneration feature coming soon! For now, edit the text manually.');
      
    } catch (err) {
      console.error('Failed to regenerate text:', err);
      alert('Failed to regenerate text: ' + err.message);
    } finally {
      setRegeneratingText(null);
      setEditingPrompt({ sectionIndex: null, type: null, value: '' });
    }
  };

  const handleDeleteSection = (sectionIndex) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setLandingPage(prev => ({
        ...prev,
        sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
      }));
    }
  };

  const handleAddSection = () => {
    setLandingPage(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          subtitle: 'New Section',
          paragraphs: ['Add your content here...'],
          image_prompt: '',
          image_url: null,
          cta: null
        }
      ]
    }));
  };

  const updateSection = (sectionIndex, field, value) => {
    setLandingPage(prev => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, [field]: value }
          : section
      )
    }));
  };

  const updateParagraph = (sectionIndex, paragraphIndex, value) => {
    setLandingPage(prev => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              paragraphs: section.paragraphs.map((p, pIdx) =>
                pIdx === paragraphIndex ? value : p
              )
            }
          : section
      )
    }));
  };

  const addParagraph = (sectionIndex) => {
    setLandingPage(prev => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              paragraphs: [...section.paragraphs, 'New paragraph...']
            }
          : section
      )
    }));
  };

  const deleteParagraph = (sectionIndex, paragraphIndex) => {
    setLandingPage(prev => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              paragraphs: section.paragraphs.filter((_, pIdx) => pIdx !== paragraphIndex)
            }
          : section
      )
    }));
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-highlight animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading landing page...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading Landing Page</h3>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <Button onClick={() => navigate('/landing-pages')} variant="outline">
              Back to Landing Pages
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!landingPage) {
    return null;
  }

  const publicUrl = `${window.location.origin}/page/${landingPage.slug}`;

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/landing-pages')}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Landing Pages
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Edit Landing Page</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <a 
                  href={publicUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-highlight transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
                <span>•</span>
                <span>{landingPage.sections?.length || 0} sections</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-highlight hover:bg-highlight/80 text-black font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Title Editor */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 mb-6">
          <Label className="text-white mb-2">Page Title</Label>
          <Input
            value={landingPage.title}
            onChange={(e) => setLandingPage({ ...landingPage, title: e.target.value })}
            className="bg-gray-700/50 border-gray-600/50 text-white text-xl font-semibold"
            placeholder="Enter landing page title"
          />
        </div>

        {/* Sections Editor */}
        <div className="space-y-6">
          {landingPage.sections?.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Section {sectionIndex + 1}
                </h3>
                <Button
                  onClick={() => handleDeleteSection(sectionIndex)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Subtitle */}
              <div className="mb-4">
                <Label className="text-gray-300 mb-2">Subtitle</Label>
                <Input
                  value={section.subtitle || ''}
                  onChange={(e) => updateSection(sectionIndex, 'subtitle', e.target.value)}
                  className="bg-gray-700/50 border-gray-600/50 text-white"
                  placeholder="Section subtitle"
                />
              </div>

              {/* Paragraphs */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300">Content</Label>
                  <Button
                    onClick={() => addParagraph(sectionIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Paragraph
                  </Button>
                </div>
                <div className="space-y-3">
                  {section.paragraphs?.map((paragraph, pIndex) => (
                    <div key={pIndex} className="flex gap-2">
                      <Textarea
                        value={paragraph}
                        onChange={(e) => updateParagraph(sectionIndex, pIndex, e.target.value)}
                        className="bg-gray-700/50 border-gray-600/50 text-white flex-1"
                        rows={3}
                        placeholder="Paragraph text"
                      />
                      {section.paragraphs.length > 1 && (
                        <Button
                          onClick={() => deleteParagraph(sectionIndex, pIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Section */}
              <div className="mb-4">
                <Label className="text-gray-300 mb-2">Image</Label>
                
                {section.image_url ? (
                  <div className="flex gap-4">
                    <img
                      src={section.image_url}
                      alt={section.image_prompt || 'Section image'}
                      className="w-48 h-48 object-cover rounded-lg border border-gray-600"
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={section.image_prompt || ''}
                        onChange={(e) => updateSection(sectionIndex, 'image_prompt', e.target.value)}
                        className="bg-gray-700/50 border-gray-600/50 text-white"
                        placeholder="Image prompt"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingPrompt({ 
                              sectionIndex, 
                              type: 'image', 
                              value: section.image_prompt || '' 
                            });
                          }}
                          disabled={generatingImage === sectionIndex}
                          variant="outline"
                          size="sm"
                          className="text-blue-400 border-blue-600/30 hover:bg-blue-900/20"
                        >
                          {generatingImage === sectionIndex ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => updateSection(sectionIndex, 'image_url', null)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={section.image_prompt || ''}
                      onChange={(e) => updateSection(sectionIndex, 'image_prompt', e.target.value)}
                      className="bg-gray-700/50 border-gray-600/50 text-white"
                      placeholder="Describe the image you want to generate"
                    />
                    <Button
                      onClick={() => {
                        if (section.image_prompt) {
                          handleGenerateImage(sectionIndex, section.image_prompt);
                        } else {
                          alert('Please enter an image prompt first');
                        }
                      }}
                      disabled={generatingImage === sectionIndex || !section.image_prompt}
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-600/30 hover:bg-blue-900/20"
                    >
                      {generatingImage === sectionIndex ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div>
                <Label className="text-gray-300 mb-2">Call-to-Action (Optional)</Label>
                <Input
                  value={section.cta || ''}
                  onChange={(e) => updateSection(sectionIndex, 'cta', e.target.value)}
                  className="bg-gray-700/50 border-gray-600/50 text-white"
                  placeholder="Leave empty for no CTA button"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Section Button */}
        <div className="mt-6">
          <Button
            onClick={handleAddSection}
            className="w-full bg-gray-700/50 hover:bg-gray-700 text-white border-2 border-dashed border-gray-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Section
          </Button>
        </div>

        {/* Custom Prompt Modal */}
        {editingPrompt.sectionIndex !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingPrompt.type === 'image' ? 'Custom Image Prompt' : 'Custom Text Prompt'}
              </h3>
              <Textarea
                value={editingPrompt.value}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                className="bg-gray-700/50 border-gray-600/50 text-white mb-4"
                rows={4}
                placeholder="Enter your custom prompt..."
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditingPrompt({ sectionIndex: null, type: null, value: '' })}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingPrompt.type === 'image') {
                      handleGenerateImage(editingPrompt.sectionIndex, editingPrompt.value);
                    } else {
                      handleRegenerateText(editingPrompt.sectionIndex, editingPrompt.value);
                    }
                  }}
                  className="flex-1 bg-highlight hover:bg-highlight/80 text-black"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
