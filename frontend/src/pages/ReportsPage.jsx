import React, { useState, useEffect } from "react";
import api from "../api/api";
import ReporteStudent from "../components/Reports/ReporteStudent";
import ReportePeriodo from "../components/Reports/ReportePeriodo";
import ReporteHistoricoPagos from "../components/Reports/ReporteHistoricoPagos";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("periodo");
  const [selectors, setSelectors] = useState({ periodos: [], metodosPago: [] });
  const [loadingSelectors, setLoadingSelectors] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { id: "periodo", name: "Resumen por Período" },
    { id: "student", name: "Historial por Estudiante" },
    { id: "payments", name: "Histórico de Pagos" },
    // { id: 'section', name: 'Control por Sección/Grado' }, // Futuro
  ];

  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const response = await api.get("/reports/selectors");
        setSelectors(response.data);
      } catch (err) {
        setError("Error al cargar datos base para los reportes.");
      } finally {
        setLoadingSelectors(false);
      }
    };
    fetchSelectors();
  }, []);

  const renderContent = () => {
    if (loadingSelectors)
      return (
        <div className="text-center py-10">
          Cargando datos de configuración...
        </div>
      );

    switch (activeTab) {
      case "periodo":
        return <ReportePeriodo periodos={selectors.periodos} />;
      case "student":
        return <ReporteStudent />;
      case "payments":
        return <ReporteHistoricoPagos metodosPago={selectors.metodosPago} />;
      default:
        return <div className="p-4">Seleccione un tipo de reporte.</div>;
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Módulo de Reportes y Análisis
      </h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{}</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-xl">
        {/* Tabs de Navegación */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                                    ${
                                      activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                                    whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition duration-200
                                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido del Reporte */}
        <div className="mt-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ReportsPage;
