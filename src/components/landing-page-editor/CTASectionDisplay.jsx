import { Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '../../ui/Button';
import { CTAPreview } from './CTAPreview';

export function CTASectionDisplay({ 
  section, 
  sectionIndex, 
  startEdit,
  handleSaveCtaConfig 
}) {
  if (!section.cta_config) {
    return (
      <Button
        onClick={() => startEdit('cta', sectionIndex, null, {
          type: 'simple',
          buttonText: 'Get Started',
          subtitleText: 'Join thousands of satisfied customers'
        })}
        variant="outline"
        size="sm"
        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add CTA
      </Button>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -left-16 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col gap-2">
        <Button
          size="sm"
          onClick={() => startEdit('cta', sectionIndex, null, section.cta_config)}
          style={{ backgroundColor: '#2563eb', color: 'white' }}
          className="shadow-lg hover:opacity-90"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => handleSaveCtaConfig(sectionIndex, null)}
          style={{ backgroundColor: '#dc2626', color: 'white' }}
          className="shadow-lg hover:opacity-90"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <CTAPreview config={section.cta_config} isEditor={true} />
    </div>
  );
}
