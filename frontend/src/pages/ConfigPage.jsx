import React, { useState } from "react";
import PeriodosConfig from "../components/Config/PeriodosConfig";
import StructureConfig from "../components/Config/StructureConfig";
import PagosConfig from "../components/Config/PagosConfig";
import InstitutionConfig from "../components/Config/InstitutionConfig";
import ReminderConfigPage from "../components/Config/ReminderConfigPage"; 

const ConfigPage = () => {
  const [activeTab, setActiveTab] = useState("periodos");

  const tabs = [
    { id: "institucion", name: "Institución" },
    { id: "periodos", name: "Periodos y Cuotas" },
    { id: "estructura", name: "Estructura Educativa" },
    { id: "pagos", name: "Tipos de Pago/Métodos" },
    { id: "recordatorios", name: "Recordatorios WhatsApp" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "institucion":
        return <InstitutionConfig />;
      case "periodos":
        return <PeriodosConfig />;
      case "estructura":
        return <StructureConfig />;
      case "pagos":
        return <PagosConfig />;
      case "recordatorios":
        return <ReminderConfigPage />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Configuración General
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="border-b border-gray-200 overflow-x-auto" >
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
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition duration-150 ease-in-out
                                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ConfigPage;
