import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const EnrollmentListPage = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/enrollments");
            setEnrollments(response.data);
        } catch (err) {
            console.error("Error fetching enrollments:", err);
            setError(err.response?.data?.message || "Error al cargar la lista de matrículas.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEnrollment = async (id, nombre) => {
        if (!window.confirm(`¿Está seguro de eliminar la matrícula de ${nombre}? Esto es permanente si no tiene pagos.`)) return;

        try {
            await api.delete(`/enrollments/${id}`);
            alert(`Matrícula de ${nombre} eliminada.`);
            fetchEnrollments();
        } catch (err) {
            setError(err.response?.data?.message || "Error al intentar eliminar la matrícula.");
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando matrículas...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                    Gestión de Matrículas
                </h2>
                <Link
                    to="/matriculas/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    + Nueva Matrícula
                </Link>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apoderado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grado/Sección</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {enrollments.map((m) => (
                                <tr key={m.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {m.estudiante_nombre} {m.estudiante_apellido}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {m.apoderado_nombre ? `${m.apoderado_nombre} ${m.apoderado_apellido}` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{m.periodo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{m.grado} / {m.seccion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {m.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-3">
                                        <Link
                                            to={`/matriculas/edit/${m.id}`}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteEnrollment(m.id, `${m.estudiante_nombre} ${m.estudiante_apellido}`)}
                                            className="text-red-600 hover:text-red-900 font-medium"
                                        >
                                            Eliminar
                                        </button>
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

export default EnrollmentListPage;
