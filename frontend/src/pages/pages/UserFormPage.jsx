import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const UserFormPage = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    primer_nombre: "",
    primer_apellido: "",
    rol: "Secretaria",
    activo: true,
    password: "",
    confirmar_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      const fetchUser = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`/users/${id}`);
          const fetchedUser = response.data;
          setUserData({
            username: fetchedUser.username,
            email: fetchedUser.email || "",
            primer_nombre: fetchedUser.primer_nombre,
            primer_apellido: fetchedUser.primer_apellido,
            rol: fetchedUser.rol,
            activo: fetchedUser.activo,
            password: "",
            confirmar_password: "",
          });
        } catch (err) {
          console.error("Error fetching user for edit:", err);
          let errorMessage = `Error al cargar datos del usuario con ID ${id}.`;
          if (err.response) {
            errorMessage =
              err.response.data?.message || `Error ${err.response.status}`;
            if (err.response.status === 404)
              errorMessage = "Usuario no encontrado.";
          }
          setError(errorMessage);
          navigate("/admin/users");
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setUserData({
        ...userData,
        activo: true,
      });
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData({
      ...userData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let validationErrors = [];
    if (!userData.username || userData.username.length < 3)
      validationErrors.push(
        "El nombre de usuario es obligatorio y debe tener al menos 3 caracteres."
      );
    if (userData.email && !/\S+@\S+\.\S+/.test(userData.email))
      validationErrors.push("El formato del email es inválido.");
    if (!userData.primer_nombre)
      validationErrors.push("El primer nombre es obligatorio.");
    if (!userData.primer_apellido)
      validationErrors.push("El primer apellido es obligatorio.");
    if (
      !userData.rol ||
      !["Administrador", "Secretaria"].includes(userData.rol)
    )
      validationErrors.push(
        "El rol es obligatorio y debe ser Administrador o Secretaria."
      );

    const isPasswordProvided =
      userData.password && userData.password.length > 0;
    const isConfirmPasswordProvided =
      userData.confirmar_password && userData.confirmar_password.length > 0;

    if (!isEditing && (!userData.password || userData.password.length < 6)) {
      validationErrors.push(
        "La contraseña es obligatoria y debe tener al menos 6 caracteres."
      );
    }
    if (isEditing && isPasswordProvided && userData.password.length < 6) {
      validationErrors.push(
        "La nueva contraseña debe tener al menos 6 caracteres."
      );
    }
    if (
      isPasswordProvided &&
      isConfirmPasswordProvided &&
      userData.password !== userData.confirmar_password
    ) {
      validationErrors.push("Las contraseñas no coinciden.");
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isEditing) {
        const updateData = { ...userData };
        if (!isPasswordProvided) {
          delete updateData.password;
          delete updateData.confirmar_password;
        }

        response = await api.put(`/users/${id}`, updateData);
        alert(`Usuario ${userData.username} actualizado exitosamente.`);
      } else {
        response = await api.post("/users", userData);
        alert(`Usuario ${userData.username} creado exitosamente.`);
      }
      navigate("/admin/users");
    } catch (err) {
      console.error("Error submitting user form:", err);
      let errorMessage = isEditing
        ? "Error al actualizar el usuario."
        : "Error al crear el usuario.";
      if (err.response) {
        errorMessage =
          err.response.data?.message ||
          err.response.data?.errors?.join(" ") ||
          `Error ${err.response.status}`;
        if (err.response.status === 409) {
          errorMessage =
            err.response.data?.message ||
            "El nombre de usuario o email ya está registrado.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? "Editar Usuario" : "Agregar Nuevo Usuario"}
        </h2>
        <Link
          to="/admin/users"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Volver al Listado
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Usuario (*)
          </label>
          <input
            type="text"
            name="username"
            value={userData.username}
            onChange={handleChange}
            required={!isEditing}
            disabled={isEditing}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={userData.email || ""}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Primer Nombre (*)
          </label>
          <input
            type="text"
            name="primer_nombre"
            value={userData.primer_nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Primer Apellido (*)
          </label>
          <input
            type="text"
            name="primer_apellido"
            value={userData.primer_apellido}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rol (*)
            </label>
            <select
              name="rol"
              value={userData.rol}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Administrador">Administrador</option>
              <option value="Secretaria">Secretaria</option>
            </select>
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="checkbox"
                  name="activo"
                  checked={userData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="activo"
                  className="ml-2 block text-sm text-gray-900"
                >
                  {userData.activo ? "Usuario Activo" : "Usuario Inactivo"}
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            {isEditing
              ? "Nueva Contraseña (dejar vacío para no cambiar)"
              : "Contraseña (*)"}
          </label>
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            required={!isEditing || (isEditing && userData.password)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {(isEditing && userData.password) || !isEditing ? (
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña (*)
            </label>
            <input
              type="password"
              name="confirmar_password"
              value={userData.confirmar_password}
              onChange={handleChange}
              required={!isEditing || (isEditing && userData.password)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        ) : null}

        <div className="col-span-1 md:col-span-2 text-right">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                       bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : isEditing
              ? "Actualizar Usuario"
              : "Agregar Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;
