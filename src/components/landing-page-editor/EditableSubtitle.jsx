import { Edit2, Check, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export function EditableSubtitle({ 
  subtitle, 
  isEditing, 
  editingValue,
  onStartEdit,
  onSave,
  onCancel,
  onChange
}) {
  if (isEditing) {
    return (
      <div className="flex gap-2 items-center mb-4">
        <Input
          value={editingValue}
          onChange={(e) => onChange(e.target.value)}
          className="text-2xl font-semibold text-gray-800 border-2 border-blue-600"
          autoFocus
        />
        <Button size="sm" onClick={onSave}>
          <Check className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <h2 
      className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4 group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors" 
      onClick={onStartEdit}
    >
      {subtitle}
      <Edit2 className="inline-block ml-2 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </h2>
  );
}
