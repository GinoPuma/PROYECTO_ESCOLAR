import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";

const TiposPagoConfigPage = () => {
  const [tiposPago, setTiposPago] = useState([]);
  const [newTipoPago, setNewTipoPago] = useState({
    nombre: "",
    descripcion: "",
    precio_fijo: "",
    fecha_limite: "",
    es_obligatorio: false,
  });
  const [editingTipoPago, setEditingTipoPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchTiposPago();
  }, []);

  const fetchTiposPago = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.get("/tipos_pago");
      const formattedData = response.data.map((tipo) => ({
        ...tipo,
        precio_fijo:
          tipo.precio_fijo !== null ? tipo.precio_fijo.toString() : "",
        fecha_limite: tipo.fecha_limite ? tipo.fecha_limite.split("T")[0] : "",
        es_obligatorio: tipo.es_obligatorio || false,
      }));
      setTiposPago(formattedData);
    } catch (err) {
      console.error("Error fetching tipos de pago:", err);
      setError(
        err.response?.data?.message || "Error al cargar los tipos de pago."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTipoPago = async () => {
    if (!newTipoPago.nombre.trim()) {
      setError("El nombre del tipo de pago es obligatorio.");
      return;
    }
    setError("");
    setSuccessMessage("");
    try {
      const dataToSend = {
        nombre: newTipoPago.nombre,
        descripcion: newTipoPago.descripcion || null,
        precio_fijo: newTipoPago.precio_fijo
          ? parseFloat(newTipoPago.precio_fijo)
          : null,
        fecha_limite: newTipoPago.fecha_limite
          ? new Date(newTipoPago.fecha_limite).toISOString().split("T")[0]
          : null,
        es_obligatorio: newTipoPago.es_obligatorio,
      };
      const response = await api.post("/tipos_pago", dataToSend);
      setTiposPago([
        ...tiposPago,
        {
          ...response.data,
          precio_fijo:
            response.data.precio_fijo !== null
              ? response.data.precio_fijo.toString()
              : "",
          fecha_limite: response.data.fecha_limite
            ? response.data.fecha_limite.split("T")[0]
            : "",
          es_obligatorio: response.data.es_obligatorio || false,
        },
      ]);
      setNewTipoPago({
        nombre: "",
        descripcion: "",
        precio_fijo: "",
        fecha_limite: "",
        es_obligatorio: false,
      });
      setSuccessMessage("Tipo de pago añadido correctamente.");
    } catch (err) {
      console.error("Error adding tipo de pago:", err);
      setError(
        err.response?.data?.message || "Error al añadir el tipo de pago."
      );
    }
  };

  const handleEditTipoPago = (tipo) => {
    setEditingTipoPago(tipo);
    setNewTipoPago({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || "",
      precio_fijo: tipo.precio_fijo !== null ? tipo.precio_fijo.toString() : "",
      fecha_limite: tipo.fecha_limite ? tipo.fecha_limite.split("T")[0] : "",
      es_obligatorio: tipo.es_obligatorio || false,
    });
  };

  const handleUpdateTipoPago = async () => {
    if (!editingTipoPago || !newTipoPago.nombre.trim()) return;
    setError("");
    setSuccessMessage("");
    try {
      const dataToSend = {
        nombre: newTipoPago.nombre,
        descripcion: newTipoPago.descripcion || null,
        precio_fijo: newTipoPago.precio_fijo
          ? parseFloat(newTipoPago.precio_fijo)
          : null,
        fecha_limite: newTipoPago.fecha_limite
          ? new Date(newTipoPago.fecha_limite).toISOString().split("T")[0]
          : null,
        es_obligatorio: newTipoPago.es_obligatorio,
      };
      const response = await api.put(
        `/tipos_pago/${editingTipoPago.id}`,
        dataToSend
      );
      setTiposPago(
        tiposPago.map((tipo) =>
          tipo.id === editingTipoPago.id
            ? {
                ...response.data,
                precio_fijo:
                  response.data.precio_fijo !== null
                    ? response.data.precio_fijo.toString()
                    : "",
                fecha_limite: response.data.fecha_limite
                  ? response.data.fecha_limite.split("T")[0]
                  : "",
                es_obligatorio: response.data.es_obligatorio || false,
              }
            : tipo
        )
      );
      setEditingTipoPago(null);
      setNewTipoPago({
        nombre: "",
        descripcion: "",
        precio_fijo: "",
        fecha_limite: "",
        es_obligatorio: false,
      });
      setSuccessMessage("Tipo de pago actualizado correctamente.");
    } catch (err) {
      console.error("Error updating tipo de pago:", err);
      setError(
        err.response?.data?.message || "Error al actualizar el tipo de pago."
      );
    }
  };

  const handleDeleteTipoPago = async (id) => {
    setError("");
    setSuccessMessage("");
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este tipo de pago? Esto podría afectar los registros de pagos existentes."
      )
    ) {
      try {
        await api.delete(`/tipos_pago/${id}`);
        setTiposPago(tiposPago.filter((tipo) => tipo.id !== id));
        setSuccessMessage("Tipo de pago eliminado correctamente.");
      } catch (err) {
        console.error("Error deleting tipo de pago:", err);
        setError(
          err.response?.data?.message || "Error al eliminar el tipo de pago."
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Tipos de Pago
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

      {/* 🔹 Sección de formulario */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Nombre del Tipo de Pago (ej: Matrícula)"
            value={newTipoPago.nombre}
            onChange={(e) =>
              setNewTipoPago({ ...newTipoPago, nombre: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newTipoPago.descripcion}
            onChange={(e) =>
              setNewTipoPago({ ...newTipoPago, descripcion: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="number"
            placeholder="Precio(ej: 150.00)"
            value={newTipoPago.precio_fijo}
            onChange={(e) =>
              setNewTipoPago({ ...newTipoPago, precio_fijo: e.target.value })
            }
            step="0.01"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {/* <input
            type="date"
            value={newTipoPago.fecha_limite}
            onChange={(e) =>
              setNewTipoPago({ ...newTipoPago, fecha_limite: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          /> */}
          {/* 🔹 Checkbox obligatorio */}
          {/* <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newTipoPago.es_obligatorio}
              onChange={(e) =>
                setNewTipoPago({
                  ...newTipoPago,
                  es_obligatorio: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
            <label className="text-sm text-gray-700">
              Obligatorio para todos los estudiantes
            </label>
          </div> */}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          {editingTipoPago ? (
            <>
              <button
                onClick={handleUpdateTipoPago}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md min-w-[120px]"
              >
                Actualizar
              </button>
              <button
                onClick={() => {
                  setEditingTipoPago(null);
                  setNewTipoPago({
                    nombre: "",
                    descripcion: "",
                    precio_fijo: "",
                    fecha_limite: "",
                    es_obligatorio: false,
                  });
                  setSuccessMessage("");
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md min-w-[120px]"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={handleAddTipoPago}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md min-w-[120px]"
            >
              Añadir Tipo
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Tabla */}
      {loading ? (
        <p>Cargando tipos de pago...</p>
      ) : tiposPago.length === 0 ? (
        <p>No hay tipos de pago configurados aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Fijo
                </th>
                {/* <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Límite
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obligatorio
                </th> */}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tiposPago.map((tipo) => (
                <tr key={tipo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tipo.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tipo.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tipo.descripcion || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {tipo.precio_fijo
                      ? `S/ ${parseFloat(tipo.precio_fijo).toFixed(2)}`
                      : "-"}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {tipo.fecha_limite
                      ? new Date(
                          tipo.fecha_limite + "T00:00:00"
                        ).toLocaleDateString("es-PE", {
                          timeZone: "America/Lima",
                        })
                      : "-"}
                  </td> */}
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {tipo.es_obligatorio ? "Sí" : "No"}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEditTipoPago(tipo)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTipoPago(tipo.id)}
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

export default TiposPagoConfigPage;
