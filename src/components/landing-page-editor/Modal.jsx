import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';

export default function Modal({ modal, onClose, onConfirm }) {
  if (!modal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{modal.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          {modal.type === 'alert' && (
            <p className="text-gray-700">{modal.message}</p>
          )}

          {modal.type === 'prompt' && (
            <div className="space-y-4">
              <p className="text-gray-700">{modal.message}</p>
              {modal.inputType === 'textarea' ? (
                <Textarea
                  value={modal.value || ''}
                  onChange={(e) => modal.onChange?.(e.target.value)}
                  placeholder={modal.placeholder}
                  rows={4}
                />
              ) : (
                <Input
                  type={modal.inputType || 'text'}
                  value={modal.value || ''}
                  onChange={(e) => modal.onChange?.(e.target.value)}
                  placeholder={modal.placeholder}
                />
              )}
            </div>
          )}

          {modal.type === 'confirm' && (
            <p className="text-gray-700">{modal.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {modal.type === 'alert' && (
            <Button onClick={onClose}>OK</Button>
          )}

          {(modal.type === 'prompt' || modal.type === 'confirm') && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onConfirm}>
                {modal.confirmText || 'Confirm'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
