import React, { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const EnrollmentListPage = () => {
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

  const navigate = useNavigate();

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
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar la lista de matrículas o la configuración."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar la matrícula de ${nombre}? Esto es permanente si no tiene pagos.`
      )
    )
      return;

    try {
      await api.delete(`/enrollments/${id}`);
      alert(`Matrícula de ${nombre} eliminada.`);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al intentar eliminar la matrícula."
      );
    }
  };
  const generateEnrollmentCertificate = async (matriculaId) => {
    try {
      const enrollmentData = await api.get(`/enrollments/${matriculaId}`);
      const data = enrollmentData.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Encabezado
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CONSTANCIA DE MATRÍCULA", pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(14);
      doc.text(
        data.institucion_nombre || "Institución Educativa",
        pageWidth / 2,
        30,
        {
          align: "center",
        }
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (data.institucion_direccion) {
        doc.text(data.institucion_direccion, pageWidth / 2, 37, {
          align: "center",
        });
      }
      if (data.institucion_telefono || data.institucion_email) {
        doc.text(
          `${data.institucion_telefono || ""} ${
            data.institucion_email ? "| " + data.institucion_email : ""
          }`,
          pageWidth / 2,
          42,
          { align: "center" }
        );
      }

      // Línea divisoria
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(15, 48, pageWidth - 15, 48);

      // Número de matrícula
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Matrícula N° ${matriculaId}`, pageWidth / 2, 58, {
        align: "center",
      });

      // Información del estudiante
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL ESTUDIANTE", 15, 70);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Apellidos y Nombres: ${data.estudiante_nombre} ${data.estudiante_apellido}`,
        15,
        78
      );
      doc.text(`DNI: ${data.estudiante_dni}`, 15, 85);
      doc.text(
        `Fecha de Nacimiento: ${moment(data.estudiante_fecha_nacimiento).format(
          "DD/MM/YYYY"
        )}`,
        15,
        92
      );

      // Información del apoderado
      if (data.apoderado_nombre) {
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL APODERADO", 15, 104);

        doc.setFont("helvetica", "normal");
        doc.text(
          `Apellidos y Nombres: ${data.apoderado_nombre} ${data.apoderado_apellido}`,
          15,
          112
        );
        doc.text(`DNI: ${data.apoderado_dni}`, 15, 119);
        if (data.apoderado_telefono) {
          doc.text(`Teléfono: ${data.apoderado_telefono}`, 15, 126);
        }
      }

      // Información académica
      const academicY = data.apoderado_nombre ? 138 : 104;
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN ACADÉMICA", 15, academicY);

      doc.setFont("helvetica", "normal");
      doc.text(`Periodo Académico: ${data.periodo_nombre}`, 15, academicY + 8);
      doc.text(`Nivel: ${data.nivel_nombre}`, 15, academicY + 15);
      doc.text(`Grado: ${data.grado_nombre}`, 15, academicY + 22);
      doc.text(`Sección: ${data.seccion_nombre}`, 15, academicY + 29);
      doc.text(
        `Fecha de Matrícula: ${moment(data.created_at).format("DD/MM/YYYY")}`,
        15,
        academicY + 36
      );
      doc.text(`Estado: ${data.estado}`, 15, academicY + 43);

      // Cuadro de resumen
      const summaryY = academicY + 55;
      doc.setDrawColor(79, 70, 229);
      doc.setFillColor(240, 240, 255);
      doc.roundedRect(15, summaryY, pageWidth - 30, 30, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("RESUMEN FINANCIERO", pageWidth / 2, summaryY + 8, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const costsData = await api.post("/enrollments/calculate-costs", {
        periodo_id: data.periodo_id,
      });

      doc.text(
        `Total de Cuotas: ${costsData.data.numero_cuotas}`,
        20,
        summaryY + 17
      );
      doc.text(
        `Monto Total: S/ ${costsData.data.total_monto.toFixed(2)}`,
        20,
        summaryY + 24
      );

      // Pie de página
      const footerY = doc.internal.pageSize.height - 30;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Documento generado el: ${moment().format("DD/MM/YYYY HH:mm")}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        "Este documento certifica la matrícula del estudiante",
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );

      // Línea de firma
      doc.setDrawColor(0, 0, 0);
      doc.line(
        pageWidth / 2 - 30,
        footerY + 20,
        pageWidth / 2 + 30,
        footerY + 20
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Firma y Sello", pageWidth / 2, footerY + 25, {
        align: "center",
      });

      // Descargar PDF
      doc.save(
        `Constancia_Matricula_${data.estudiante_apellido}_${moment().format(
          "YYYYMMDD"
        )}.pdf`
      );
    } catch (err) {
      console.error("Error al generar constancia:", err);
      alert("Error al generar la constancia de matrícula.");
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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Cargando matrículas...</p>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Gestión de Matrículas
            </h2>
            <p className="text-gray-500 mt-2">
              Total: {filteredEnrollments.length} matrícula(s)
            </p>
          </div>
          <Link
            to="/matriculas/new"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Nueva Matrícula
          </Link>
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
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>🔄</span>
              Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
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
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
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

            {/* Botón de aplicar filtros (visual) */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg text-gray-700 font-medium transition border-2 border-gray-200"
              >
                Limpiar Todo
              </button>
            </div>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Apoderado
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((m, index) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-indigo-50 transition ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          {m.estudiante_nombre?.charAt(0)}
                          {m.estudiante_apellido?.charAt(0)}
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
                      {m.apoderado_nombre
                        ? `${m.apoderado_nombre} ${m.apoderado_apellido}`
                        : "N/A"}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          m.estado === "Activa"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          to={`/matriculas/edit/${m.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium transition"
                          title="Editar matrícula"
                        >
                          ✏️
                        </Link>
                        <Link
                          to={`/pagos/register/${m.id}`}
                          className="text-purple-600 hover:text-purple-900 font-medium transition"
                          title="Gestionar pagos"
                        >
                          💳
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteEnrollment(
                              m.id,
                              `${m.estudiante_nombre} ${m.estudiante_apellido}`
                            )
                          }
                          className="text-red-600 hover:text-red-900 font-medium transition"
                          title="Eliminar matrícula"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => generateEnrollmentCertificate(m.id)}
                          className="text-red-600 hover:text-red-900 font-medium transition"
                          title="Descargar constancia"
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEnrollments.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">
                No se encontraron matrículas con los filtros aplicados
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
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

export default EnrollmentListPage;
