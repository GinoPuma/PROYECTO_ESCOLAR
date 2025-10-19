import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const PaymentListPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Reutilizamos el endpoint de matrículas para mostrar la lista
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/enrollments");
      setEnrollments(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al cargar la lista de matrículas para pagos."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">Cargando matrículas disponibles...</div>
    );

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Seleccionar Matrícula para Pago
      </h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{}</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <p className="mb-4 text-gray-600">
          Seleccione la matrícula del estudiante para ver su estado de cuenta y
          registrar pagos.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grado/Sección
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollments.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {m.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {m.estudiante_nombre} {m.estudiante_apellido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {m.periodo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {m.grado} / {m.seccion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-3">
                    <Link
                      to={`/pagos/register/${m.id}`}
                      className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-xs"
                    >
                      Estado de Cuenta / Pagar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentListPage;
