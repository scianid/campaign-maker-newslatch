import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Loader2,
  Eye,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { supabase } from '../lib/supabase';

export function EditLandingPage({ user }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(null);
  const [editingField, setEditingField] = useState(null); // { type, sectionIndex, paragraphIndex, value }

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

  const saveField = async (updateData) => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .update(updateData)
        .eq('id', pageId);

      if (error) throw error;
      
      setEditingField(null);
    } catch (err) {
      console.error('Error saving field:', err);
      alert('Failed to save: ' + err.message);
    }
  };

  const handleSaveTitle = async (newTitle) => {
    setLandingPage({ ...landingPage, title: newTitle });
    await saveField({ title: newTitle });
  };

  const handleSaveSubtitle = async (sectionIndex, newSubtitle) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].subtitle = newSubtitle;
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleSaveParagraph = async (sectionIndex, paragraphIndex, newText) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs[paragraphIndex] = newText;
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleDeleteParagraph = async (sectionIndex, paragraphIndex) => {
    if (!confirm('Delete this paragraph?')) return;
    
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs.splice(paragraphIndex, 1);
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleAddParagraph = async (sectionIndex) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs.push('New paragraph...');
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleDeleteSection = async (sectionIndex) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    const updatedSections = landingPage.sections.filter((_, idx) => idx !== sectionIndex);
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleAddSection = async () => {
    const updatedSections = [
      ...landingPage.sections,
      {
        subtitle: 'New Section',
        paragraphs: ['Add your content here...'],
        image_prompt: '',
        image_url: null,
        cta: null
      }
    ];
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
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
      const updatedSections = landingPage.sections.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, image_url: result.image_url }
          : section
      );
      
      setLandingPage({ ...landingPage, sections: updatedSections });
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image: ' + err.message);
    } finally {
      setGeneratingImage(null);
    }
  };

  const handleRemoveImage = async (sectionIndex) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].image_url = null;
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleSaveImagePrompt = async (sectionIndex, newPrompt) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].image_prompt = newPrompt;
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleSaveCTA = async (sectionIndex, newCTA) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].cta = newCTA;
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const startEdit = (type, sectionIndex = null, paragraphIndex = null, currentValue = '') => {
    setEditingField({ type, sectionIndex, paragraphIndex, value: currentValue });
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const isEditing = (type, sectionIndex = null, paragraphIndex = null) => {
    if (!editingField) return false;
    return (
      editingField.type === type &&
      editingField.sectionIndex === sectionIndex &&
      editingField.paragraphIndex === paragraphIndex
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading landing page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Landing Page</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={() => navigate('/landing-pages')} className="bg-red-600 hover:bg-red-700 text-white">
              Back to Landing Pages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return null;
  }

  const publicUrl = `${window.location.origin}/page/${landingPage.slug}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar - Edit Mode Notice */}
      <div className="bg-blue-600 border-b border-blue-700 py-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/landing-pages')}
                variant="ghost"
                size="sm"
                className="text-white hover:text-blue-100 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-white">
                  Edit Mode
                </span>
              </div>
            </div>
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white hover:text-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          </div>
        </div>
      </div>

      {/* Main Content - Matching Public Landing Page Style */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="text-center mb-12">
          {/* Last Updated Pill */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Last Updated: {new Date(landingPage.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>

          {/* Page Title - Editable */}
          {isEditing('title') ? (
            <div className="mb-8">
              <Textarea
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                className="text-4xl md:text-5xl font-bold text-center leading-tight border-2 border-blue-600 rounded-lg p-4 bg-gray-100"
                style={{ color: '#111827' }}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-center mt-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveTitle(editingField.value)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
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
              </div>
            </div>
          ) : (
            <div className="group mb-8 relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  size="sm"
                  onClick={() => startEdit('title', null, null, landingPage.title)}
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  className="shadow-lg hover:opacity-90"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {landingPage.title}
              </h1>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <span>Powered by NewsLatch</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="max-w-none">
          {landingPage.sections?.map((section, sectionIndex) => (
            <section key={sectionIndex} className="mb-12">
              {/* Section Subtitle - Editable */}
              {isEditing('subtitle', sectionIndex) ? (
                <div className="mb-6">
                  <Textarea
                    value={editingField.value}
                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                    className="text-2xl md:text-3xl font-bold border-2 border-blue-600 rounded-lg p-3 bg-gray-100"
                    style={{ color: '#111827' }}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleSaveSubtitle(sectionIndex, editingField.value)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
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
                    <Button
                      size="sm"
                      onClick={() => {
                        cancelEdit();
                        handleDeleteSection(sectionIndex);
                      }}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                      className="ml-auto shadow-lg hover:opacity-90"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Section
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 relative group">
                  <div className="absolute -left-20 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="sm"
                      onClick={() => startEdit('subtitle', sectionIndex, null, section.subtitle)}
                      style={{ backgroundColor: '#2563eb', color: 'white' }}
                      className="shadow-lg hover:opacity-90"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteSection(sectionIndex)}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                      className="shadow-lg hover:opacity-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {section.subtitle || 'Untitled Section'}
                  </h2>
                </div>
              )}

              {/* Paragraphs - Editable */}
              {section.paragraphs?.map((paragraph, pIndex) => (
                <div key={pIndex} className="mb-4">
                  {isEditing('paragraph', sectionIndex, pIndex) ? (
                    <div>
                      <Textarea
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        className="text-lg leading-relaxed border-2 border-blue-600 rounded-lg p-3 w-full bg-gray-100"
                        style={{ color: '#111827' }}
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveParagraph(sectionIndex, pIndex, editingField.value)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
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
                        {section.paragraphs.length > 1 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              cancelEdit();
                              handleDeleteParagraph(sectionIndex, pIndex);
                            }}
                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                            className="shadow-lg hover:opacity-90"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative hover:bg-gray-50 transition-colors rounded px-2 py-1 -mx-2 group">
                      <div className="absolute -left-14 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          size="sm"
                          onClick={() => startEdit('paragraph', sectionIndex, pIndex, paragraph)}
                          style={{ backgroundColor: '#2563eb', color: 'white' }}
                          className="shadow-lg hover:opacity-90"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {section.paragraphs.length > 1 && (
                          <Button
                            size="sm"
                            onClick={() => handleDeleteParagraph(sectionIndex, pIndex)}
                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                            className="shadow-lg hover:opacity-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Paragraph Button */}
              <Button
                onClick={() => handleAddParagraph(sectionIndex)}
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 mt-2 mb-6"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Paragraph
              </Button>

              {/* Image Section */}
              {section.image_url && (
                <div className="mb-8">
                  <div className="rounded-lg overflow-hidden shadow-lg relative group/img">
                    <img 
                      src={section.image_url}
                      alt={section.image_prompt || section.subtitle || "Section image"}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Button
                        onClick={() => {
                          const prompt = window.prompt('Enter new image prompt:', section.image_prompt || '');
                          if (prompt) {
                            handleGenerateImage(sectionIndex, prompt);
                          }
                        }}
                        disabled={generatingImage === sectionIndex}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                      >
                        {generatingImage === sectionIndex ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Regenerate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRemoveImage(sectionIndex)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Image Button if no image */}
              {!section.image_url && (
                <div className="mb-8">
                  <Button
                    onClick={() => {
                      const prompt = window.prompt('Enter image prompt:', section.image_prompt || `An image representing: ${section.subtitle}`);
                      if (prompt) {
                        handleSaveImagePrompt(sectionIndex, prompt).then(() => {
                          handleGenerateImage(sectionIndex, prompt);
                        });
                      }
                    }}
                    disabled={generatingImage === sectionIndex}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {generatingImage === sectionIndex ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Image...
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

              {/* CTA Section - Editable */}
              <div className="mb-8">
                {isEditing('cta', sectionIndex) ? (
                  <div>
                    <Input
                      value={editingField.value}
                      onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                      className="border-2 border-blue-600 rounded-lg p-3 bg-gray-100"
                      style={{ color: '#111827' }}
                      placeholder="Enter CTA text (leave empty for no CTA)"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveCTA(sectionIndex, editingField.value)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
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
                      {section.cta && (
                        <Button
                          size="sm"
                          onClick={() => {
                            cancelEdit();
                            handleSaveCTA(sectionIndex, null);
                          }}
                          style={{ backgroundColor: '#dc2626', color: 'white' }}
                          className="shadow-lg hover:opacity-90"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove CTA
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {section.cta ? (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-10 text-center shadow-lg relative group">
                        <div className="absolute -left-16 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            size="sm"
                            onClick={() => startEdit('cta', sectionIndex, null, section.cta)}
                            style={{ backgroundColor: '#2563eb', color: 'white' }}
                            className="shadow-lg hover:opacity-90"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mb-6">
                          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                            EXCLUSIVE OPPORTUNITY
                          </div>
                        </div>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg">
                          {section.cta}
                        </Button>
                        <p className="text-base text-gray-700 mt-4 font-medium">
                          Click above to unlock your exclusive access now!
                        </p>
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          Join thousands of satisfied users!
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => startEdit('cta', sectionIndex, null, '')}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add CTA
                      </Button>
                    )}
                  </>
                )}
              </div>
            </section>
          ))}

          {/* Add New Section Button */}
          <div className="my-12">
            <Button
              onClick={handleAddSection}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-dashed border-gray-300 py-6 rounded-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Section
            </Button>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Powered by AI-driven content generation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
