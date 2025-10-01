import React from 'react';

interface ImprovementConfirmationModalProps {
  isOpen: boolean;
  improvementText: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: {
    drawerBg: string;
    drawerText: string;
    buttonColor: string;
    accentColor: string;
  };
}

const ImprovementConfirmationModal: React.FC<ImprovementConfirmationModalProps> = ({
  isOpen,
  improvementText,
  onConfirm,
  onCancel,
  theme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 ${theme.drawerBg} ${theme.drawerText}`}>
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          Add to Self-Improvements?
        </h2>
        <p className="mb-6">
          Would you like to add the following as a self-improvement goal?
        </p>
        <blockquote className={`border-l-4 ${theme.accentColor} pl-4 py-2 mb-6 bg-white/5`}>
          <p className="italic">"{improvementText}"</p>
        </blockquote>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${theme.buttonColor} hover:opacity-90 transition-opacity`}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovementConfirmationModal;