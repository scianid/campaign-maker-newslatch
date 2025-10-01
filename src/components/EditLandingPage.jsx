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
  const [modal, setModal] = useState(null); // { type: 'prompt'|'alert', title, message, value, onConfirm }
  const [showSaved, setShowSaved] = useState(false);

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
      
      // Show saved indicator
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving field:', err);
      setModal({
        type: 'alert',
        title: 'Save Failed',
        message: err.message
      });
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
        cta: null,
        widget: null
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
      setModal({
        type: 'alert',
        title: 'Image Generation Failed',
        message: err.message
      });
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

  const handleSetImageUrl = async (sectionIndex, imageUrl) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].image_url = imageUrl;
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

  const handleSetWidget = async (sectionIndex, widgetType) => {
    const updatedSections = [...landingPage.sections];
    const section = updatedSections[sectionIndex];
    
    // Set single widget (or null to remove)
    section.widget = widgetType || null;
    
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
  };

  const handleSaveStickyCtaTitle = async (newTitle) => {
    const stickyCtaTitle = newTitle || 'Ready to Take Action?';
    setLandingPage({ ...landingPage, sticky_cta_title: stickyCtaTitle });
    await saveField({ sticky_cta_title: stickyCtaTitle });
  };

  const handleSaveStickyCtaSubtitle = async (newSubtitle) => {
    const stickyCtaSubtitle = newSubtitle || 'Click to visit the site and learn more';
    setLandingPage({ ...landingPage, sticky_cta_subtitle: stickyCtaSubtitle });
    await saveField({ sticky_cta_subtitle: stickyCtaSubtitle });
  };

  const handleSaveStickyCtaButton = async (newButtonText) => {
    const stickyCtaButton = newButtonText || 'Visit Site →';
    setLandingPage({ ...landingPage, sticky_cta_button: stickyCtaButton });
    await saveField({ sticky_cta_button: stickyCtaButton });
  };

  const handleToggleStickyCtaVisible = async () => {
    const newVisibility = !landingPage.sticky_cta_visible;
    setLandingPage({ ...landingPage, sticky_cta_visible: newVisibility });
    await saveField({ sticky_cta_visible: newVisibility });
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

      {/* Floating Save Button */}
      <div 
        className={`fixed bottom-8 right-8 z-50 transition-opacity duration-500 ${showSaved ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Button
          className="shadow-2xl px-6 py-3 text-base font-semibold"
          style={{ backgroundColor: '#10b981', color: 'white' }}
        >
          <Check className="w-5 h-5 mr-2" />
          Auto-Saved
        </Button>
      </div>

      {/* Sticky Bottom CTA */}
      {(landingPage.sticky_cta_visible !== false) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-500 to-orange-400 border-t-4 border-orange-600 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {!isEditing('sticky-cta-title') && !isEditing('sticky-cta-subtitle') && !isEditing('sticky-cta-button') && (
              <div className="mb-3 flex gap-2 items-center justify-center flex-wrap">
                <span className="text-xs text-orange-100 font-medium">Sticky CTA Editor:</span>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-title', null, null, landingPage.sticky_cta_title || 'Ready to Take Action?')}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1"
                >
                  Edit Title
                </Button>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-subtitle', null, null, landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more')}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1"
                >
                  Edit Subtitle
                </Button>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-button', null, null, landingPage.sticky_cta_button || 'Visit Site →')}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1"
                >
                  Edit Button
                </Button>
                <Button
                  size="sm"
                  onClick={handleToggleStickyCtaVisible}
                  className="bg-red-600/80 hover:bg-red-700 text-white text-xs px-2 py-1 ml-2"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Hide CTA
                </Button>
              </div>
            )}
          
          {/* Edit Mode for Title */}
          {isEditing('sticky-cta-title') && (
            <div className="mb-4">
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                className="text-lg font-bold border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaTitle(editingField.value)}
                  className="bg-green-600 hover:bg-green-700 text-gray-900 border-2 border-green-700 shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-900 shadow-lg"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Edit Mode for Subtitle */}
          {isEditing('sticky-cta-subtitle') && (
            <div className="mb-4">
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                className="text-sm border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaSubtitle(editingField.value)}
                  className="bg-green-600 hover:bg-green-700 text-gray-900 border-2 border-green-700 shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-900 shadow-lg"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Edit Mode for Button */}
          {isEditing('sticky-cta-button') && (
            <div className="mb-4">
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                className="text-lg font-bold border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaButton(editingField.value)}
                  className="bg-green-600 hover:bg-green-700 text-gray-900 border-2 border-green-700 shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-900 shadow-lg"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white font-bold text-lg md:text-xl">
                {landingPage.sticky_cta_title || 'Ready to Take Action?'}
              </p>
              <p className="text-orange-50 text-sm">
                {landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (landingPage?.ai_generated_items?.campaigns?.url) {
                  window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                }
              }}
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold px-8 py-4 text-lg rounded-lg shadow-lg transition-all hover:scale-105"
            >
              {landingPage.sticky_cta_button || 'Visit Site →'}
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Show CTA Button (when hidden) */}
      {landingPage.sticky_cta_visible === false && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={handleToggleStickyCtaVisible}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-2xl px-4 py-3"
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Sticky CTA
          </Button>
        </div>
      )}

      {/* Main Content - Matching Public Landing Page Style */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
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
              {/* Widget Controls */}
              <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Section Widget</h3>
                <div className="flex gap-2 items-center">
                  <select
                    value={section.widget || ''}
                    onChange={(e) => handleSetWidget(sectionIndex, e.target.value)}
                    className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="">No Widget</option>
                    <option value="view-count">👁️ View Count</option>
                    <option value="rating">⭐ Star Rating</option>
                    <option value="trust-badge">✓ Trust Badge</option>
                    <option value="live-activity">🔴 Live Activity</option>
                    <option value="recent-signups">🔥 Recent Sign-ups</option>
                    <option value="limited-time">⚡ Limited Time</option>
                    <option value="featured-badge">⭐ Featured Badge</option>
                    <option value="testimonial-count">💬 Testimonial Count</option>
                  </select>
                  {section.widget && (
                    <Button
                      size="sm"
                      onClick={() => handleSetWidget(sectionIndex, null)}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                      className="shadow-lg hover:opacity-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select one widget to display at the top of this section</p>
              </div>

              {/* Top Widget */}
              {section.widget === 'view-count' && (
                <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-gray-700 font-medium">
                    👁️ {Math.floor(Math.random() * 500) + 200} people viewed this today
                  </span>
                </div>
              )}
              
              {section.widget === 'rating' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-3xl font-bold text-gray-900">{(Math.random() * 0.8 + 9.1).toFixed(1)}</div>
                        <div className="flex text-yellow-400">
                          {[...Array(4)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Excellent Rating</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Our assessment</div>
                    </div>
                  </div>
                </div>
              )}
              
              {section.widget === 'trust-badge' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-green-800 font-semibold">
                    ✓ Verified by Industry Experts
                  </span>
                </div>
              )}
              
              {section.widget === 'live-activity' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-blue-800 font-medium">
                    🔴 {Math.floor(Math.random() * 10) + 3} people are viewing this now
                  </span>
                </div>
              )}
              
              {section.widget === 'recent-signups' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-purple-800 font-medium">
                    🔥 {Math.floor(Math.random() * 200) + 50} people joined in the last 24 hours
                  </span>
                </div>
              )}
              
              {section.widget === 'limited-time' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3 inline-block mb-6">
                  <span className="text-sm text-red-800 font-bold">
                    ⚡ LIMITED TIME OFFER - Ends Soon!
                  </span>
                </div>
              )}
              
              {section.widget === 'featured-badge' && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-yellow-900 font-semibold">
                    ⭐ Featured in 12+ Publications
                  </span>
                </div>
              )}
              
              {section.widget === 'testimonial-count' && (
                <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block mb-6">
                  <span className="text-sm text-gray-700 font-medium">
                    💬 Based on {Math.floor(Math.random() * 2000) + 500}+ reviews
                  </span>
                </div>
              )}

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
                          setModal({
                            type: 'prompt',
                            title: 'Regenerate Image',
                            message: 'Enter a prompt to generate a new image:',
                            value: section.image_prompt || '',
                            onConfirm: (prompt) => {
                              if (prompt) {
                                handleGenerateImage(sectionIndex, prompt);
                              }
                            }
                          });
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
                        onClick={() => {
                          setModal({
                            type: 'prompt',
                            title: 'Edit Image URL',
                            message: 'Enter the image URL:',
                            value: section.image_url || '',
                            onConfirm: (url) => {
                              if (url) {
                                handleSetImageUrl(sectionIndex, url);
                              }
                            }
                          });
                        }}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                      >
                        <Edit2 className="w-4 h-4" />
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
                <div className="mb-8 flex gap-2">
                  <Button
                    onClick={() => {
                      setModal({
                        type: 'prompt',
                        title: 'Generate Image With AI',
                        message: 'Enter a prompt to generate an image:',
                        value: section.image_prompt || `An image representing: ${section.subtitle}`,
                        onConfirm: (prompt) => {
                          if (prompt) {
                            handleSaveImagePrompt(sectionIndex, prompt).then(() => {
                              handleGenerateImage(sectionIndex, prompt);
                            });
                          }
                        }
                      });
                    }}
                    disabled={generatingImage === sectionIndex}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {generatingImage === sectionIndex ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Image With AI
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setModal({
                        type: 'prompt',
                        title: 'Add Image URL',
                        message: 'Enter the image URL:',
                        value: '',
                        onConfirm: (url) => {
                          if (url) {
                            handleSetImageUrl(sectionIndex, url);
                          }
                        }
                      });
                    }}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image URL
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
                        <div className="absolute -left-16 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => startEdit('cta', sectionIndex, null, section.cta)}
                            style={{ backgroundColor: '#2563eb', color: 'white' }}
                            className="shadow-lg hover:opacity-90"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveCTA(sectionIndex, null)}
                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                            className="shadow-lg hover:opacity-90"
                          >
                            <Trash2 className="w-4 h-4" />
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
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add CTA
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Widget Controls - Moved to top */}
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

      {/* Modal Dialog */}
      {modal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{modal.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{modal.message}</p>
            </div>
            
            {modal.type === 'prompt' && (
              <div className="mb-6">
                <Textarea
                  value={modal.value}
                  onChange={(e) => setModal({ ...modal, value: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                  style={{ color: '#111827', fontSize: '14px', backgroundColor: '#ffffff' }}
                  rows={4}
                  placeholder="Enter your text here..."
                  autoFocus
                />
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={() => setModal(null)}
                variant="outline"
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors font-medium"
              >
                Cancel
              </Button>
              {modal.type === 'prompt' && (
                <Button
                  onClick={() => {
                    if (modal.onConfirm) {
                      modal.onConfirm(modal.value);
                    }
                    setModal(null);
                  }}
                  className="px-6 py-2.5 font-medium transition-all"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Confirm
                </Button>
              )}
              {modal.type === 'alert' && (
                <Button
                  onClick={() => setModal(null)}
                  className="px-6 py-2.5 font-medium transition-all"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  OK
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
