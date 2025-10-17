interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "OK"
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
        {/* Ícone de erro */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-base md:text-lg font-semibold mb-4 text-center text-gray-800">
          {title}
        </h3>
        
        {/* Mensagem */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* Botão de confirmação */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
