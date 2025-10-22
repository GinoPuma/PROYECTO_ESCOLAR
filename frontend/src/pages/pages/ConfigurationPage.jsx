import React from "react";
import { Link } from "react-router-dom";

const ConfigurationPage = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        Menú de Configuración
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/configuracion/institucion"
          className="block p-6 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg shadow text-center transition duration-300"
        >
          <h3 className="text-lg font-bold mb-2">Institución</h3>
          <p className="text-sm">Gestionar información general.</p>
        </Link>

        <Link
          to="/configuracion/niveles"
          className="block p-6 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg shadow text-center transition duration-300"
        >
          <h3 className="text-lg font-bold mb-2">Niveles Educativos</h3>
          <p className="text-sm">
            Definir los niveles (Primaria, Secundaria, etc.).
          </p>
        </Link>

        <Link
          to="/configuracion/grados"
          className="block p-6 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg shadow text-center transition duration-300"
        >
          <h3 className="text-lg font-bold mb-2">Grados</h3>
          <p className="text-sm">Definir los grados por nivel.</p>
        </Link>

        <Link
          to="/configuracion/secciones"
          className="block p-6 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg shadow text-center transition duration-300"
        >
          <h3 className="text-lg font-bold mb-2">Secciones</h3>
          <p className="text-sm">Definir las secciones por grado.</p>
        </Link>
      </div>
    </div>
  );
};

export default ConfigurationPage;
