import { Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { EditableSubtitle } from './EditableSubtitle';
import { EditableParagraph } from './EditableParagraph';
import { ImageSection } from './ImageSection';
import { CTASectionDisplay } from './CTASectionDisplay';
import { CTAConfigEditor } from './CTAConfigEditor';

export default function SectionEditor({
  section,
  sectionIndex,
  editingField,
  generatingImage,
  modal,
  onSaveSubtitle,
  onSaveParagraph,
  onDeleteParagraph,
  onAddParagraph,
  onGenerateImage,
  onRemoveImage,
  onSetImageUrl,
  onSaveImagePrompt,
  onSaveCtaConfig,
  onSetWidget,
  onDeleteSection,
  startEdit,
  cancelEdit,
  isEditing
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative group">
      {/* Delete Section Button */}
      <button
        onClick={() => onDeleteSection(sectionIndex)}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete Section"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Section Subtitle */}
      <EditableSubtitle
        value={section.subtitle}
        isEditing={isEditing('subtitle', sectionIndex)}
        onEdit={() => startEdit('subtitle', sectionIndex, null, section.subtitle)}
        onSave={(newValue) => onSaveSubtitle(sectionIndex, newValue)}
        onCancel={cancelEdit}
      />

      {/* Section Paragraphs */}
      <div className="space-y-4 mt-4">
        {section.paragraphs?.map((paragraph, pIndex) => (
          <EditableParagraph
            key={pIndex}
            value={paragraph}
            isEditing={isEditing('paragraph', sectionIndex, pIndex)}
            onEdit={() => startEdit('paragraph', sectionIndex, pIndex, paragraph)}
            onSave={(newValue) => onSaveParagraph(sectionIndex, pIndex, newValue)}
            onCancel={cancelEdit}
            onDelete={() => onDeleteParagraph(sectionIndex, pIndex)}
          />
        ))}
      </div>

      {/* Add Paragraph Button */}
      <Button
        onClick={() => onAddParagraph(sectionIndex)}
        variant="outline"
        className="mt-4"
      >
        Add Paragraph
      </Button>

      {/* Image Section */}
      <ImageSection
        imageUrl={section.image_url}
        imagePrompt={section.image_prompt}
        sectionIndex={sectionIndex}
        isGenerating={generatingImage === sectionIndex}
        isEditing={isEditing('imagePrompt', sectionIndex)}
        onGenerateImage={onGenerateImage}
        onRemoveImage={onRemoveImage}
        onSetImageUrl={onSetImageUrl}
        onSaveImagePrompt={onSaveImagePrompt}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        modal={modal}
      />

      {/* CTA Section */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Call-to-Action</h4>
        
        {/* If CTA Config Exists, Show Preview/Edit */}
        {section.cta_config ? (
          <CTASectionDisplay
            config={section.cta_config}
            onEdit={() => onSetWidget(sectionIndex, 'cta')}
            onDelete={() => onSaveCtaConfig(sectionIndex, null)}
          />
        ) : (
          <Button
            onClick={() => onSetWidget(sectionIndex, 'cta')}
            variant="outline"
            className="w-full"
          >
            Add CTA
          </Button>
        )}

        {/* CTA Configuration Editor (Modal/Overlay) */}
        {section.widget_type === 'cta' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Configure Call-to-Action</h3>
                  <button
                    onClick={() => onSetWidget(sectionIndex, null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <CTAConfigEditor
                  config={section.cta_config}
                  onChange={(newConfig) => onSaveCtaConfig(sectionIndex, newConfig)}
                  onClose={() => onSetWidget(sectionIndex, null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
