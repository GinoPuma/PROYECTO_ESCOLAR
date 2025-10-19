import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";
import moment from "moment";

const MatriculaListPage = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMatriculas();
  }, []);

  const fetchMatriculas = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/matriculas");
      setMatriculas(response.data);
    } catch (err) {
      console.error("Error fetching matrículas:", err);
      setError("Error al cargar la lista de matrículas.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Cargando matrículas...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Listado de Matrículas
        </h2>
        <Link
          to="/matriculas/new"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          + Nueva Matrícula
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {!loading && matriculas.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No hay matrículas registradas.
        </div>
      )}

      {matriculas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apoderado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Matrícula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matriculas.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {m.estudiante_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.apoderado_nombre || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.periodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.grado} {m.seccion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(m.fecha_matricula).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          m.estado === "Activa"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <Link
                        to={`/matriculas/${m.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatriculaListPage;
