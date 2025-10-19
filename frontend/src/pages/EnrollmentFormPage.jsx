import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import moment from "moment";
import api from "../api/api";

// ===============================
// ESTADO INICIAL
// ===============================
const initialEnrollmentState = {
    estudiante_id: null,
    apoderado_id: null,
    periodo_id: null,
    seccion_id: null,
    estado: "Activa",
};

// ===============================
// FUNCIÓN PARA NOMBRE COMPLETO
// ===============================
const getFullName = (p) => {
    if (!p) return "N/A";
    const names = [p.primer_nombre, p.segundo_nombre].filter(Boolean).join(" ");
    const surnames = [p.primer_apellido, p.segundo_apellido].filter(Boolean).join(" ");
    return `${names} ${surnames}`.trim();
};

// ===============================
// COMPONENTE PRINCIPAL
// ===============================
const EnrollmentFormPage = () => {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();

    const [enrollmentData, setEnrollmentData] = useState(initialEnrollmentState);
    const [studentInfo, setStudentInfo] = useState(null);
    const [apoderadoInfo, setApoderadoInfo] = useState(null);

    const [dniSearchStudent, setDniSearchStudent] = useState("");
    const [dniSearchApoderado, setDniSearchApoderado] = useState("");

    const [structure, setStructure] = useState({ niveles: [], grados: [], secciones: [] });
    const [periodos, setPeriodos] = useState([]);
    const [costs, setCosts] = useState({ cuotas: [], total_monto: 0, numero_cuotas: 0 });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ===============================
    // CARGAR DATA INICIAL
    // ===============================
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
                        const apoderadoRes = await api.get(`/apoderados/${data.apoderado_id}`);
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

    // ===============================
    // CALCULAR COSTOS
    // ===============================
    const calculateCosts = async (periodoId) => {
        try {
            const response = await api.post("/enrollments/calculate-costs", { periodo_id: periodoId });
            setCosts(response.data);
        } catch (error) {
            console.error("Error calculando costos:", error);
            setCosts({ cuotas: [], total_monto: 0, numero_cuotas: 0 });
        }
    };

    useEffect(() => {
        if (enrollmentData.periodo_id) calculateCosts(enrollmentData.periodo_id);
    }, [enrollmentData.periodo_id]);

    // ===============================
    // BÚSQUEDA DE ESTUDIANTE
    // ===============================
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
                if (window.confirm(`Estudiante con DNI ${dniSearchStudent} no encontrado. ¿Desea registrarlo?`)) {
                    navigate(`/estudiantes/new?dni=${dniSearchStudent}`);
                }
            } else {
                setError("Error al buscar estudiante.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // BÚSQUEDA DE APODERADO
    // ===============================
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
                if (window.confirm(`Apoderado con DNI ${dniSearchApoderado} no encontrado. ¿Desea registrarlo?`)) {
                    navigate(`/responsables/new?dni=${dniSearchApoderado}`);
                }
            } else {
                setError("Error al buscar apoderado.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // SUBMIT
    // ===============================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!enrollmentData.estudiante_id || !enrollmentData.periodo_id || !enrollmentData.seccion_id) {
            setError("Complete la información obligatoria antes de guardar.");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...enrollmentData, apoderado_id: enrollmentData.apoderado_id || null };

            if (isEditing) {
                await api.put(`/enrollments/${id}`, payload);
                alert("Matrícula actualizada exitosamente.");
            } else {
                await api.post("/enrollments", payload);
                alert("Matrícula creada exitosamente.");
            }

            navigate("/matriculas");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Error al guardar matrícula.");
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // OPCIONES DE GRADO / SECCIÓN
    // ===============================
    const getGradoOptions = useMemo(() => {
        return structure.grados.map((g) => ({
            ...g,
            full_name: `${structure.niveles.find((n) => n.id === g.nivel_id)?.nombre || "Nivel"} - ${g.nombre}`,
        }));
    }, [structure]);

    const enrollmentReady =
        enrollmentData.estudiante_id && enrollmentData.periodo_id && enrollmentData.seccion_id;

    // ===============================
    // RENDER
    // ===============================
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
                    {isEditing ? "Actualizar Matrícula" : "Registrar Nueva Matrícula"}
                </h2>

                <Link to="/matriculas" className="text-sm text-blue-600 hover:underline mb-4 block">
                    ← Volver al Listado
                </Link>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* BLOQUE 1: ESTUDIANTE */}
                        <div className="bg-gradient-to-b from-indigo-50 to-white border rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-indigo-700 mb-4">🧑‍🎓 Estudiante</h3>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="DNI del Estudiante"
                                    value={dniSearchStudent}
                                    onChange={(e) => setDniSearchStudent(e.target.value)}
                                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
                                    required
                                    disabled={isEditing || loading}
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchStudent}
                                    className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition"
                                    disabled={loading || isEditing}
                                >
                                    Buscar
                                </button>
                            </div>

                            {studentInfo ? (
                                <div className="bg-white border rounded-lg p-3 text-sm">
                                    <p className="font-bold">{getFullName(studentInfo)}</p>
                                    <p className="text-gray-600">DNI: {studentInfo.numero_identificacion}</p>
                                    <p className="text-gray-600">
                                        F. Nac: {moment(studentInfo.fecha_nacimiento).format("DD/MM/YYYY")}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm mt-2">Busque al estudiante por DNI.</p>
                            )}
                        </div>

                        {/* BLOQUE 2: APODERADO */}
                        <div className="bg-gradient-to-b from-teal-50 to-white border rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-teal-700 mb-4">👨‍👩‍👧 Apoderado</h3>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="DNI del Apoderado (Opcional)"
                                    value={dniSearchApoderado}
                                    onChange={(e) => setDniSearchApoderado(e.target.value)}
                                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-teal-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchApoderado}
                                    className="bg-teal-600 text-white px-4 rounded-lg hover:bg-teal-700 transition"
                                    disabled={loading}
                                >
                                    Buscar
                                </button>
                            </div>

                            {apoderadoInfo ? (
                                <div className="bg-white border rounded-lg p-3 text-sm">
                                    <p className="font-bold">{getFullName(apoderadoInfo)}</p>
                                    <p className="text-gray-600">DNI: {apoderadoInfo.dni}</p>
                                    <p className="text-gray-600">Teléfono: {apoderadoInfo.telefono}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm mt-2">Busque al responsable por DNI (opcional).</p>
                            )}
                        </div>

                        {/* BLOQUE 3: MATRÍCULA */}
                        <div
                            className={`border rounded-xl p-5 shadow-sm ${enrollmentReady ? "bg-green-50" : "bg-red-50"
                                }`}
                        >
                            <h3 className="text-lg font-semibold text-green-700 mb-4">📘 Matrícula</h3>

                            <div className="space-y-4">
                                {/* Periodo */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Periodo Académico</label>
                                    <select
                                        name="periodo_id"
                                        value={enrollmentData.periodo_id || ""}
                                        onChange={(e) =>
                                            setEnrollmentData((prev) => ({ ...prev, periodo_id: parseInt(e.target.value) }))
                                        }
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
                                        required
                                    >
                                        <option value="">Seleccione Periodo</option>
                                        {periodos.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre} {p.activo === 1 ? "(ACTIVO)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grado / Sección */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Grado y Sección</label>
                                    <select
                                        name="seccion_id"
                                        value={enrollmentData.seccion_id || ""}
                                        onChange={(e) =>
                                            setEnrollmentData((prev) => ({ ...prev, seccion_id: parseInt(e.target.value) }))
                                        }
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
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

                                {/* Estado */}
                                {isEditing && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Estado</label>
                                        <select
                                            name="estado"
                                            value={enrollmentData.estado}
                                            onChange={(e) =>
                                                setEnrollmentData((prev) => ({ ...prev, estado: e.target.value }))
                                            }
                                            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
                                        >
                                            <option value="Activa">Activa</option>
                                            <option value="Inactiva">Inactiva</option>
                                            <option value="Pendiente">Pendiente</option>
                                        </select>
                                    </div>
                                )}

                                {/* Costos */}
                                {enrollmentData.periodo_id && (
                                    <div className="mt-3 border-t pt-3 text-sm">
                                        <p className="font-semibold text-gray-700 mb-1">Costos del Periodo:</p>
                                        <p>
                                            💰 Total Cuotas:{" "}
                                            <span className="text-green-700 font-bold">
                                                S/ {costs.total_monto.toFixed(2)}
                                            </span>
                                        </p>
                                        <p>
                                            📅 N° de Cuotas:{" "}
                                            <span className="font-bold">{costs.numero_cuotas}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN FINAL */}
                    <div className="pt-6 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !enrollmentReady}
                            className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {isEditing ? "Actualizar Matrícula" : "Confirmar Matrícula"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnrollmentFormPage;
