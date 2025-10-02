import { Edit2, Check, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';

export function EditableParagraph({ 
  text, 
  isEditing, 
  editingValue,
  onStartEdit,
  onSave,
  onCancel,
  onChange,
  onDelete
}) {
  if (isEditing) {
    return (
      <div className="mb-4">
        <Textarea
          value={editingValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-2 border-blue-600 rounded-lg"
          rows={4}
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={onSave}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            onClick={onDelete}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <p 
      className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors" 
      onClick={onStartEdit}
    >
      {text}
      <Edit2 className="inline-block ml-2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </p>
  );
}
