import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ReactSelect from "react-select";

const EstudiantesListPage = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [niveles, setNiveles] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [filterNivel, setFilterNivel] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/students");
      setAllStudents(response.data);
      setStudents(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los estudiantes.");
      setAllStudents([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNiveles = async () => {
    try {
      const response = await api.get("/config/levels");
      setNiveles(response.data.map((n) => ({ value: n.id, label: n.nombre })));
    } catch (err) {
      console.error("Error fetching niveles:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchNiveles();
  }, []);

  // Filtrado local
  useEffect(() => {
    let filtered = [...allStudents];

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          `${s.primer_nombre} ${s.segundo_nombre || ""} ${s.primer_apellido} ${
            s.segundo_apellido || ""
          }`
            .toLowerCase()
            .includes(text) || (s.numero_identificacion || "").includes(text)
      );
    }

    if (filterNivel) {
      const nivelLabel = niveles.find((n) => n.value === filterNivel)?.label;
      if (nivelLabel) {
        filtered = filtered.filter((s) => s.nombre_nivel === nivelLabel);
      }
    }

    setStudents(filtered);
  }, [searchText, filterNivel, allStudents, niveles]);

  const handleDeleteStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar a ${studentName}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setError("");
    try {
      await api.delete(`/students/${studentId}`);
      setAllStudents(allStudents.filter((s) => s.id !== studentId));
      alert(`${studentName} eliminado exitosamente.`);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar al estudiante.");
    }
  };

  const renderActions = (student) => (
    <div className="flex space-x-2">
      <Link
        to={`/students/edit/${student.id}`}
        className="text-yellow-600 hover:text-yellow-800 font-medium"
      >
        Editar
      </Link>
      {user?.rol === "Administrador" && (
        <button
          onClick={() =>
            handleDeleteStudent(
              student.id,
              `${student.primer_nombre} ${student.primer_apellido}`
            )
          }
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Eliminar
        </button>
      )}
    </div>
  );

  const columns = [
    {
      Header: "Nombre Completo",
      accessor: (row) =>
        `${row.primer_nombre} ${row.segundo_nombre || ""} ${
          row.primer_apellido
        } ${row.segundo_apellido || ""}`.trim(),
    },
    { Header: "DNI", accessor: "numero_identificacion" },
    {
      Header: "Fecha Nacimiento",
      accessor: (row) => {
        if (!row.fecha_nacimiento) return "";
        try {
          const dateObj = new Date(row.fecha_nacimiento);
          return dateObj.toISOString().split("T")[0];
        } catch (e) {
          console.error("Error formateando fecha:", row.fecha_nacimiento, e);
          return row.fecha_nacimiento;
        }
      },
    },
    { Header: "Género", accessor: "genero" },
    { Header: "Teléfono", accessor: "telefono" },
    { Header: "Nivel", accessor: "nombre_nivel" },
    { Header: "Grado", accessor: "nombre_grado" },
    { Header: "Sección", accessor: "nombre_seccion" },
    { Header: "Estado Matrícula", accessor: "estado_matricula" },
    { Header: "Acciones", accessor: renderActions },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Listado de Estudiantes
        </h2>
        <Link
          to="/students/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          Nuevo Estudiante
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nombre o DNI
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Escribe nombre o DNI..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por nivel
            </label>
            <ReactSelect
              options={niveles}
              value={niveles.find((n) => n.value === filterNivel) || null}
              onChange={(selected) =>
                setFilterNivel(selected ? selected.value : "")
              }
              isClearable
              placeholder="Selecciona nivel..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchText("");
                setFilterNivel("");
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md w-full"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500 text-lg">Cargando estudiantes...</p>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay estudiantes registrados aún.
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.Header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        col.accessor === renderActions
                          ? "text-right"
                          : "text-gray-900"
                      }`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(student)
                        : student[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EstudiantesListPage;
