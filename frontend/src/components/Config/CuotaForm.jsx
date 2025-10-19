import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import Modal from '../UI/Modal';

const CuotaForm = ({ isOpen, onClose, cuota, periodoId, tiposPago, onSave }) => {
  const isEditing = !!cuota;
  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    fecha_limite: '',
    tipo_pago_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inicializar datos del formulario
  useEffect(() => {
    if (tiposPago.length > 0) {
      let defaultTipoId = tiposPago[0].id;

      if (cuota) {
        setFormData({
          concepto: cuota.concepto,
          monto: parseFloat(cuota.monto).toFixed(2),
          fecha_limite: cuota.fecha_limite ? cuota.fecha_limite.split('T')[0] : '',
          tipo_pago_id: cuota.tipo_pago_id,
        });
      } else {
        setFormData({
          concepto: '',
          monto: '',
          fecha_limite: '',
          tipo_pago_id: '',
        });
      }
    }
    setError('');
  }, [cuota, isOpen, tiposPago]);

  // Tipo de pago seleccionado
  const selectedTipoPago = useMemo(() => {
    return tiposPago.find(tp => tp.id === parseInt(formData.tipo_pago_id));
  }, [formData.tipo_pago_id, tiposPago]);

  // Precargar monto si tiene precio fijo
  useEffect(() => {
    if (selectedTipoPago) {
      const precioFijo = selectedTipoPago.precio_fijo;

      if (precioFijo !== null && precioFijo !== undefined) {
        const montoFormateado = parseFloat(precioFijo).toFixed(2);
        if (formData.monto !== montoFormateado) {
          setFormData(prev => ({
            ...prev,
            monto: montoFormateado,
          }));
        }
      } else if (!isEditing) {
        setFormData(prev => ({
          ...prev,
          monto: '',
        }));
      }
    }
  }, [formData.tipo_pago_id, selectedTipoPago, isEditing]);

  // Manejador de cambios de input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Genera vista previa del concepto
  const getConceptoPreview = () => {
    if (!selectedTipoPago) return 'Seleccione Tipo de Pago';
    if (!formData.fecha_limite) return `${selectedTipoPago.nombre} (Falta Fecha)`;

    try {
      const date = new Date(formData.fecha_limite + 'T00:00:00');
      const monthName = date.toLocaleString('es-ES', { month: 'long' });
      return `${selectedTipoPago.nombre} (${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
    } catch {
      return `${selectedTipoPago.nombre} (Fecha Inválida)`;
    }
  };

  // Guardar cuota
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (parseFloat(formData.monto) <= 0 || isNaN(parseFloat(formData.monto))) {
      setError("El monto debe ser un valor numérico positivo.");
      setLoading(false);
      return;
    }

    if (!selectedTipoPago) {
      setError("Debe seleccionar un tipo de pago válido.");
      setLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        periodo_id: periodoId,
        monto: parseFloat(formData.monto),
        tipo_pago_id: parseInt(formData.tipo_pago_id),
        fecha_limite: formData.fecha_limite,
        concepto: formData.concepto?.trim() || '',
        tipo_pago_nombre: selectedTipoPago.nombre
      };

      if (isEditing) {
        await api.put(`/config/cuotas/${cuota.id}`, dataToSubmit);
      } else {
        await api.post('/config/cuotas', dataToSubmit);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Error al guardar cuota:", err);
      setError(err.response?.data?.message || 'Error al guardar la cuota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cuota' : 'Crear Nueva Cuota'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Tipo de Pago y Monto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
            <select
              name="tipo_pago_id"
              value={formData.tipo_pago_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="" disabled hidden>Seleccionar tipo de pago...</option>
              {tiposPago.map(tp => (
                <option key={tp.id} value={tp.id}>
                  {tp.nombre} {tp.precio_fijo !== null}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto (S/)</label>
            <input
              type="number"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            {selectedTipoPago?.precio_fijo !== null && (
              <p className="text-xs text-green-600 mt-1">Monto establecido automáticamente.</p>
            )}
          </div>
        </div>

        {/* Fecha Límite */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Límite (Define el Mes/Orden)</label>
          <input
            type="date"
            name="fecha_limite"
            value={formData.fecha_limite}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Concepto (Opcional - Vista Previa: {getConceptoPreview()})
          </label>
          <input
            type="text"
            name="concepto"
            value={formData.concepto}
            onChange={handleChange}
            placeholder={getConceptoPreview()}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 py-2 px-4 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cuota'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CuotaForm;
