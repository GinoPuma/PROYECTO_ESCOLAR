import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/logo_divino_niño.png";
import api from "../../api/api";

const Layout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const response = await api.get("/config/institution");
        setInstitution(response.data);
      } catch (error) {
        console.error("Error al obtener la institución:", error);
      }
    };
    fetchInstitution();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarItems = [{ to: "/dashboard", label: "Inicio", icon: "🏠" }];

  const generalManagerRoles = ["Secretaria", "Administrador"];

  if (user && generalManagerRoles.includes(user.rol)) {
    sidebarItems.push(
      { to: "/matriculas", label: "Matrículas", icon: "📚" },
      { to: "/pagos", label: "Pagos", icon: "💰" },
      { to: "/estudiantes", label: "Estudiantes", icon: "🧑‍🎓" },
      { to: "/responsables", label: "Padres de Familia", icon: "👨‍👩‍👧‍👦" },
    );
  }

  if (user && user.rol === "Administrador") {
    sidebarItems.push(
      { to: "/admin/users", label: "Gestión Usuarios", icon: "👥" },
      /* { to: "/reportes", label: "Reportes", icon: "📊" },  */
      { to: "/configuracion", label: "Configuración", icon: "⚙️" }
    );
  }

  const institutionName = institution?.nombre || "GESTIÓN ESCOLAR";

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200 flex flex-col items-center">
          <img src={logo} alt="Logo Institución" className="w-24 h-auto mb-2" />
          {!loading && user && (
            <p className="text-sm text-gray-500 mt-1">{user.rol}</p>
          )}
        </div>

        {/* Sidebar Items con scroll si hay muchos */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200 ease-in-out"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Botón Cerrar Sesión siempre al final */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md py-4 px-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {institutionName}
          </h1>
          <div className="flex items-center">
            {user && !loading && (
              <p className="text-gray-600 mr-4">
                ¡Hola, <span className="font-medium">{user.primer_nombre}</span>
                !
              </p>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default Layout;
