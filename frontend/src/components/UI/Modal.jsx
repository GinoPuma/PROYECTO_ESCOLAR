import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // Fondo oscuro que cubre toda la pantalla
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10"
      onClick={onClose} // Cierra al hacer clic en el fondo
    >
      {/* Contenido principal del modal */}
      <div
        className="relative mx-4 p-5 border w-full max-w-lg shadow-2xl rounded-lg bg-white transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()} // Evita que el clic en el contenido cierre el modal
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
            aria-label="Cerrar modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="mt-4 max-h-[80vh] overflow-y-auto pb-2">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
