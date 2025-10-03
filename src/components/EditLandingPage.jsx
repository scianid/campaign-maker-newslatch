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
  X,
  Sparkles,
  ChevronDown
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
  const [modal, setModal] = useState(null); // { type: 'prompt'|'alert'|'aiParagraph', title, message, value, onConfirm }
  const [showSaved, setShowSaved] = useState(false);
  const [showAddParagraphMenu, setShowAddParagraphMenu] = useState(null); // sectionIndex
  const [showAddImageMenu, setShowAddImageMenu] = useState(null); // sectionIndex
  const [generatingParagraph, setGeneratingParagraph] = useState(false);

  // Content types for AI paragraph generation
  const CONTENT_TYPES = [
    { value: 'product-description', label: 'Product Description', description: 'Highlight features and benefits persuasively' },
    { value: 'problem-solution', label: 'Problem & Solution', description: 'Define a problem and how you solve it' },
    { value: 'social-proof', label: 'Social Proof', description: 'Build credibility with testimonials and stats' },
    { value: 'urgency-scarcity', label: 'Urgency & Scarcity', description: 'Create sense of limited time or availability' },
    { value: 'benefit-focused', label: 'Benefits & Transformation', description: 'Focus on outcomes and transformations' },
    { value: 'story-telling', label: 'Story Telling', description: 'Connect emotionally through relatable stories' },
    { value: 'comparison', label: 'Comparison', description: 'Compare with alternatives or current situation' },
    { value: 'how-it-works', label: 'How It Works', description: 'Explain the process or mechanism' },
    { value: 'objection-handling', label: 'Objection Handling', description: 'Address common concerns or doubts' },
    { value: 'call-to-value', label: 'Value Proposition', description: 'Emphasize ROI and value proposition' }
  ];

  useEffect(() => {
    if (pageId) {
      fetchLandingPage();
    }
  }, [pageId]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddParagraphMenu !== null && !event.target.closest('.add-paragraph-dropdown')) {
        setShowAddParagraphMenu(null);
      }
      if (showAddImageMenu !== null && !event.target.closest('.add-image-dropdown')) {
        setShowAddImageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddParagraphMenu, showAddImageMenu]);

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
    setModal({
      type: 'confirm',
      title: 'Delete Paragraph',
      message: 'Are you sure you want to delete this paragraph? This action cannot be undone.',
      onConfirm: async () => {
        const updatedSections = [...landingPage.sections];
        updatedSections[sectionIndex].paragraphs.splice(paragraphIndex, 1);
        setLandingPage({ ...landingPage, sections: updatedSections });
        await saveField({ sections: updatedSections });
        setModal(null);
      }
    });
  };

  const handleAddParagraph = async (sectionIndex) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs.push('New paragraph...');
    setLandingPage({ ...landingPage, sections: updatedSections });
    await saveField({ sections: updatedSections });
    setShowAddParagraphMenu(null);
  };

  const handleAddParagraphWithAI = (sectionIndex) => {
    setModal({
      type: 'aiParagraph',
      sectionIndex,
      step: 1,
      contentType: 'product-description',
      prompt: '',
      title: 'Generate Paragraph with AI',
      message: 'Choose the type of content you want to generate:'
    });
    setShowAddParagraphMenu(null);
  };

  const generateParagraphWithAI = async (sectionIndex, contentType, prompt) => {
    setGeneratingParagraph(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate content');
      }

      // Build context from landing page
      const context = `
Landing Page Title: ${landingPage.title}
Campaign: ${landingPage.ai_generated_items?.campaigns?.name || 'N/A'}
Product/Service URL: ${landingPage.ai_generated_items?.campaigns?.url || 'N/A'}
Existing Content: ${landingPage.sections?.map(s => s.paragraphs?.join(' ')).join(' ') || 'N/A'}
      `.trim();

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-paragraph`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landingPageId: pageId,
          prompt,
          contentType,
          context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate paragraph');
      }

      const data = await response.json();
      const generatedParagraph = data.paragraph;

      // Add the generated paragraph to the section
      const updatedSections = [...landingPage.sections];
      updatedSections[sectionIndex].paragraphs.push(generatedParagraph);
      setLandingPage({ ...landingPage, sections: updatedSections });
      await saveField({ sections: updatedSections });

      setModal(null);
      
      // Show success message
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error generating paragraph:', err);
      setModal({
        type: 'alert',
        title: 'Generation Failed',
        message: err.message || 'Failed to generate paragraph. Please try again.'
      });
    } finally {
      setGeneratingParagraph(false);
    }
  };

  const handleDeleteSection = async (sectionIndex) => {
    setModal({
      type: 'confirm',
      title: 'Delete Section',
      message: 'Are you sure you want to delete this entire section? All content, including paragraphs and images, will be permanently removed.',
      onConfirm: async () => {
        const updatedSections = landingPage.sections.filter((_, idx) => idx !== sectionIndex);
        setLandingPage({ ...landingPage, sections: updatedSections });
        await saveField({ sections: updatedSections });
        setModal(null);
      }
    });
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

  const handleSaveCtaConfig = async (sectionIndex, ctaConfig) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].cta_config = ctaConfig;
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
                <span className="text-sm font-medium text-white">
                  EDIT MODE
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100" style={{ boxShadow: '0 -10px 30px -5px rgba(0, 0, 0, 0.3), 0 -4px 6px -2px rgba(0, 0, 0, 0.2)' }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            {!isEditing('sticky-cta-title') && !isEditing('sticky-cta-subtitle') && !isEditing('sticky-cta-button') && (
              <div className="mb-3 flex gap-2 items-center justify-center flex-wrap">
                <span className="text-xs text-gray-600 font-medium">Sticky CTA Editor:</span>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-title', null, null, landingPage.sticky_cta_title || 'Ready to Take Action?')}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white text-xs px-2 py-1"
                >
                  Edit Title
                </Button>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-subtitle', null, null, landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more')}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white text-xs px-2 py-1"
                >
                  Edit Subtitle
                </Button>
                <Button
                  size="sm"
                  onClick={() => startEdit('sticky-cta-button', null, null, landingPage.sticky_cta_button || 'Visit Site →')}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white text-xs px-2 py-1"
                >
                  Edit Button
                </Button>
                <Button
                  size="sm"
                  onClick={handleToggleStickyCtaVisible}
                  className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white text-xs px-2 py-1 ml-2"
                >
                  <Eye className="w-3 h-3 mr-1 !text-red-600" />
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
                maxLength={40}
                className="text-lg font-bold border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="text-xs text-gray-600 mt-1">
                {editingField.value.length}/40 characters {editingField.value.length > 30 && '(⚠️ Consider shorter for mobile)'}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaTitle(editingField.value)}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1 !text-blue-600" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={cancelEdit}
                  className="border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white shadow-lg"
                >
                  <X className="w-4 h-4 mr-1 !text-gray-700" />
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
                maxLength={60}
                className="text-sm border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="text-xs text-gray-600 mt-1">
                {editingField.value.length}/60 characters {editingField.value.length > 45 && '(⚠️ Consider shorter for mobile)'}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaSubtitle(editingField.value)}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1 !text-blue-600" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={cancelEdit}
                  className="border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white shadow-lg"
                >
                  <X className="w-4 h-4 mr-1 !text-gray-700" />
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
                maxLength={20}
                className="text-lg font-bold border-2 border-white rounded-lg p-2 bg-white text-gray-900"
                style={{ color: '#111827' }}
                autoFocus
              />
              <div className="text-xs text-gray-600 mt-1">
                {editingField.value.length}/20 characters {editingField.value.length > 15 && '(⚠️ Consider shorter for mobile)'}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveStickyCtaButton(editingField.value)}
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg font-semibold"
                >
                  <Check className="w-4 h-4 mr-1 !text-blue-600" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={cancelEdit}
                  className="border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white shadow-lg"
                >
                  <X className="w-4 h-4 mr-1 !text-gray-700" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-gray-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl leading-tight">
                {landingPage.sticky_cta_title || 'Ready to Take Action?'}
              </p>
              <p className="text-gray-700 text-xs sm:text-sm mt-0.5">
                {landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (landingPage?.ai_generated_items?.campaigns?.url) {
                  window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg rounded-lg shadow-lg transition-all hover:scale-105 whitespace-nowrap w-full sm:w-auto"
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
            className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-2xl px-4 py-3"
          >
            <Eye className="w-4 h-4 mr-2 !text-blue-600" />
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
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white"
                >
                  <Check className="w-4 h-4 mr-1 !text-blue-600" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={cancelEdit}
                  className="border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white"
                >
                  <X className="w-4 h-4 mr-1 !text-gray-700" />
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
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                >
                  <Edit2 className="w-4 h-4 !text-blue-600" />
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
                <div className="flex gap-2 items-center mb-3">
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
                      className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg"
                    >
                      <Trash2 className="w-4 h-4 !text-red-600" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">Select one widget to display at the top of this section</p>
                
                {/* Widget Preview */}
                {section.widget && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
                    
                    {section.widget === 'view-count' && (
                      <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-gray-700 font-medium">
                          👁️ {Math.floor(Math.random() * 500) + 200} people viewed this today
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'rating' && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-green-800 font-semibold">
                          ✓ Verified by Industry Experts
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'live-activity' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-blue-800 font-medium">
                          🔴 {Math.floor(Math.random() * 10) + 3} people are viewing this now
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'recent-signups' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-purple-800 font-medium">
                          🔥 {Math.floor(Math.random() * 200) + 50} people joined in the last 24 hours
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'limited-time' && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3 inline-block">
                        <span className="text-sm text-red-800 font-bold">
                          ⚡ LIMITED TIME OFFER - Ends Soon!
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'featured-badge' && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-yellow-900 font-semibold">
                          ⭐ Featured in 12+ Publications
                        </span>
                      </div>
                    )}
                    
                    {section.widget === 'testimonial-count' && (
                      <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-gray-700 font-medium">
                          💬 Based on {Math.floor(Math.random() * 2000) + 500}+ reviews
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  <div className="absolute -left-20 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="sm"
                      onClick={() => startEdit('subtitle', sectionIndex, null, section.subtitle)}
                      className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                    >
                      <Edit2 className="w-4 h-4 !text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteSection(sectionIndex)}
                      className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg"
                    >
                      <Trash2 className="w-4 h-4 !text-red-600" />
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
                      <div className="absolute -left-14 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          size="sm"
                          onClick={() => startEdit('paragraph', sectionIndex, pIndex, paragraph)}
                          className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                        >
                          <Edit2 className="w-4 h-4 !text-blue-600" />
                        </Button>
                        {section.paragraphs.length > 1 && (
                          <Button
                            size="sm"
                            onClick={() => handleDeleteParagraph(sectionIndex, pIndex)}
                            className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 !text-red-600" />
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

              {/* Add Paragraph Button with Dropdown */}
              <div className="relative mt-2 mb-6 add-paragraph-dropdown">
                <Button
                  onClick={() => setShowAddParagraphMenu(showAddParagraphMenu === sectionIndex ? null : sectionIndex)}
                  size="sm"
                  className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700 !bg-white"
                >
                  Add Paragraph
                  <ChevronDown className="w-4 h-4 ml-1 !text-blue-600" />
                </Button>

                {/* Dropdown Menu */}
                {showAddParagraphMenu === sectionIndex && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <button
                      onClick={() => handleAddParagraph(sectionIndex)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Manual</div>
                      <div className="text-xs text-gray-500 mt-1">Add a text box for manual writing</div>
                    </button>
                    <button
                      onClick={() => handleAddParagraphWithAI(sectionIndex)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg transition-colors"
                    >
                      <div className="font-medium text-blue-600 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Generate
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Let AI write based on your prompt</div>
                    </button>
                  </div>
                )}
              </div>

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
                        className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                      >
                        {generatingImage === sectionIndex ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin !text-blue-600" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 !text-blue-600" />
                            Regenerate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setModal({
                            type: 'prompt',
                            title: 'Edit Image URL',
                            message: 'Add an image here by providing a URL',
                            value: section.image_url || '',
                            onConfirm: (url) => {
                              if (url) {
                                handleSetImageUrl(sectionIndex, url);
                              }
                            }
                          });
                        }}
                        size="sm"
                        className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                      >
                        <Edit2 className="w-4 h-4 !text-blue-600" />
                      </Button>
                      <Button
                        onClick={() => handleRemoveImage(sectionIndex)}
                        size="sm"
                        className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 !text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Image Button if no image */}
              {!section.image_url && (
                <div className="mb-8 relative add-image-dropdown">
                  <Button
                    onClick={() => setShowAddImageMenu(showAddImageMenu === sectionIndex ? null : sectionIndex)}
                    size="sm"
                    className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white"
                    disabled={generatingImage === sectionIndex}
                  >
                    {generatingImage === sectionIndex ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin !text-blue-600" />
                        Generating Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-1 !text-blue-600" />
                        Add Image
                        <ChevronDown className="w-4 h-4 ml-1 !text-blue-600" />
                      </>
                    )}
                  </Button>

                  {/* Dropdown Menu */}
                  {showAddImageMenu === sectionIndex && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <button
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
                          setShowAddImageMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                      >
                        <div className="font-medium text-blue-600 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Generate
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Let AI create an image from your prompt</div>
                      </button>
                      <button
                        onClick={() => {
                          setModal({
                            type: 'prompt',
                            title: 'Add Image URL',
                            message: 'Add an image here by providing a URL',
                            value: '',
                            onConfirm: (url) => {
                              if (url) {
                                handleSetImageUrl(sectionIndex, url);
                              }
                            }
                          });
                          setShowAddImageMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900">🔗 Add URL</div>
                        <div className="text-xs text-gray-500 mt-1">Paste an image URL manually</div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Section - Editable with Multiple Types */}
              <div className="mb-8">
                {isEditing('cta', sectionIndex) ? (
                  <div>
                    <div className="bg-gray-50 border-2 border-blue-600 rounded-lg p-6 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">CTA Configuration</h3>
                    
                    {/* CTA Type Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">CTA Type</label>
                      <select
                        value={editingField.value?.type || 'simple'}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const defaults = {
                            simple: {
                              type: 'simple',
                              buttonText: 'Get Started',
                              subtitleText: 'Join thousands of satisfied customers'
                            },
                            exclusive: {
                              type: 'exclusive',
                              buttonText: 'Get Access',
                              badgeText: 'EXCLUSIVE OFFER',
                              subtitleText: 'Unlock your exclusive access now'
                            },
                            urgency: {
                              type: 'urgency',
                              buttonText: 'Claim Now',
                              badgeText: 'LIMITED TIME',
                              subtitleText: "Don't miss out - offer ends soon"
                            },
                            testimonial: {
                              type: 'testimonial',
                              buttonText: 'Join Today',
                              subtitleText: 'Join 10,000+ happy customers',
                              testimonialQuote: 'This product changed my life!',
                              testimonialAuthor: 'Sarah M., Verified Customer'
                            },
                            guarantee: {
                              type: 'guarantee',
                              buttonText: 'Try Risk-Free',
                              guaranteeText: '30-Day Money-Back Guarantee',
                              subtitleText: '100% satisfaction guaranteed'
                            },
                            discount: {
                              type: 'discount',
                              buttonText: 'Apply Discount',
                              badgeText: 'SPECIAL DISCOUNT',
                              discountCode: 'SAVE20',
                              subtitleText: 'Use code at checkout for instant savings'
                            }
                          };
                          
                          // Keep existing values if they exist, otherwise use defaults
                          const currentValues = editingField.value || {};
                          const newDefaults = defaults[newType] || defaults.simple;
                          
                          setEditingField({
                            ...editingField,
                            value: {
                              ...newDefaults,
                              // Preserve common fields if they were already filled
                              buttonText: currentValues.buttonText || newDefaults.buttonText,
                              subtitleText: currentValues.subtitleText || newDefaults.subtitleText
                            }
                          });
                        }}
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                      >
                        <option value="simple">Simple Button</option>
                        <option value="exclusive">Exclusive Opportunity</option>
                        <option value="urgency">Urgency/Limited Time</option>
                        <option value="testimonial">With Testimonial</option>
                        <option value="guarantee">Money-Back Guarantee</option>
                        <option value="discount">Apply Discount Code</option>
                      </select>
                    </div>

                    {/* Button Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                      <Input
                        value={editingField.value?.buttonText || ''}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          value: {
                            ...editingField.value,
                            buttonText: e.target.value
                          }
                        })}
                        placeholder="e.g., Get Started, Visit Site, Learn More"
                        className="border-2 border-gray-300 rounded-lg bg-white"
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                        maxLength={15}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(editingField.value?.buttonText || '').length}/15 characters
                      </div>
                    </div>

                    {/* Badge Text (for exclusive/urgency/discount types) */}
                    {(editingField.value?.type === 'exclusive' || editingField.value?.type === 'urgency' || editingField.value?.type === 'discount') && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
                        <Input
                          value={editingField.value?.badgeText || ''}
                          onChange={(e) => setEditingField({
                            ...editingField,
                            value: {
                              ...editingField.value,
                              badgeText: e.target.value
                            }
                          })}
                          placeholder="e.g., EXCLUSIVE OFFER, LIMITED TIME ONLY"
                          className="border-2 border-gray-300 rounded-lg bg-white"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          maxLength={30}
                        />
                      </div>
                    )}

                    {/* Discount Code (for discount type) */}
                    {editingField.value?.type === 'discount' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                        <Input
                          value={editingField.value?.discountCode || ''}
                          onChange={(e) => setEditingField({
                            ...editingField,
                            value: {
                              ...editingField.value,
                              discountCode: e.target.value.toUpperCase()
                            }
                          })}
                          placeholder="e.g., SAVE20, WINTER25"
                          className="border-2 border-gray-300 rounded-lg bg-white font-mono tracking-wider"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          maxLength={20}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(editingField.value?.discountCode || '').length}/20 characters
                        </div>
                      </div>
                    )}

                    {/* Subtitle Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle Text</label>
                      <Input
                        value={editingField.value?.subtitleText || ''}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          value: {
                            ...editingField.value,
                            subtitleText: e.target.value
                          }
                        })}
                        placeholder="e.g., Join thousands of satisfied customers"
                        className="border-2 border-gray-300 rounded-lg bg-white"
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                        maxLength={100}
                      />
                    </div>

                    {/* Testimonial Quote (for testimonial type) */}
                    {editingField.value?.type === 'testimonial' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial Quote</label>
                        <Textarea
                          value={editingField.value?.testimonialQuote || ''}
                          onChange={(e) => setEditingField({
                            ...editingField,
                            value: {
                              ...editingField.value,
                              testimonialQuote: e.target.value
                            }
                          })}
                          placeholder="e.g., This product changed my life!"
                          className="border-2 border-gray-300 rounded-lg bg-white"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          rows={2}
                          maxLength={150}
                        />
                      </div>
                    )}

                    {/* Testimonial Author (for testimonial type) */}
                    {editingField.value?.type === 'testimonial' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
                        <Input
                          value={editingField.value?.testimonialAuthor || ''}
                          onChange={(e) => setEditingField({
                            ...editingField,
                            value: {
                              ...editingField.value,
                              testimonialAuthor: e.target.value
                            }
                          })}
                          placeholder="e.g., Sarah M., Verified Customer"
                          className="border-2 border-gray-300 rounded-lg bg-white"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          maxLength={50}
                        />
                      </div>
                    )}

                    {/* Guarantee Text (for guarantee type) */}
                    {editingField.value?.type === 'guarantee' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Guarantee Text</label>
                        <Input
                          value={editingField.value?.guaranteeText || ''}
                          onChange={(e) => setEditingField({
                            ...editingField,
                            value: {
                              ...editingField.value,
                              guaranteeText: e.target.value
                            }
                          })}
                          placeholder="e.g., 30-Day Money-Back Guarantee"
                          className="border-2 border-gray-300 rounded-lg bg-white"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          maxLength={60}
                        />
                      </div>
                    )}

                    {/* Live Preview */}
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Live Preview</h3>
                    
                    {/* Simple CTA Preview */}
                    {editingField.value?.type === 'simple' && (
                      <div className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center shadow-lg">
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg pointer-events-none">
                          {editingField.value?.buttonText || 'Get Started'}
                        </Button>
                        {editingField.value?.subtitleText && (
                          <p className="text-sm text-gray-600 mt-4">
                            {editingField.value.subtitleText}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Exclusive Opportunity CTA Preview */}
                    {editingField.value?.type === 'exclusive' && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                        <div className="mb-6">
                          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                            {editingField.value?.badgeText || 'EXCLUSIVE OPPORTUNITY'}
                          </div>
                        </div>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg pointer-events-none">
                          {editingField.value?.buttonText || 'Get Started'}
                        </Button>
                        <p className="text-base text-gray-700 mt-4 font-medium">
                          {editingField.value?.subtitleText || 'Click above to unlock your exclusive access now!'}
                        </p>
                      </div>
                    )}

                    {/* Urgency CTA Preview */}
                    {editingField.value?.type === 'urgency' && (
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-10 text-center shadow-lg">
                        <div className="mb-6">
                          <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-base font-bold mb-4 animate-pulse">
                            ⚡ {editingField.value?.badgeText || 'LIMITED TIME OFFER'}
                          </div>
                        </div>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl pointer-events-none">
                          {editingField.value?.buttonText || 'Claim Your Spot Now'}
                        </Button>
                        <p className="text-base text-gray-700 mt-4 font-medium">
                          {editingField.value?.subtitleText || 'Don\'t miss out - offer ends soon!'}
                        </p>
                      </div>
                    )}

                    {/* Testimonial CTA Preview */}
                    {editingField.value?.type === 'testimonial' && (
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-300 rounded-xl p-10 text-center shadow-lg">
                        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-yellow-400 mb-2">
                            {'⭐'.repeat(5)}
                          </div>
                          <p className="text-gray-700 italic mb-2">
                            "{editingField.value?.testimonialQuote || 'This product changed my life!'}"
                          </p>
                          <p className="text-sm text-gray-600 font-medium">
                            — {editingField.value?.testimonialAuthor || 'Verified Customer'}
                          </p>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 text-lg rounded-lg pointer-events-none">
                          {editingField.value?.buttonText || 'Get Started Today'}
                        </Button>
                        {editingField.value?.subtitleText && (
                          <p className="text-sm text-gray-600 mt-4">
                            {editingField.value.subtitleText}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Discount CTA Preview */}
                    {editingField.value?.type === 'discount' && (
                      <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                        <div className="mb-6">
                          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                            {editingField.value?.badgeText || 'SPECIAL DISCOUNT'}
                          </span>
                        </div>
                        <div className="bg-white border-2 border-blue-300 rounded-lg p-6 mb-6">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Use this code:</p>
                          <div className="flex items-center justify-center gap-3">
                            <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg py-3 px-6">
                              <code className="text-2xl font-bold text-gray-900 tracking-wider">
                                {editingField.value?.discountCode || 'SAVE20'}
                              </code>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(editingField.value?.discountCode || 'SAVE20');
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors pointer-events-none"
                              title="Copy code"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl pointer-events-none">
                          {editingField.value?.buttonText || 'Apply Discount'}
                        </Button>
                        <p className="text-base text-gray-700 mt-4 font-medium">
                          {editingField.value?.subtitleText || 'Use code at checkout for instant savings'}
                        </p>
                      </div>
                    )}

                    {/* Guarantee CTA Preview */}
                    {editingField.value?.type === 'guarantee' && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                        <div className="mb-6">
                          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {editingField.value?.guaranteeText || '30-Day Money-Back Guarantee'}
                          </div>
                        </div>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg pointer-events-none">
                          {editingField.value?.buttonText || 'Try Risk-Free'}
                        </Button>
                        <p className="text-base text-gray-700 mt-4 font-medium">
                          {editingField.value?.subtitleText || 'No questions asked - 100% satisfaction guaranteed'}
                        </p>
                      </div>
                    )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-300">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleSaveCtaConfig(sectionIndex, editingField.value);
                          setEditingField(null);
                        }}
                        className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white"
                      >
                        <Check className="w-4 h-4 mr-1 !text-blue-600" />
                        Save CTA
                      </Button>
                      <Button
                        size="sm"
                        onClick={cancelEdit}
                        className="border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white"
                      >
                        <X className="w-4 h-4 mr-1 !text-gray-700" />
                        Cancel
                      </Button>
                      {section.cta_config && (
                        <Button
                          size="sm"
                          onClick={() => {
                            cancelEdit();
                            handleSaveCtaConfig(sectionIndex, null);
                          }}
                          className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg ml-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-1 !text-red-600" />
                          Remove CTA
                        </Button>
                      )}
                    </div>
                  </div>
                  </div>
                ) : (
                  <>
                    {section.cta_config ? (
                      <div className="relative group">
                        <div className="absolute -left-16 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => startEdit('cta', sectionIndex, null, section.cta_config)}
                            className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white shadow-lg"
                          >
                            <Edit2 className="w-4 h-4 !text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveCtaConfig(sectionIndex, null)}
                            className="border-2 border-red-600 !text-red-600 hover:!bg-red-50 !bg-white shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 !text-red-600" />
                          </Button>
                        </div>
                        
                        {/* Simple CTA */}
                        {section.cta_config.type === 'simple' && (
                          <div className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center shadow-lg">
                            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg">
                              {section.cta_config.buttonText || 'Get Started'}
                            </Button>
                            {section.cta_config.subtitleText && (
                              <p className="text-sm text-gray-600 mt-4">
                                {section.cta_config.subtitleText}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Exclusive Opportunity CTA */}
                        {section.cta_config.type === 'exclusive' && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                            <div className="mb-6">
                              <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                                {section.cta_config.badgeText || 'EXCLUSIVE OPPORTUNITY'}
                              </div>
                            </div>
                            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg">
                              {section.cta_config.buttonText || 'Get Started'}
                            </Button>
                            <p className="text-base text-gray-700 mt-4 font-medium">
                              {section.cta_config.subtitleText || 'Click above to unlock your exclusive access now!'}
                            </p>
                          </div>
                        )}

                        {/* Urgency CTA */}
                        {section.cta_config.type === 'urgency' && (
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                            <div className="mb-6">
                              <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4 animate-pulse">
                                ⚡ {section.cta_config.badgeText || 'LIMITED TIME OFFER'}
                              </div>
                            </div>
                            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl">
                              {section.cta_config.buttonText || 'Claim Your Spot Now'}
                            </Button>
                            <p className="text-base text-gray-700 mt-4 font-medium">
                              {section.cta_config.subtitleText || 'Don\'t miss out - offer ends soon!'}
                            </p>
                          </div>
                        )}

                        {/* Testimonial CTA */}
                        {section.cta_config.type === 'testimonial' && (
                          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-300 rounded-xl p-10 text-center shadow-lg">
                            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-yellow-400 mb-2">
                                {'⭐'.repeat(5)}
                              </div>
                              <p className="text-gray-700 italic mb-2">
                                "{section.cta_config.testimonialQuote || 'This product changed my life!'}"
                              </p>
                              <p className="text-sm text-gray-600 font-medium">
                                — {section.cta_config.testimonialAuthor || 'Verified Customer'}
                              </p>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 text-lg rounded-lg">
                              {section.cta_config.buttonText || 'Get Started Today'}
                            </Button>
                            {section.cta_config.subtitleText && (
                              <p className="text-sm text-gray-600 mt-4">
                                {section.cta_config.subtitleText}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Discount CTA */}
                        {section.cta_config.type === 'discount' && (
                          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                            <div className="mb-6">
                              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                                {section.cta_config.badgeText || 'SPECIAL DISCOUNT'}
                              </span>
                            </div>
                            <div className="bg-white border-2 border-blue-300 rounded-lg p-6 mb-6">
                              <p className="text-sm text-gray-600 mb-2 font-medium">Use this code:</p>
                              <div className="flex items-center justify-center gap-3">
                                <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg py-3 px-6">
                                  <code className="text-2xl font-bold text-gray-900 tracking-wider">
                                    {section.cta_config.discountCode || 'SAVE20'}
                                  </code>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(section.cta_config.discountCode || 'SAVE20');
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                  title="Copy code"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl">
                              {section.cta_config.buttonText || 'Apply Discount'}
                            </Button>
                            <p className="text-base text-gray-700 mt-4 font-medium">
                              {section.cta_config.subtitleText || 'Use code at checkout for instant savings'}
                            </p>
                          </div>
                        )}

                        {/* Guarantee CTA */}
                        {section.cta_config.type === 'guarantee' && (
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
                            <div className="mb-6">
                              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {section.cta_config.guaranteeText || '30-Day Money-Back Guarantee'}
                              </div>
                            </div>
                            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg">
                              {section.cta_config.buttonText || 'Try Risk-Free'}
                            </Button>
                            <p className="text-base text-gray-700 mt-4 font-medium">
                              {section.cta_config.subtitleText || 'No questions asked - 100% satisfaction guaranteed'}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => startEdit('cta', sectionIndex, null, {
                          type: 'simple',
                          buttonText: 'Get Started',
                          subtitleText: 'Join thousands of satisfied customers'
                        })}
                        size="sm"
                        className="border-2 border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white"
                      >
                        Add CTA
                        <Plus className="w-4 h-4 mr-1 !text-blue-600" />
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
              className="w-full border-2 border-dashed border-blue-600 !text-blue-600 hover:!bg-blue-50 !bg-white py-6 rounded-lg"
            >
              <Plus className="w-5 h-5 mr-2 !text-blue-600" />
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
                  className="w-full border-2 border-blue-600 rounded-lg p-4 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                  style={{ color: '#111827', fontSize: '14px', backgroundColor: '#ffffff' }}
                  rows={4}
                  placeholder="Image URL here..."
                  autoFocus
                />
              </div>
            )}

            {/* AI Paragraph Generation Modal */}
            {modal.type === 'aiParagraph' && (
              <div className="mb-6">
                {/* Step 1: Select Content Type */}
                {modal.step === 1 && (
                  <div className="space-y-3">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setModal({ ...modal, contentType: type.value, step: 2 })}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          modal.contentType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2: Enter Prompt */}
                {modal.step === 2 && (
                  <div>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">
                        Content Type: {CONTENT_TYPES.find(t => t.value === modal.contentType)?.label}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {CONTENT_TYPES.find(t => t.value === modal.contentType)?.description}
                      </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe what you want the AI to write:
                    </label>
                    <Textarea
                      value={modal.prompt || ''}
                      onChange={(e) => setModal({ ...modal, prompt: e.target.value })}
                      className="w-full border-2 border-blue-600 rounded-lg p-4 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                      style={{ color: '#111827', fontSize: '14px', backgroundColor: '#ffffff' }}
                      rows={5}
                      placeholder="Example: Write about how our product helps busy professionals save time and increase productivity..."
                      autoFocus
                    />
                    <div className="mt-3 text-xs text-gray-500">
                      💡 Tip: Be specific about what angle or benefits you want to emphasize. The AI will use the full landing page as context.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={() => setModal(null)}
                disabled={generatingParagraph}
                className="px-6 py-2.5 border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </Button>

              {modal.type === 'aiParagraph' && modal.step === 2 && (
                <>
                  <Button
                    onClick={() => setModal({ ...modal, step: 1 })}
                    disabled={generatingParagraph}
                    className="px-6 py-2.5 border-2 border-gray-300 !text-gray-700 hover:!bg-gray-50 !bg-white transition-colors font-medium disabled:opacity-50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => generateParagraphWithAI(modal.sectionIndex, modal.contentType, modal.prompt)}
                    disabled={!modal.prompt?.trim() || generatingParagraph}
                    className="px-6 py-2.5 font-medium transition-all border-2 border-blue-600 !bg-white hover:!bg-blue-50 !text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {generatingParagraph ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin !text-blue-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 !text-blue-600" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {modal.type === 'prompt' && (
                <Button
                  onClick={() => {
                    if (modal.onConfirm) {
                      modal.onConfirm(modal.value);
                    }
                    setModal(null);
                  }}
                  className="px-6 py-2.5 font-medium transition-all border-2 border-blue-600 !bg-white hover:!bg-blue-50 !text-blue-600"
                >
                  Confirm
                </Button>
              )}
              {modal.type === 'confirm' && (
                <Button
                  onClick={() => {
                    if (modal.onConfirm) {
                      modal.onConfirm();
                    }
                  }}
                  className="px-6 py-2.5 font-medium transition-all border-2 border-red-600 !bg-red-600 hover:!bg-red-700 !text-white"
                >
                  Delete
                </Button>
              )}
              {modal.type === 'alert' && (
                <Button
                  onClick={() => setModal(null)}
                  className="px-6 py-2.5 font-medium transition-all border-2 border-blue-600 !bg-white hover:!bg-blue-50 !text-blue-600"
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
