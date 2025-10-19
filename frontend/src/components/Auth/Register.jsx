import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    primer_nombre: "",
    primer_apellido: "",
    rol: "Secretaria",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const { username, password, email, primer_nombre, primer_apellido, rol } =
    formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccessMessage("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !username ||
      !password ||
      !email ||
      !primer_nombre ||
      !primer_apellido ||
      !rol
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await register(formData);
      setSuccessMessage(
        "Usuario registrado exitosamente. Ahora puedes iniciar sesión."
      );
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error al registrar.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Registro de Usuario
        </h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="username"
              >
                Nombre de Usuario
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                name="username"
                placeholder="Usuario"
                value={username}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Correo Electrónico
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="primer_nombre"
              >
                Nombre
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="primer_nombre"
                type="text"
                name="primer_nombre"
                placeholder="Nombre"
                value={primer_nombre}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="primer_apellido"
              >
                Apellido
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="primer_apellido"
                type="text"
                name="primer_apellido"
                placeholder="Apellido"
                value={primer_apellido}
                onChange={onChange}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={onChange}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="rol"
              >
                Rol
              </label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="rol"
                name="rol"
                value={rol}
                onChange={onChange}
                required
              >
                <option value="Secretaria">Secretaria</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
          {successMessage && (
            <p className="text-green-500 text-xs italic mt-4">
              {successMessage}
            </p>
          )}

          <div className="flex items-center justify-center mt-6">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full md:w-auto"
              type="submit"
            >
              Registrar Usuario
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-xs mt-4">
          ¿Ya tienes cuenta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:text-blue-800"
          >
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
