import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Modal from '../UI/Modal';

const RuleFormModal = ({ isOpen, onClose, initialData, onSave }) => {
    const isEditing = !!initialData && initialData.id;
    const [formData, setFormData] = useState(initialData || {});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            // Asegurarse de que el estado activo sea booleano para el checkbox
            setFormData({ ...initialData, activo: initialData.activo === 1 || initialData.activo === true });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const payload = {
                ...formData,
                activo: formData.activo ? 1 : 0, // Convertir booleano a 0/1 para MySQL
                dias_antes_despues: parseInt(formData.dias_antes_despues)
            };

            if (isEditing) {
                await api.put(`/reminder-config/${formData.id}`, payload);
            } else {
                await api.post('/reminder-config', payload);
            }
            
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar la regla.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isEditing ? `Editar Regla: ${formData.nombre_regla}` : 'Crear Nueva Regla de Recordatorio'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                
                {/* Nombre de la Regla */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de la Regla</label>
                    <input 
                        type="text" 
                        name="nombre_regla" 
                        value={formData.nombre_regla || ''} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-2 border rounded" 
                    />
                </div>
                
                {/* Tipo de Objetivo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Objetivo del Recordatorio</label>
                    <select 
                        name="tipo_objetivo" 
                        value={formData.tipo_objetivo || ''} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-2 border rounded"
                    >
                        <option value="VENCIDOS">Cuotas Vencidas (Morosos)</option>
                        <option value="POR_VENCER">Cuotas Próximas a Vencer</option>
                        <option value="TODOS">Todas las cuotas pendientes</option>
                    </select>
                </div>
                
                {/* Días y Hora */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Días antes/después
                            {formData.tipo_objetivo === 'VENCIDOS' ? ' (+ Días de Mora)' : 
                             formData.tipo_objetivo === 'POR_VENCER' ? ' (- Días Antes)' : 'Días'}
                        </label>
                        <input 
                            type="number" 
                            name="dias_antes_despues" 
                            value={formData.dias_antes_despues || 0} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 border rounded" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ej: Para cuotas por vencer, use -1 (1 día antes). Para vencidas, use 1 (1 día después).
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hora de Envío (HH:MM)</label>
                        <input 
                            type="time" 
                            name="hora_envio" 
                            value={formData.hora_envio || '10:00'} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                </div>

                {/* Frecuencia y Estado */}
                <div className="grid grid-cols-2 gap-4 items-center">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
                        <select 
                            name="frecuencia" 
                            value={formData.frecuencia || 'DIARIO'} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 border rounded"
                        >
                            <option value="DIARIO">Diario</option>
                            <option value="SEMANAL">Semanal</option>
                            <option value="MENSUAL">Mensual</option>
                            <option value="UNA_VEZ">Una Sola Vez</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            name="activo" 
                            checked={formData.activo || false} 
                            onChange={handleChange} 
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded" 
                        />
                        <label className="ml-2 block text-sm text-gray-900">Regla Activa</label>
                    </div>
                </div>
                
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
                        className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Regla'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RuleFormModal;
