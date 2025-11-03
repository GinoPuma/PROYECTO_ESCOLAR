import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import moment from "moment";
import { jsPDF } from "jspdf";
import api from "../api/api";

const initialEnrollmentState = {
  estudiante_id: null,
  apoderado_id: null,
  periodo_id: null,
  nivel_id: null,
  grado_id: null,
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
  const [associatedApoderados, setAssociatedApoderados] = useState([]);

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

  const generateEnrollmentCertificate = async (matriculaId) => {
    try {
      const enrollmentData = await api.get(`/enrollments/${matriculaId}`);
      const data = enrollmentData.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

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

      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(15, 48, pageWidth - 15, 48);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Matrícula N° ${matriculaId}`, pageWidth / 2, 58, {
        align: "center",
      });

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

          // Obtener grado para saber el nivel
          const seccion = structureRes.data.secciones.find(
            (s) => s.id === data.seccion_id
          );
          const grado = structureRes.data.grados.find(
            (g) => g.id === seccion?.grado_id
          );

          setEnrollmentData({
            estudiante_id: data.estudiante_id,
            apoderado_id: data.apoderado_id,
            periodo_id: data.periodo_id,
            nivel_id: grado?.nivel_id || null,
            grado_id: seccion?.grado_id || null,
            seccion_id: data.seccion_id,
            estado: data.estado,
          });

          const studentRes = await api.get(`/students/${data.estudiante_id}`);
          setStudentInfo(studentRes.data);
          setDniSearchStudent(studentRes.data.numero_identificacion);

          await fetchAssociatedApoderados(data.estudiante_id);

          if (data.apoderado_id) {
            const apoderadoRes = await api.get(
              `/apoderados/${data.apoderado_id}`
            );
            setApoderadoInfo(apoderadoRes.data);
            setDniSearchApoderado(apoderadoRes.data.dni);
          }

          calculateCosts(data.periodo_id);
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const dniFromUrl = urlParams.get("dni");

          if (dniFromUrl) {
            setDniSearchStudent(dniFromUrl);
            try {
              const res = await api.get(`/students/dni/${dniFromUrl.trim()}`);
              setStudentInfo(res.data);
              setEnrollmentData((prev) => ({
                ...prev,
                estudiante_id: res.data.id,
              }));
              await fetchAssociatedApoderados(res.data.id);
            } catch (err) {
              console.error("Error al cargar estudiante desde URL:", err);
              setError(
                "No se pudo cargar el estudiante con el DNI proporcionado."
              );
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar data inicial:", err);
        setError("Error al cargar datos iniciales o matrícula.");
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

  const fetchAssociatedApoderados = async (studentId) => {
    try {
      const res = await api.get(`/students/${studentId}/apoderados`);
      setAssociatedApoderados(res.data);
    } catch (err) {
      setAssociatedApoderados([]);
    }
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    if (!dniSearchStudent.trim()) return;
    setError("");
    setLoading(true);
    setApoderadoInfo(null);
    setAssociatedApoderados([]);

    try {
      const res = await api.get(`/students/dni/${dniSearchStudent.trim()}`);
      setStudentInfo(res.data);
      setEnrollmentData((prev) => ({ ...prev, estudiante_id: res.data.id }));
      await fetchAssociatedApoderados(res.data.id);
    } catch (err) {
      setStudentInfo(null);
      setEnrollmentData((prev) => ({ ...prev, estudiante_id: null }));
      if (err.response?.status === 404) {
        window.confirm(`Estudiante con DNI ${dniSearchStudent} no encontrado.`);
      } else {
        setError("Error al buscar estudiante.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchApoderado = async (e) => {
    e.preventDefault();
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
        window.confirm(
          `Apoderado con DNI ${dniSearchApoderado} no encontrado.`
        );
      } else {
        setError("Error al buscar apoderado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssociatedApoderado = (apoderado) => {
    setApoderadoInfo(apoderado);
    setEnrollmentData((prev) => ({ ...prev, apoderado_id: apoderado.id }));
    setDniSearchApoderado(apoderado.dni);
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
    setError("");

    try {
      const payload = {
        estudiante_id: enrollmentData.estudiante_id,
        apoderado_id: enrollmentData.apoderado_id || null,
        periodo_id: enrollmentData.periodo_id,
        seccion_id: enrollmentData.seccion_id,
        estado: enrollmentData.estado,
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

  // Filtros en cascada
  const availableGrados = useMemo(() => {
    if (!enrollmentData.nivel_id) return [];
    return structure.grados.filter(
      (g) => g.nivel_id === enrollmentData.nivel_id
    );
  }, [structure.grados, enrollmentData.nivel_id]);

  const availableSecciones = useMemo(() => {
    if (!enrollmentData.grado_id) return [];
    return structure.secciones.filter(
      (s) => s.grado_id === enrollmentData.grado_id
    );
  }, [structure.secciones, enrollmentData.grado_id]);

  const enrollmentReady =
    enrollmentData.estudiante_id &&
    enrollmentData.periodo_id &&
    enrollmentData.seccion_id;

  const DNI_SEARCH_DISABLED = loading || (isEditing && studentInfo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-indigo-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {isEditing ? "Actualizar Matrícula" : "Nueva Matrícula"}
              </h2>
              <p className="text-indigo-100 text-sm">
                Complete la información del estudiante y su matrícula
              </p>
            </div>
            <Link
              to="/matriculas"
              className="text-sm text-indigo-100 hover:text-white flex items-center gap-2 border border-indigo-200 px-3 py-1.5 rounded-md"
            >
              ← Volver
            </Link>
          </div>

          {error && (
            <div className="mx-6 mt-5 bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* SECCIÓN 1: ESTUDIANTE */}
            <section className="border-b border-indigo-100 pb-6">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3">
                1. Información del Estudiante
              </h3>

              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      DNI del Estudiante *
                    </label>
                    <input
                      type="text"
                      placeholder="Ingrese 8 dígitos"
                      value={dniSearchStudent}
                      onChange={(e) => setDniSearchStudent(e.target.value)}
                      className="w-full px-3 py-2.5 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      required
                      disabled={DNI_SEARCH_DISABLED}
                    />
                  </div>

                  <div className="self-end">
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-md hover:opacity-90 text-sm disabled:opacity-50"
                      disabled={DNI_SEARCH_DISABLED}
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {studentInfo ? (
                  <div className="bg-green-50 border border-green-300 rounded-md p-4 text-sm">
                    <p className="font-medium text-indigo-800">
                      {getFullName(studentInfo)} (DNI:{" "}
                      {studentInfo.numero_identificacion})
                    </p>
                    <p className="text-indigo-600">
                      F. Nacimiento:{" "}
                      {moment(studentInfo.fecha_nacimiento).format(
                        "DD/MM/YYYY"
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm p-3 rounded-md text-center">
                    ⚠️ Debe buscar y seleccionar un estudiante para continuar
                  </div>
                )}
              </div>
            </section>

            {/* SECCIÓN 2: APODERADO */}
            <section className="border-b border-indigo-100 pb-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-3">
                2. Apoderado Responsable
              </h3>

              {studentInfo ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Apoderados Asociados ({associatedApoderados.length})
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                      value={apoderadoInfo?.id || ""}
                      onChange={(e) => {
                        const selectedId = parseInt(e.target.value);
                        const selectedApoderado =
                          associatedApoderados.find(
                            (a) => a.id === selectedId
                          ) || null;
                        if (selectedApoderado)
                          handleSelectAssociatedApoderado(selectedApoderado);
                      }}
                    >
                      <option value="" disabled>
                        -- Seleccione un apoderado --
                      </option>
                      {associatedApoderados.map((a) => (
                        <option key={a.id} value={a.id}>
                          {getFullName(a)} - {a.parentesco} (DNI: {a.dni})
                        </option>
                      ))}
                    </select>
                  </div>

                  {associatedApoderados.length === 0 && (
                    <div className="text-sm text-indigo-600">
                      No hay apoderados asociados. Busque uno:
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="DNI del Apoderado"
                          value={dniSearchApoderado}
                          onChange={(e) =>
                            setDniSearchApoderado(e.target.value)
                          }
                          className="flex-grow px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleSearchApoderado}
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-2 rounded-md hover:opacity-90 text-sm"
                        >
                          Buscar
                        </button>
                      </div>
                    </div>
                  )}

                  {apoderadoInfo && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-md p-4 text-sm">
                      <p className="font-medium text-indigo-800">
                        {getFullName(apoderadoInfo)} (DNI: {apoderadoInfo.dni})
                      </p>
                      <p className="text-indigo-600">
                        Teléfono: {apoderadoInfo.telefono}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 text-center text-indigo-600 text-sm">
                  ℹ️ Primero debe seleccionar un estudiante
                </div>
              )}
            </section>

            {/* SECCIÓN 3: INFORMACIÓN ACADÉMICA */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                3. Información Académica
              </h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-1">
                    Periodo Académico *
                  </label>
                  <select
                    value={enrollmentData.periodo_id || ""}
                    onChange={(e) =>
                      setEnrollmentData((prev) => ({
                        ...prev,
                        periodo_id: parseInt(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 ${
                      enrollmentData.periodo_id
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Seleccione un periodo
                    </option>
                    {periodos
                      .filter((p) => p.activo === 1)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Estado de Matrícula
                    </label>
                    <select
                      value={enrollmentData.estado}
                      onChange={(e) =>
                        setEnrollmentData((prev) => ({
                          ...prev,
                          estado: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-1">
                    Nivel Educativo *
                  </label>
                  <select
                    value={enrollmentData.nivel_id || ""}
                    onChange={(e) => {
                      const nivelId = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setEnrollmentData((prev) => ({
                        ...prev,
                        nivel_id: nivelId,
                        grado_id: null,
                        seccion_id: null,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleccione nivel</option>
                    {structure.niveles.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-1">
                    Grado *
                  </label>
                  <select
                    value={enrollmentData.grado_id || ""}
                    onChange={(e) => {
                      const gradoId = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setEnrollmentData((prev) => ({
                        ...prev,
                        grado_id: gradoId,
                        seccion_id: null,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    required
                    disabled={!enrollmentData.nivel_id}
                  >
                    <option value="">Seleccione grado</option>
                    {availableGrados.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-1">
                    Sección *
                  </label>
                  <select
                    value={enrollmentData.seccion_id || ""}
                    onChange={(e) =>
                      setEnrollmentData((prev) => ({
                        ...prev,
                        seccion_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    required
                    disabled={!enrollmentData.grado_id}
                  >
                    <option value="">Seleccione sección</option>
                    {availableSecciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {enrollmentData.periodo_id && (
                <div className="mt-5 bg-emerald-50 border border-emerald-300 rounded-md p-4 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-green-700">
                        Resumen Financiero
                      </p>
                      <p className="text-green-600">
                        Costos asociados al periodo académico
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 text-sm">Monto Total</p>
                      <p className="text-lg font-semibold text-green-700">
                        S/ {costs.total_monto.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-green-700">
                    <span className="font-semibold">N° Cuotas:</span>{" "}
                    {costs.numero_cuotas}
                  </p>
                </div>
              )}
            </section>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 border-t border-indigo-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/matriculas")}
                className="px-5 py-2 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !enrollmentReady}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-50"
              >
                {loading
                  ? "Procesando..."
                  : isEditing
                  ? "Actualizar Matrícula"
                  : "Confirmar Matrícula"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default EnrollmentFormPage;
