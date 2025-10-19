import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";

// --- Formulario Tipo de Pago ---
const TipoPagoForm = ({ isOpen, onClose, tipo, onSave }) => {
  const isEditing = !!tipo;
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio_fijo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tipo) {
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || "",
        precio_fijo: tipo.precio_fijo || "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "", precio_fijo: "" });
    }
    setError("");
  }, [tipo, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...formData,
      precio_fijo: formData.precio_fijo
        ? parseFloat(formData.precio_fijo)
        : null,
    };

    try {
      if (isEditing) {
        await api.put(`/config/tipos-pago/${tipo.id}`, payload);
      } else {
        await api.post("/config/tipos-pago", payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al guardar el Tipo de Pago."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Editar Tipo de Pago: ${tipo?.nombre}`
          : "Crear Tipo de Pago"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre (*)
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Precio Fijo (Opcional, ej: 100.00)
          </label>
          <input
            type="number"
            name="precio_fijo"
            value={formData.precio_fijo}
            onChange={handleChange}
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 py-2 px-4 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Tipo"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Formulario Método de Pago ---
const MetodoPagoForm = ({ isOpen, onClose, metodo, onSave }) => {
  const isEditing = !!metodo;
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (metodo) {
      setFormData({
        nombre: metodo.nombre,
        descripcion: metodo.descripcion || "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "" });
    }
    setError("");
  }, [metodo, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        await api.put(`/config/metodos-pago/${metodo.id}`, formData);
      } else {
        await api.post("/config/metodos-pago", formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al guardar el Método de Pago."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Editar Método de Pago: ${metodo?.nombre}`
          : "Crear Método de Pago"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre (*)
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 py-2 px-4 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Método"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Componente Principal ---
const PagosConfig = () => {
  const [tiposPago, setTiposPago] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de modales
  const [isTipoPagoModalOpen, setIsTipoPagoModalOpen] = useState(false);
  const [editingTipoPago, setEditingTipoPago] = useState(null);
  const [isMetodoPagoModalOpen, setIsMetodoPagoModalOpen] = useState(false);
  const [editingMetodoPago, setEditingMetodoPago] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tiposRes, metodosRes] = await Promise.all([
        api.get("/config/tipos-pago"),
        api.get("/config/metodos-pago"),
      ]);
      setTiposPago(tiposRes.data);
      setMetodosPago(metodosRes.data);
    } catch (err) {
      setError("Error al cargar la configuración de pagos.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Tipos de Pago ---
  const handleAddTipoPago = () => {
    setEditingTipoPago(null);
    setIsTipoPagoModalOpen(true);
  };
  const handleEditTipoPago = (tipo) => {
    setEditingTipoPago(tipo);
    setIsTipoPagoModalOpen(true);
  };
  const handleDeleteTipoPago = async (id, nombre) => {
    if (
      !window.confirm(`¿Seguro que desea eliminar el tipo de pago "${nombre}"?`)
    )
      return;
    try {
      await api.delete(`/config/tipos-pago/${id}`);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar. Revise si está asociado a cuotas."
      );
    }
  };

  // --- CRUD Métodos de Pago ---
  const handleAddMetodoPago = () => {
    setEditingMetodoPago(null);
    setIsMetodoPagoModalOpen(true);
  };
  const handleEditMetodoPago = (metodo) => {
    setEditingMetodoPago(metodo);
    setIsMetodoPagoModalOpen(true);
  };
  const handleDeleteMetodoPago = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Seguro que desea eliminar el método de pago "${nombre}"?`
      )
    )
      return;
    try {
      await api.delete(`/config/metodos-pago/${id}`);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar. Revise si está asociado a pagos."
      );
    }
  };

  if (loading)
    return (
      <div className="text-center py-4">Cargando configuración de pagos...</div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Modales */}
      <TipoPagoForm
        isOpen={isTipoPagoModalOpen}
        onClose={() => setIsTipoPagoModalOpen(false)}
        tipo={editingTipoPago}
        onSave={fetchData}
      />
      <MetodoPagoForm
        isOpen={isMetodoPagoModalOpen}
        onClose={() => setIsMetodoPagoModalOpen(false)}
        metodo={editingMetodoPago}
        onSave={fetchData}
      />

      {error && (
        <div className="md:col-span-2 p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      {/* Columna 1: Tipos de Pago */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-gray-700 flex justify-between items-center">
          Tipos de Pago (Conceptos de Deuda)
          <button
            onClick={handleAddTipoPago}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md"
          >
            + Añadir Tipo
          </button>
        </h3>
        <div className="bg-white p-4 border rounded shadow-sm max-h-[500px] overflow-y-auto">
          {tiposPago.length === 0 ? (
            <p className="text-gray-500">No hay tipos de pago configurados.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tiposPago.map((tipo) => (
                <li
                  key={tipo.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{tipo.nombre}</p>
                    <p className="text-xs text-gray-500">{tipo.descripcion}</p>
                    {tipo.precio_fijo && (
                      <span className="text-sm font-bold text-indigo-600">
                        S/ {parseFloat(tipo.precio_fijo).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="space-x-2 text-sm">
                    <button
                      onClick={() => handleEditTipoPago(tipo)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTipoPago(tipo.id, tipo.nombre)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna 2: Métodos de Pago */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-gray-700 flex justify-between items-center">
          Métodos de Pago (Medio de Transacción)
          <button
            onClick={handleAddMetodoPago}
            className="text-sm bg-green-500 hover:bg-green-600 text-white p-2 rounded-md"
          >
            + Añadir Método
          </button>
        </h3>
        <div className="bg-white p-4 border rounded shadow-sm max-h-[500px] overflow-y-auto">
          {metodosPago.length === 0 ? (
            <p className="text-gray-500">
              No hay métodos de pago configurados.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {metodosPago.map((metodo) => (
                <li
                  key={metodo.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{metodo.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {metodo.descripcion}
                    </p>
                  </div>
                  <div className="space-x-2 text-sm">
                    <button
                      onClick={() => handleEditMetodoPago(metodo)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteMetodoPago(metodo.id, metodo.nombre)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagosConfig;
