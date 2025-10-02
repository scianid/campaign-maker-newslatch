import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLandingPageEditor(pageId, user) {
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [modal, setModal] = useState(null);
  const [showSaved, setShowSaved] = useState(false);

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
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
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
    await saveField({ title: newTitle });
    setLandingPage({ ...landingPage, title: newTitle });
  };

  const handleSaveSubtitle = async (sectionIndex, newSubtitle) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].subtitle = newSubtitle;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSaveParagraph = async (sectionIndex, paragraphIndex, newText) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs[paragraphIndex] = newText;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleDeleteParagraph = async (sectionIndex, paragraphIndex) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs.splice(paragraphIndex, 1);
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
    setEditingField(null);
  };

  const handleAddParagraph = async (sectionIndex) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].paragraphs.push('New paragraph...');
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleDeleteSection = async (sectionIndex) => {
    const updatedSections = landingPage.sections.filter((_, idx) => idx !== sectionIndex);
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleAddSection = async () => {
    const newSection = {
      subtitle: 'New Section',
      paragraphs: ['Add content here...'],
      image_url: null,
      image_prompt: null
    };
    const updatedSections = [...landingPage.sections, newSection];
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleGenerateImage = async (sectionIndex, prompt) => {
    try {
      setGeneratingImage(sectionIndex);
      
      const response = await fetch(
        'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/generate-landing-page-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
          },
          body: JSON.stringify({ prompt })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const updatedSections = [...landingPage.sections];
      updatedSections[sectionIndex].image_url = data.image_url;
      updatedSections[sectionIndex].image_prompt = prompt;
      
      await saveField({ sections: updatedSections });
      setLandingPage({ ...landingPage, sections: updatedSections });
    } catch (err) {
      console.error('Error generating image:', err);
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
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSetImageUrl = async (sectionIndex, imageUrl) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].image_url = imageUrl;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSaveImagePrompt = async (sectionIndex, newPrompt) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].image_prompt = newPrompt;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSaveCTA = async (sectionIndex, newCTA) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].cta = newCTA;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSaveCtaConfig = async (sectionIndex, ctaConfig) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].cta_config = ctaConfig;
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSetWidget = async (sectionIndex, widgetType) => {
    const updatedSections = [...landingPage.sections];
    updatedSections[sectionIndex].widget_type = widgetType;
    updatedSections[sectionIndex].widget_data = {};
    await saveField({ sections: updatedSections });
    setLandingPage({ ...landingPage, sections: updatedSections });
  };

  const handleSaveStickyCtaTitle = async (newTitle) => {
    await saveField({ sticky_cta_title: newTitle });
    setLandingPage({ ...landingPage, sticky_cta_title: newTitle });
  };

  const handleSaveStickyCtaSubtitle = async (newSubtitle) => {
    await saveField({ sticky_cta_subtitle: newSubtitle });
    setLandingPage({ ...landingPage, sticky_cta_subtitle: newSubtitle });
  };

  const handleSaveStickyCtaButton = async (newButtonText) => {
    await saveField({ sticky_cta_button: newButtonText });
    setLandingPage({ ...landingPage, sticky_cta_button: newButtonText });
  };

  const handleToggleStickyCtaVisible = async () => {
    const newValue = landingPage.sticky_cta_visible === false ? true : false;
    await saveField({ sticky_cta_visible: newValue });
    setLandingPage({ ...landingPage, sticky_cta_visible: newValue });
  };

  const startEdit = (type, sectionIndex = null, paragraphIndex = null, currentValue = '') => {
    setEditingField({ type, sectionIndex, paragraphIndex, value: currentValue });
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const isEditing = (type, sectionIndex = null, paragraphIndex = null) => {
    return editingField?.type === type && 
           editingField?.sectionIndex === sectionIndex && 
           editingField?.paragraphIndex === paragraphIndex;
  };

  return {
    landingPage,
    loading,
    error,
    generatingImage,
    editingField,
    modal,
    showSaved,
    setLandingPage,
    setEditingField,
    setModal,
    fetchLandingPage,
    handleSaveTitle,
    handleSaveSubtitle,
    handleSaveParagraph,
    handleDeleteParagraph,
    handleAddParagraph,
    handleDeleteSection,
    handleAddSection,
    handleGenerateImage,
    handleRemoveImage,
    handleSetImageUrl,
    handleSaveImagePrompt,
    handleSaveCTA,
    handleSaveCtaConfig,
    handleSetWidget,
    handleSaveStickyCtaTitle,
    handleSaveStickyCtaSubtitle,
    handleSaveStickyCtaButton,
    handleToggleStickyCtaVisible,
    startEdit,
    cancelEdit,
    isEditing
  };
}
