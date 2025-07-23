// src/components/common/ConfirmationModal.jsx
import React from 'react';

const ConfirmationModal = ({
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonClass = 'bg-red-600 hover:bg-red-700', // Default for destructive actions
  cancelButtonClass = 'bg-gray-300 hover:bg-gray-400 text-gray-800',
  icon = null // Can pass an SVG or React component for an icon
}) => {
  if (!onConfirm || !onCancel) {
    console.error("ConfirmationModal requires onConfirm and onCancel functions.");
    return null; // Don't render if essential props are missing
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all duration-300 scale-100 opacity-100 border border-gray-200">
        {icon && (
          <div className="mb-4 flex justify-center">
            {icon}
          </div>
        )}
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 text-lg">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className={`px-6 py-2.5 text-base font-medium rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${cancelButtonClass}`}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 text-base font-medium text-white rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${confirmButtonClass}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
