import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";

const MetodosPagoConfigPage = () => {
  const [metodosPago, setMetodosPago] = useState([]);
  const [newMetodoPago, setNewMetodoPago] = useState({
    name: "",
    description: "",
  });
  const [editingMetodoPago, setEditingMetodoPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchMetodosPago();
  }, []);

  const fetchMetodosPago = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.get("/metodos_pago");
      setMetodosPago(response.data);
    } catch (err) {
      console.error("Error fetching metodos de pago:", err);
      setError(
        err.response?.data?.message || "Error al cargar los métodos de pago."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetodoPago = async () => {
    if (!newMetodoPago.name.trim()) {
      setError("El nombre del método de pago es obligatorio.");
      return;
    }
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/metodos_pago", {
        nombre: newMetodoPago.name,
        descripcion: newMetodoPago.description || null,
      });
      setMetodosPago([...metodosPago, response.data]);
      setNewMetodoPago({ name: "", description: "" });
      setSuccessMessage("Método de pago añadido.");
    } catch (err) {
      console.error("Error adding metodo de pago:", err);
      setError(
        err.response?.data?.message || "Error al añadir el método de pago."
      );
    }
  };

  const handleEditMetodoPago = (metodo) => {
    setEditingMetodoPago({
      id: metodo.id,
      name: metodo.nombre,
      description: metodo.descripcion,
    });
    setNewMetodoPago({
      name: metodo.nombre,
      description: metodo.descripcion || "",
    });
  };

  const handleUpdateMetodoPago = async () => {
    if (!editingMetodoPago || !newMetodoPago.name.trim()) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.put(
        `/metodos_pago/${editingMetodoPago.id}`,
        {
          nombre: newMetodoPago.name,
          descripcion: newMetodoPago.description || null,
        }
      );
      setMetodosPago(
        metodosPago.map((metodo) =>
          metodo.id === editingMetodoPago.id ? response.data : metodo
        )
      );
      setEditingMetodoPago(null);
      setNewMetodoPago({ name: "", description: "" });
      setSuccessMessage("Método de pago actualizado.");
    } catch (err) {
      console.error("Error updating metodo de pago:", err);
      setError(
        err.response?.data?.message || "Error al actualizar el método de pago."
      );
    }
  };

  const handleDeleteMetodoPago = async (id) => {
    setError("");
    setSuccessMessage("");
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este método de pago? Esto podría afectar los registros de pagos existentes."
      )
    ) {
      try {
        await api.delete(`/metodos_pago/${id}`);
        setMetodosPago(metodosPago.filter((metodo) => metodo.id !== id));
        setSuccessMessage("Método de pago eliminado.");
      } catch (err) {
        console.error("Error deleting metodo de pago:", err);
        setError(
          err.response?.data?.message || "Error al eliminar el método de pago."
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Métodos de Pago
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

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Método de Pago (ej: Efectivo)"
            value={newMetodoPago.name}
            onChange={(e) =>
              setNewMetodoPago({ ...newMetodoPago, name: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (Opcional)"
            value={newMetodoPago.description}
            onChange={(e) =>
              setNewMetodoPago({
                ...newMetodoPago,
                description: e.target.value,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {editingMetodoPago ? (
          <>
            <button
              onClick={handleUpdateMetodoPago}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md min-w-[150px]"
            >
              Actualizar Método
            </button>
            <button
              onClick={() => {
                setEditingMetodoPago(null);
                setNewMetodoPago({ name: "", description: "" });
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md min-w-[150px]"
            >
              Cancelar Edición
            </button>
          </>
        ) : (
          <button
            onClick={handleAddMetodoPago}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Añadir Método
          </button>
        )}
      </div>

      {loading ? (
        <p>Cargando métodos de pago...</p>
      ) : metodosPago.length === 0 ? (
        <p>No hay métodos de pago configurados aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metodosPago.map((metodo) => (
                <tr key={metodo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metodo.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metodo.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metodo.descripcion || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEditMetodoPago(metodo)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMetodoPago(metodo.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetodosPagoConfigPage;
