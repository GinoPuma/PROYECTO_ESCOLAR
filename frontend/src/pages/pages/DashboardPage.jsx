import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

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
    console.log(`Ejecutando acción rápida: ${action}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Panel de Control
      </h2>
      {user ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg text-center shadow">
              <h3 className="text-lg font-medium text-blue-800">
                Estudiantes Totales
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {loadingStats ? "..." : stats.totalEstudiantes}
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center shadow">
              <h3 className="text-lg font-medium text-green-800">
                Matrículas Activas
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {loadingStats ? "..." : stats.matriculasActivas}
              </p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center shadow">
              <h3 className="text-lg font-medium text-yellow-800">
                Pagos al Día
              </h3>
              <p className="text-3xl font-bold text-yellow-600">
                {loadingStats ? "..." : stats.pagosDia}
              </p>
            </div>
          </div>

          {error && <p className="text-center text-red-500 mb-4">{error}</p>}

          {user.rol === "Secretaria" && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Acciones Rápidas:
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleQuickAction("new_matricula")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Nueva Matrícula
                </button>
                <button
                  onClick={() => handleQuickAction("register_payment")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          )}

          {user.rol === "Administrador" && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Acciones de Administración:
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleViewUsersClick}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ver Usuarios
                </button>
                <button
                  onClick={() => handleQuickAction("generate_report")}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md"
                >
                  Generar Reporte
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Cargando información del usuario...</p>
      )}
    </div>
  );
};

export default DashboardPage;
