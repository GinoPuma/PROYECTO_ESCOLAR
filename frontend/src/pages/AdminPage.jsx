import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.rol !== "Administrador") {
      setError("No tienes permisos para acceder a esta página.");
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        let errorMessage =
          err.response?.data?.message || "Error al cargar usuarios.";
        if (err.response?.status === 403) {
          errorMessage = "No tienes permisos para ver esta sección.";
        }
        setError(errorMessage);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const handleDeactivateUser = async (userId, username) => {
    if (
      !window.confirm(`¿Estás seguro de que deseas desactivar a ${username}?`)
    ) {
      return;
    }

    setError("");
    try {
      await api.delete(`/users/${userId}/deactivate`);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, activo: false } : u))
      );
      alert(`Usuario ${username} desactivado exitosamente.`);
    } catch (err) {
      console.error("Error deactivating user:", err);
      let errorMessage = "Error al desactivar al usuario.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
    }
  };

  const handleActivateUser = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de que deseas activar a ${username}?`)) {
      return;
    }

    setError("");
    try {
      await api.put(`/users/${userId}/activate`);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, activo: true } : u))
      );
      alert(`Usuario ${username} activado exitosamente.`);
    } catch (err) {
      console.error("Error activating user:", err);
      let errorMessage = "Error al activar al usuario.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>
    );

  if (error && !user)
    return <div className="p-8 text-center text-red-500">{error}</div>;

  if (!user || user.rol !== "Administrador")
    return (
      <div className="p-8 text-center text-red-500">
        No tienes permisos para ver esta página.
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Título principal */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Gestión de Usuarios
          </h2>
          <Link
            to="/admin/users/new"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2"
          >
            ➕ Nuevo Usuario
          </Link>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u, index) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-purple-50 transition ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {u.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {u.primer_nombre} {u.primer_apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {u.rol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                          u.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center gap-3">
                        <Link
                          to={`/admin/users/edit/${u.id}`}
                          className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                        >
                          ✏️ Editar
                        </Link>
                        {u.activo ? (
                          <button
                            onClick={() =>
                              handleDeactivateUser(u.id, u.username)
                            }
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                          >
                            🚫 Desactivar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(u.id, u.username)}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                          >
                            ✅ Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensaje si no hay usuarios */}
          {users.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">
                No hay usuarios registrados.
              </p>
              <Link
                to="/admin/users/new"
                className="mt-4 inline-block text-purple-600 hover:text-purple-800 font-medium"
              >
                Registrar nuevo usuario
              </Link>
            </div>
          )}
        </div>

        {/* Botón de volver */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white font-bold py-2 px-6 rounded-lg shadow-md transition"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
