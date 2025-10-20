import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import moment from "moment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/api";

const initialEnrollmentState = {
  estudiante_id: null,
  apoderado_id: null,
  periodo_id: null,
  seccion_id: null,
  estado: "Activa",
};

const getFullName = (p) => {
  if (!p) return "N/A";
  const names = [p.primer_nombre, p.segundo_nombre].filter(Boolean).join(" ");
  const surnames = [p.primer_apellido, p.segundo_apellido]
    .filter(Boolean)
    .join(" ");
  return `${names} ${surnames}`.trim();
};

const EnrollmentFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [enrollmentData, setEnrollmentData] = useState(initialEnrollmentState);
  const [studentInfo, setStudentInfo] = useState(null);
  const [apoderadoInfo, setApoderadoInfo] = useState(null);
  const [dniSearchStudent, setDniSearchStudent] = useState("");
  const [dniSearchApoderado, setDniSearchApoderado] = useState("");
  const [structure, setStructure] = useState({
    niveles: [],
    grados: [],
    secciones: [],
  });
  const [periodos, setPeriodos] = useState([]);
  const [costs, setCosts] = useState({
    cuotas: [],
    total_monto: 0,
    numero_cuotas: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [structureRes, periodosRes] = await Promise.all([
          api.get("/config/estructura"),
          api.get("/config/periodos"),
        ]);

        setStructure(structureRes.data);
        setPeriodos(periodosRes.data);

        if (isEditing) {
          const enrollmentRes = await api.get(`/enrollments/${id}`);
          const data = enrollmentRes.data;

          setEnrollmentData({
            estudiante_id: data.estudiante_id,
            apoderado_id: data.apoderado_id,
            periodo_id: data.periodo_id,
            seccion_id: data.seccion_id,
            estado: data.estado,
          });

          const studentRes = await api.get(`/students/${data.estudiante_id}`);
          setStudentInfo(studentRes.data);
          setDniSearchStudent(studentRes.data.numero_identificacion);

          if (data.apoderado_id) {
            const apoderadoRes = await api.get(
              `/apoderados/${data.apoderado_id}`
            );
            setApoderadoInfo(apoderadoRes.data);
            setDniSearchApoderado(apoderadoRes.data.dni);
          }

          calculateCosts(data.periodo_id);
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar datos iniciales.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing]);

  const calculateCosts = async (periodoId) => {
    try {
      const response = await api.post("/enrollments/calculate-costs", {
        periodo_id: periodoId,
      });
      setCosts(response.data);
    } catch (error) {
      console.error("Error calculando costos:", error);
      setCosts({ cuotas: [], total_monto: 0, numero_cuotas: 0 });
    }
  };

  useEffect(() => {
    if (enrollmentData.periodo_id) calculateCosts(enrollmentData.periodo_id);
  }, [enrollmentData.periodo_id]);

  const handleSearchStudent = async () => {
    if (!dniSearchStudent.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await api.get(`/students/dni/${dniSearchStudent.trim()}`);
      setStudentInfo(res.data);
      setEnrollmentData((prev) => ({ ...prev, estudiante_id: res.data.id }));
    } catch (err) {
      setStudentInfo(null);
      setEnrollmentData((prev) => ({ ...prev, estudiante_id: null }));

      if (err.response?.status === 404) {
        if (
          window.confirm(
            `Estudiante con DNI ${dniSearchStudent} no encontrado. ¿Desea registrarlo?`
          )
        ) {
          navigate(`/estudiantes/new?dni=${dniSearchStudent}`);
        }
      } else {
        setError("Error al buscar estudiante.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchApoderado = async () => {
    if (!dniSearchApoderado.trim()) {
      setApoderadoInfo(null);
      setEnrollmentData((prev) => ({ ...prev, apoderado_id: null }));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.get(`/apoderados/dni/${dniSearchApoderado.trim()}`);
      setApoderadoInfo(res.data);
      setEnrollmentData((prev) => ({ ...prev, apoderado_id: res.data.id }));
    } catch (err) {
      setApoderadoInfo(null);
      setEnrollmentData((prev) => ({ ...prev, apoderado_id: null }));

      if (err.response?.status === 404) {
        if (
          window.confirm(
            `Apoderado con DNI ${dniSearchApoderado} no encontrado. ¿Desea registrarlo?`
          )
        ) {
          navigate(`/responsables/new?dni=${dniSearchApoderado}`);
        }
      } else {
        setError("Error al buscar apoderado.");
      }
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !enrollmentData.estudiante_id ||
      !enrollmentData.periodo_id ||
      !enrollmentData.seccion_id
    ) {
      setError("Complete la información obligatoria antes de guardar.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...enrollmentData,
        apoderado_id: enrollmentData.apoderado_id || null,
      };

      let matriculaId;
      if (isEditing) {
        await api.put(`/enrollments/${id}`, payload);
        alert("Matrícula actualizada exitosamente.");
        matriculaId = id;
      } else {
        const response = await api.post("/enrollments", payload);
        matriculaId = response.data.enrollment.id;
        alert("Matrícula creada exitosamente.");

        // Preguntar si desea generar constancia
        if (window.confirm("¿Desea generar la constancia de matrícula?")) {
          await generateEnrollmentCertificate(matriculaId);
        }
      }

      navigate("/matriculas");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al guardar matrícula.");
    } finally {
      setLoading(false);
    }
  };

  const getGradoOptions = useMemo(() => {
    return structure.grados.map((g) => ({
      ...g,
      full_name: `${
        structure.niveles.find((n) => n.id === g.nivel_id)?.nombre || "Nivel"
      } - ${g.nombre}`,
    }));
  }, [structure]);

  const enrollmentReady =
    enrollmentData.estudiante_id &&
    enrollmentData.periodo_id &&
    enrollmentData.seccion_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl p-8 border-t-4 border-indigo-600">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {isEditing ? "Actualizar Matrícula" : "Nueva Matrícula"}
              </h2>
              <p className="text-gray-500 mt-2">
                Complete la información del estudiante y su matrícula
              </p>
            </div>
            <Link
              to="/matriculas"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 transition"
            >
              ← Volver al Listado
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* ESTUDIANTE */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-md border border-indigo-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">
                    🧑‍🎓
                  </div>
                  <h3 className="text-xl font-bold text-indigo-900">
                    Estudiante
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="DNI del Estudiante"
                      value={dniSearchStudent}
                      onChange={(e) => setDniSearchStudent(e.target.value)}
                      className="flex-grow px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={isEditing || loading}
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                      disabled={loading || isEditing}
                    >
                      🔍
                    </button>
                  </div>

                  {studentInfo ? (
                    <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✅</span>
                        <p className="font-bold text-gray-800">
                          {getFullName(studentInfo)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        📋 DNI: {studentInfo.numero_identificacion}
                      </p>
                      <p className="text-sm text-gray-600">
                        🎂 F. Nac:{" "}
                        {moment(studentInfo.fecha_nacimiento).format(
                          "DD/MM/YYYY"
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <p className="flex items-center gap-2">
                        <span>⚠️</span>
                        Busque al estudiante por DNI
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* APODERADO */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 shadow-md border border-teal-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">
                    👨‍👩‍👧
                  </div>
                  <h3 className="text-xl font-bold text-teal-900">Apoderado</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="DNI del Apoderado (Opcional)"
                      value={dniSearchApoderado}
                      onChange={(e) => setDniSearchApoderado(e.target.value)}
                      className="flex-grow px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={handleSearchApoderado}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-md disabled:opacity-50"
                      disabled={loading}
                    >
                      🔍
                    </button>
                  </div>

                  {apoderadoInfo ? (
                    <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✅</span>
                        <p className="font-bold text-gray-800">
                          {getFullName(apoderadoInfo)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        📋 DNI: {apoderadoInfo.dni}
                      </p>
                      <p className="text-sm text-gray-600">
                        📞 Tel: {apoderadoInfo.telefono}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <span>ℹ️</span>
                        Apoderado opcional
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* MATRÍCULA */}
              <div
                className={`rounded-2xl p-6 shadow-md border-2 transition ${
                  enrollmentReady
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                    : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl text-white ${
                      enrollmentReady ? "bg-green-600" : "bg-red-500"
                    }`}
                  >
                    📘
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      enrollmentReady ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    Información Académica
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Periodo Académico *
                    </label>
                    <select
                      name="periodo_id"
                      value={enrollmentData.periodo_id || ""}
                      onChange={(e) =>
                        setEnrollmentData((prev) => ({
                          ...prev,
                          periodo_id: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">Seleccione Periodo</option>
                      {periodos
                        .filter((p) => p.activo === 1)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grado y Sección *
                    </label>
                    <select
                      name="seccion_id"
                      value={enrollmentData.seccion_id || ""}
                      onChange={(e) =>
                        setEnrollmentData((prev) => ({
                          ...prev,
                          seccion_id: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">Seleccione</option>
                      {getGradoOptions.map((grado) => (
                        <optgroup key={grado.id} label={grado.full_name}>
                          {structure.secciones
                            .filter((s) => s.grado_id === grado.id)
                            .map((seccion) => (
                              <option key={seccion.id} value={seccion.id}>
                                {grado.nombre} - {seccion.nombre}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        name="estado"
                        value={enrollmentData.estado}
                        onChange={(e) =>
                          setEnrollmentData((prev) => ({
                            ...prev,
                            estado: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      >
                        <option value="Activa">Activa</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    </div>
                  )}

                  {enrollmentData.periodo_id && (
                    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        Costos del Periodo:
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span className="text-gray-600">Total Cuotas:</span>
                          <span className="font-bold text-green-700">
                            S/ {costs.total_monto.toFixed(2)}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600">N° de Cuotas:</span>
                          <span className="font-bold">
                            {costs.numero_cuotas}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTÓN SUBMIT */}
            <div className="pt-6 border-t-2 border-gray-200 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/matriculas")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !enrollmentReady}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    {isEditing ? "Actualizar Matrícula" : "Confirmar Matrícula"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentFormPage;
