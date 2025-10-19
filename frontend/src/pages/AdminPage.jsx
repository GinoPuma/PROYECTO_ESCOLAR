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
    return <div className="p-8 text-center">Cargando usuarios...</div>;
  if (error && !user)
    return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!user || user.rol !== "Administrador")
    return (
      <div className="p-8 text-center text-red-500">
        No tienes permisos para ver esta página.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de Usuarios
          </h2>
          <Link
            to="/admin/users/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Nuevo Usuario
          </Link>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">¡Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Usuario
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre Completo
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.primer_nombre} {user.primer_apellido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.rol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex justify-center space-x-3">
                      <Link
                        to={`/admin/users/edit/${user.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Editar
                      </Link>
                      {user.activo ? (
                        <button
                          onClick={() =>
                            handleDeactivateUser(user.id, user.username)
                          }
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleActivateUser(user.id, user.username)
                          }
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
