import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";

const PaymentFormPage = () => {
  const { matriculaId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentData, setPaymentData] = useState({
    cuota_id: "",
    metodo_pago_id: "",
    monto: "",
    fecha_pago: moment().format("YYYY-MM-DD"),
    referencia_pago: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cargar resumen y métodos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, methodsRes] = await Promise.all([
          api.get(`/pagos/summary/${matriculaId}`),
          api.get("/pagos/methods"),
        ]);

        setSummary(summaryRes.data);
        setPaymentMethods(methodsRes.data);

        const firstPendingCuota = summaryRes.data.cuotas.find(
          (c) => c.estadoCuota !== "Pagado"
        );

        if (firstPendingCuota) {
          setPaymentData((prev) => ({
            ...prev,
            cuota_id: firstPendingCuota.cuota_id,
            monto: firstPendingCuota.saldoPendiente.toFixed(2),
          }));
        } else if (summaryRes.data.cuotas.length > 0) {
          setPaymentData((prev) => ({
            ...prev,
            cuota_id:
              summaryRes.data.cuotas[summaryRes.data.cuotas.length - 1]
                .cuota_id,
            monto: "0.00",
          }));
        }
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(
          err.response?.data?.message || "Error al cargar el estado de cuenta."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [matriculaId]);

  const handlePaymentDataChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));

    if (name === "cuota_id" && summary) {
      const cuotaIdInt = parseInt(value);
      const targetCuota = summary.cuotas.find((c) => c.cuota_id === cuotaIdInt);

      if (targetCuota) {
        setPaymentData((prev) => ({
          ...prev,
          monto:
            targetCuota.saldoPendiente > 0
              ? targetCuota.saldoPendiente.toFixed(2)
              : "0.00",
        }));
      }
    }
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    if (parseFloat(paymentData.monto) <= 0) {
      setError("El monto a pagar debe ser mayor a cero.");
      setSubmitLoading(false);
      return;
    }

    try {
      await api.post("/pagos/register", {
        ...paymentData,
        matricula_id: parseInt(matriculaId),
        cuota_id: parseInt(paymentData.cuota_id),
        metodo_pago_id: parseInt(paymentData.metodo_pago_id),
        monto: parseFloat(paymentData.monto),
      });

      alert("Pago registrado exitosamente. Recargando resumen...");
      navigate(0);
    } catch (err) {
      console.error("Error al registrar pago:", err);
      setError(
        err.response?.data?.message ||
          "Error al procesar el pago. Verifique el saldo."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !summary)
    return <div className="p-8 text-center">Cargando estado de cuenta...</div>;

  const targetCuota = summary.cuotas.find(
    (c) => c.cuota_id === parseInt(paymentData.cuota_id)
  );

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">
        Estado de Cuenta - Matrícula #{matriculaId}
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Estudiante:{" "}
        <span className="font-semibold">
          {summary.est_nombre} {summary.est_apellido}
        </span>{" "}
        | Periodo:{" "}
        <span className="font-semibold">{summary.periodo_nombre}</span> | Grado:{" "}
        <span className="font-semibold">
          {summary.grado_nombre} / {summary.seccion_nombre}
        </span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Resumen General */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow-md border-l-4 border-blue-600">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">
              Resumen General
            </h3>
            <div className="flex justify-between text-lg">
              <p>Obligación Total:</p>
              <p className="font-bold">
                S/ {summary.totalObligation.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between text-lg text-green-700">
              <p>Total Pagado:</p>
              <p className="font-bold">S/ {summary.totalPaid.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-xl text-red-600 border-t pt-2 mt-2">
              <p>Saldo Pendiente:</p>
              <p className="font-bold">S/ {summary.totalPending.toFixed(2)}</p>
            </div>
          </div>

          {/* Detalle de Cuotas */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Detalle de Cuotas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs">Concepto</th>
                    <th className="px-3 py-2 text-left text-xs">
                      Monto Oblig.
                    </th>
                    <th className="px-3 py-2 text-left text-xs">Pagado</th>
                    <th className="px-3 py-2 text-left text-xs">Saldo</th>
                    <th className="px-3 py-2 text-left text-xs">F. Límite</th>
                    <th className="px-3 py-2 text-left text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {summary.cuotas.map((c) => (
                    <tr
                      key={c.cuota_id}
                      className={
                        c.cuota_id === parseInt(paymentData.cuota_id)
                          ? "bg-yellow-50 font-medium"
                          : ""
                      }
                    >
                      <td className="px-3 py-2">{c.concepto}</td>
                      <td className="px-3 py-2">S/ {c.monto_obligatorio}</td>
                      <td className="px-3 py-2 text-green-600">
                        S/ {c.montoPagado.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-red-600">
                        S/ {c.saldoPendiente.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {moment(c.fecha_limite).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 rounded-full ${
                            c.estadoCuota === "Pagado"
                              ? "bg-green-100 text-green-800"
                              : c.estadoCuota === "Parcial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.estadoCuota}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white p-5 rounded-lg shadow-xl border-t-4 border-purple-500">
          <h3 className="text-xl font-bold mb-4 text-purple-700">
            Registrar Pago
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterPayment} className="space-y-4">
            {/* Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cuota a Pagar (*)
              </label>
              <select
                name="cuota_id"
                value={paymentData.cuota_id}
                onChange={handlePaymentDataChange}
                className="mt-1 block w-full p-2 border rounded"
                required
              >
                <option value="">Seleccione Cuota</option>
                {summary.cuotas.map((c) => (
                  <option key={c.cuota_id} value={c.cuota_id}>
                    {c.concepto} (Saldo: S/ {c.saldoPendiente.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pago con placeholder fijo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Método de Pago (*)
              </label>
              <select
                name="metodo_pago_id"
                value={paymentData.metodo_pago_id}
                onChange={handlePaymentDataChange}
                className={`mt-1 block w-full p-2 border rounded text-gray-700 ${
                  paymentData.metodo_pago_id === ""
                    ? "text-gray-400"
                    : "text-gray-900"
                }`}
                required
              >
                <option value="" disabled hidden>
                  -- Seleccione Método --
                </option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monto a Pagar (S/) (*)
              </label>
              <input
                type="number"
                name="monto"
                value={paymentData.monto}
                onChange={handlePaymentDataChange}
                step="0.01"
                min="0.01"
                className="mt-1 block w-full p-2 border rounded"
                required
                disabled={targetCuota?.estadoCuota === "Pagado"}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Pago
              </label>
              <input
                type="date"
                name="fecha_pago"
                value={paymentData.fecha_pago}
                onChange={handlePaymentDataChange}
                className="mt-1 block w-full p-2 border rounded"
              />
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referencia (Nro. Operación)
              </label>
              <input
                type="text"
                name="referencia_pago"
                value={paymentData.referencia_pago}
                onChange={handlePaymentDataChange}
                className="mt-1 block w-full p-2 border rounded"
                placeholder="Ej: Nro. de Transferencia o Yape"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              disabled={submitLoading || targetCuota?.saldoPendiente <= 0}
            >
              {submitLoading ? "Procesando..." : "Confirmar Registro"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentFormPage;
