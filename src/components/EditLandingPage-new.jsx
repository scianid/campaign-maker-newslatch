import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLandingPageEditor } from '../hooks/useLandingPageEditor';
import {
  EditorHeader,
  SectionEditor,
  StickyCtaEditor,
  EditableTitle,
  Modal,
  LoadingState,
  ErrorState
} from './landing-page-editor';

export function EditLandingPage({ user }) {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const {
    landingPage,
    loading,
    error,
    generatingImage,
    editingField,
    modal,
    showSaved,
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
    handleSaveCtaConfig,
    handleSetWidget,
    handleSaveStickyCtaTitle,
    handleSaveStickyCtaSubtitle,
    handleSaveStickyCtaButton,
    handleToggleStickyCtaVisible,
    startEdit,
    cancelEdit,
    isEditing
  } = useLandingPageEditor(pageId, user);

  useEffect(() => {
    if (pageId) {
      fetchLandingPage();
    }
  }, [pageId]);

  // Handle modal confirm actions
  const handleModalConfirm = () => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    setModal(null);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // No landing page found
  if (!landingPage) {
    return <ErrorState error="Landing page not found" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EditorHeader landingPage={landingPage} showSaved={showSaved} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Page Title</h3>
          <EditableTitle
            value={landingPage.title}
            isEditing={isEditing('title')}
            onEdit={() => startEdit('title', null, null, landingPage.title)}
            onSave={handleSaveTitle}
            onCancel={cancelEdit}
          />
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-6">
          {landingPage.sections?.map((section, sectionIndex) => (
            <SectionEditor
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              editingField={editingField}
              generatingImage={generatingImage}
              modal={modal}
              onSaveSubtitle={handleSaveSubtitle}
              onSaveParagraph={handleSaveParagraph}
              onDeleteParagraph={handleDeleteParagraph}
              onAddParagraph={handleAddParagraph}
              onGenerateImage={handleGenerateImage}
              onRemoveImage={handleRemoveImage}
              onSetImageUrl={handleSetImageUrl}
              onSaveImagePrompt={handleSaveImagePrompt}
              onSaveCtaConfig={handleSaveCtaConfig}
              onSetWidget={handleSetWidget}
              onDeleteSection={handleDeleteSection}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              isEditing={isEditing}
            />
          ))}
        </div>

        {/* Add Section Button */}
        <Button
          onClick={handleAddSection}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </Button>

        {/* Sticky CTA Editor */}
        <div className="mt-6">
          <StickyCtaEditor
            title={landingPage.sticky_cta_title}
            subtitle={landingPage.sticky_cta_subtitle}
            button={landingPage.sticky_cta_button}
            visible={landingPage.sticky_cta_visible}
            isEditingTitle={isEditing('stickyCtaTitle')}
            isEditingSubtitle={isEditing('stickyCtaSubtitle')}
            isEditingButton={isEditing('stickyCtaButton')}
            onEditTitle={() => startEdit('stickyCtaTitle', null, null, landingPage.sticky_cta_title)}
            onEditSubtitle={() => startEdit('stickyCtaSubtitle', null, null, landingPage.sticky_cta_subtitle)}
            onEditButton={() => startEdit('stickyCtaButton', null, null, landingPage.sticky_cta_button)}
            onSaveTitle={handleSaveStickyCtaTitle}
            onSaveSubtitle={handleSaveStickyCtaSubtitle}
            onSaveButton={handleSaveStickyCtaButton}
            onToggleVisible={handleToggleStickyCtaVisible}
            onCancel={cancelEdit}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        modal={modal}
        onClose={() => setModal(null)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
