import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Link } from 'react-router-dom';

const InstitutionConfigPage = () => {
  const [institution, setInstitution] = useState({
    id: null,
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    sitio_web: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const response = await api.get("/config/institution");
        if (response.data && response.data.id) {
          setInstitution(response.data);
        } else {
          setInstitution((prev) => ({ ...prev, id: null }));
        }
      } catch (err) {
        console.error("Error fetching institution data:", err);
        setError(
          err.response?.data?.message ||
            "Error al cargar datos de la institución."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInstitution();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInstitution((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      let response;
      if (institution.id) {
        response = await api.post("/config/institution", institution);
      } else {
        response = await api.post("/config/institution", institution);
      }
      setInstitution(response.data);
      setSuccessMessage("Información de la institución guardada exitosamente.");
    } catch (err) {
      console.error("Error saving institution data:", err);
      setError(
        err.response?.data?.message ||
          "Error al guardar datos de la institución."
      );
    }
  };

  if (loading)
    return <div className="text-center p-4">Cargando configuración...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Configuración General de la Institución
        </h2>
        <Link
          to="/configuracion"
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Volver a Configuración
        </Link>
      </div>

      {error && (
        <p className="bg-red-100 text-red-800 p-3 rounded-md mb-4">{error}</p>
      )}
      {successMessage && (
        <p className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
          {successMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la Institución
          </label>
          <input
            type="text"
            name="nombre"
            value={institution.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sitio Web
          </label>
          <input
            type="url"
            name="sitio_web"
            value={institution.sitio_web}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            value={institution.telefono}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={institution.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <textarea
            name="direccion"
            value={institution.direccion}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
        </div>

        <div className="md:col-span-2 text-right">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstitutionConfigPage;
