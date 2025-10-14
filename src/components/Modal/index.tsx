"use client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success" | "confirm";
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancelar"
}: ModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "success":
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "confirm":
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "error":
        return "bg-red-600 hover:bg-red-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto z-10 p-6 max-h-[90vh] overflow-y-auto">
        <div>
          {getIcon()}
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 grid gap-3 sm:grid-cols-2 sm:grid-flow-row-dense">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${getButtonColor()} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm transition-colors`}
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm transition-colors"
              >
                {cancelText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`col-span-2 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${getButtonColor()} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

