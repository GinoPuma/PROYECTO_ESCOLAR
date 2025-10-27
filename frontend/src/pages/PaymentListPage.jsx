import React, { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const PaymentListPage = () => {
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [structure, setStructure] = useState({
    niveles: [],
    grados: [],
    secciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de Filtro
  const [filterNivel, setFilterNivel] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [filterSeccion, setFilterSeccion] = useState("");
  const [filterDNI, setFilterDNI] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [enrollmentsRes, structureRes] = await Promise.all([
        api.get("/enrollments"),
        api.get("/config/estructura"),
      ]);

      setAllEnrollments(enrollmentsRes.data);
      setStructure(structureRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al cargar la lista de matrículas para pagos."
      );
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE FILTRADO
  const filteredEnrollments = useMemo(() => {
    let currentList = allEnrollments;

    if (filterNivel) {
      currentList = currentList.filter(
        (m) => m.nivel_id === parseInt(filterNivel)
      );
    }
    if (filterGrado) {
      currentList = currentList.filter(
        (m) => m.grado_id === parseInt(filterGrado)
      );
    }
    if (filterSeccion) {
      currentList = currentList.filter(
        (m) => m.seccion_id_actual === parseInt(filterSeccion)
      );
    }
    if (filterDNI.trim()) {
      currentList = currentList.filter((m) =>
        m.estudiante_dni?.includes(filterDNI.trim())
      );
    }

    return currentList;
  }, [allEnrollments, filterNivel, filterGrado, filterSeccion, filterDNI]);

  const availableGrados = useMemo(() => {
    if (!filterNivel) return structure.grados;
    return structure.grados.filter((g) => g.nivel_id === parseInt(filterNivel));
  }, [structure.grados, filterNivel]);

  const availableSecciones = useMemo(() => {
    if (!filterGrado) return structure.secciones;
    return structure.secciones.filter(
      (s) => s.grado_id === parseInt(filterGrado)
    );
  }, [structure.secciones, filterGrado]);

  const handleNivelChange = (e) => {
    setFilterNivel(e.target.value);
    setFilterGrado("");
    setFilterSeccion("");
  };

  const handleGradoChange = (e) => {
    setFilterGrado(e.target.value);
    setFilterSeccion("");
  };

  const handleSeccionChange = (e) => {
    setFilterSeccion(e.target.value);
  };

  const clearFilters = () => {
    setFilterNivel("");
    setFilterGrado("");
    setFilterSeccion("");
    setFilterDNI("");
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Cargando matrículas disponibles...</p>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Estado de Cuenta y Pagos
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* BLOQUE DE FILTROS */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🔍</span>
              Filtrar Matrículas
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
            >
              <span>🔄</span>
              Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro DNI */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI Estudiante
              </label>
              <input
                type="text"
                placeholder="Buscar por DNI..."
                value={filterDNI}
                onChange={(e) => setFilterDNI(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Filtro Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel Educativo
              </label>
              <select
                value={filterNivel}
                onChange={handleNivelChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="">Todos los niveles</option>
                {structure.niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Grado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <select
                value={filterGrado}
                onChange={handleGradoChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-100"
                disabled={!filterNivel}
              >
                <option value="">Todos los grados</option>
                {availableGrados.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Sección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sección
              </label>
              <select
                value={filterSeccion}
                onChange={handleSeccionChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-100"
                disabled={!filterGrado}
              >
                <option value="">Todas las secciones</option>
                {availableSecciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Periodo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Grado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Sección
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((m, index) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-purple-50 transition ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      #{m.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-sm">
                            {m.estudiante_nombre?.charAt(0)}
                            {m.estudiante_apellido?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {m.estudiante_nombre} {m.estudiante_apellido}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {m.estudiante_dni || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {m.periodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {m.nivel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {m.grado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {m.seccion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/pagos/register/${m.id}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-md"
                      >
                        <span>💳</span>
                        Estado de Cuenta / Pagar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEnrollments.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-500 text-lg">
                No se encontraron matrículas con los filtros aplicados
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-purple-600 hover:text-purple-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentListPage;
