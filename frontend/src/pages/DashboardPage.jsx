import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    matriculasActivas: 0,
    pagosDia: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        try {
          const response = await api.get("/stats/stats");
          setStats(response.data);
        } catch (err) {
          console.error("Error fetching dashboard stats:", err);
          let errorMessage = "No se pudieron cargar las estadísticas.";
          if (err.response) {
            errorMessage =
              err.response.data?.message || `Error ${err.response.status}`;
            if (err.response.status === 403) {
              errorMessage = "No tienes permisos para ver las estadísticas.";
            }
          }
          setError(errorMessage);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  const handleViewUsersClick = () => {
    navigate("/admin/users");
  };

  const handleQuickAction = (action) => {
    navigate(`/${action}`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Título principal */}
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-10 text-center">
          Panel de Control
        </h2>

        {user ? (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">
                  Estudiantes Totales
                </h3>
                <p className="text-5xl font-extrabold">
                  {loadingStats ? "..." : stats.totalEstudiantes}
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">
                  Matrículas Activas
                </h3>
                <p className="text-5xl font-extrabold">
                  {loadingStats ? "..." : stats.matriculasActivas}
                </p>
              </div>

              {/* <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">Pagos del Día</h3>
                <p className="text-5xl font-extrabold">
                  {loadingStats ? "..." : stats.pagosDia}
                </p>
              </div> */}
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>{error}</div>
              </div>
            )}

            {/* Sección de Acciones */}
            {user.rol === "Secretaria" && (
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleQuickAction("matriculas/new")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition"
                  >
                    📝 Nueva Matrícula
                  </button>
                  <button
                    onClick={() => handleQuickAction("pagos")}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition"
                  >
                    💵 Registrar Pago
                  </button>
                </div>
              </div>
            )}

            {user.rol === "Administrador" && (
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mt-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  Acciones de Administración
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleViewUsersClick}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition flex items-center"
                  >
                    👥 Ver Usuarios
                  </button>
                  <button
                    onClick={() => handleQuickAction("matriculas/new")}
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition"
                  >
                    📝 Nueva Matrícula
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 text-lg">
            Cargando información del usuario...
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
