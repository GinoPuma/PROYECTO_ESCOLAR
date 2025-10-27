import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";
import RuleFormModal from "./RuleFormModal";

const INITIAL_RULE = {
  nombre_regla: "",
  tipo_objetivo: "VENCIDOS",
  dias_antes_despues: 1,
  hora_envio: "10:00",
  activo: true,
  frecuencia: "DIARIO",
};

const ReminderConfigPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reminder-config");
      setRules(response.data);
    } catch (err) {
      setError("Error al cargar las reglas de recordatorio.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la regla: ${name}?`))
      return;
    try {
      await api.delete(`/reminder-config/${id}`);
      alert("Regla eliminada.");
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar la regla.");
    }
  };

  // Función para obtener texto descriptivo
  const getRuleDescription = (rule) => {
    const action = rule.tipo_objetivo === "POR_VENCER" ? "antes" : "después";
    const target =
      rule.tipo_objetivo === "VENCIDOS"
        ? "Cuotas Vencidas"
        : rule.tipo_objetivo === "POR_VENCER"
        ? "Cuotas por Vencer"
        : "Todas las Cuotas Pendientes";

    let daysText = rule.dias_antes_despues;
    if (rule.tipo_objetivo !== "TODOS") {
      daysText = `${Math.abs(
        rule.dias_antes_despues
      )} día(s) ${action} del vencimiento.`;
    }

    return `${target} - (${daysText})`;
  };
  const handleExecuteRule = async (ruleId, ruleName) => {
    if (
      !window.confirm(
        `¿Está seguro de EJECUTAR la regla "${ruleName}" ahora? Esto intentará enviar mensajes a todos los apoderados afectados.`
      )
    )
      return;

    setExecuting(ruleId);
    setError("");

    try {
      const response = await api.post(`/reminder-config/execute/${ruleId}`);
      const data = response.data;
      alert(
        `Ejecución de "${ruleName}" finalizada.\n\n` +
          `Matrículas evaluadas: ${data.totalMatriculasEvaluadas}\n` +
          `Mensajes Enviados: ${data.mensajesEnviados}\n` +
          `Mensajes Fallidos: ${data.mensajesFallidos}\n` +
          `Fecha objetivo de Cuota: ${data.targetDate}`
      );
      console.log(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Error durante la ejecución del proceso."
      );
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 overflow-x-auto">
        <h3 className="text-xl font-semibold">Reglas de Envío Programado</h3>
        <button
          onClick={() => {
            setEditingRule(INITIAL_RULE);
            setIsModalOpen(true);
          }}
          className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700"
        >
          + Nueva Regla
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md divide-y overflow-x-auto">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{rule.nombre_regla}</p>
              <p className="text-sm text-gray-600">
                {getRuleDescription(rule)}
              </p>
              <p className="text-xs text-gray-500">
                Envío: {rule.frecuencia} a las {rule.hora_envio} Hrs
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExecuteRule(rule.id, rule.nombre_regla)}
                className="bg-orange-500 text-white p-2 rounded-md text-sm hover:bg-orange-600 disabled:opacity-50"
                disabled={executing === rule.id || !rule.activo}
              >
                {executing === rule.id ? "Ejecutando..." : "Ejecutar Ahora"}
              </button>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  rule.activo
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {rule.activo ? "ACTIVO" : "INACTIVO"}
              </span>
              <button
                onClick={() => handleEdit(rule)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(rule.id, rule.nombre_regla)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Formulario de Regla */}
      <RuleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingRule}
        onSave={fetchRules}
      />
    </div>
  );
};

export default ReminderConfigPage;
