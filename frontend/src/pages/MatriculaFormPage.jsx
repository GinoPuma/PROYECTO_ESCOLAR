import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const DEFAULT_ESTUDIANTE_DATA = {
    id: null,
    numero_identificacion: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    genero: '',
};

const DEFAULT_APODERADO_DATA = {
    id: null,
    dni: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono: '',
    email: '',
    direccion: '',
};

const MatriculaFormPage = () => {
    const navigate = useNavigate();
    
    // --- Estados de Datos de Personas ---
    const [studentData, setStudentData] = useState(DEFAULT_ESTUDIANTE_DATA);
    const [guardianData, setGuardianData] = useState(DEFAULT_APODERADO_DATA);
    
    // --- Estados del Formulario Matrícula ---
    const [matriculaForm, setMatriculaForm] = useState({
        periodo_id: '',
        seccion_id: '',
        descuento_porcentaje: 0,
        fecha_matricula: moment().format('YYYY-MM-DD'),
    });

    // --- ESTADO CLAVE: PLANTILLA DE CUOTAS DEL PERÍODO SELECCIONADO ---
    const [cuotasTemplate, setCuotasTemplate] = useState({ 
        cuotaMatricula: null, 
        cuotasMensualidades: [] 
    });

    // --- Estados de Soporte ---
    const [prerequisites, setPrerequisites] = useState({ periodos: [], tiposPago: [], secciones: [] });
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Memos para Tipos de Pago (Solo para nombres) ---
    const tipoMatricula = useMemo(() => prerequisites.tiposPago.find(tp => tp.nombre?.toLowerCase().includes('matrícula')), [prerequisites.tiposPago]);
    const tipoMensualidad = useMemo(() => prerequisites.tiposPago.find(tp => tp.nombre?.toLowerCase().includes('mensualidad')), [prerequisites.tiposPago]);

    // ----------------------------------------------------------------------
    // CÁLCULO DE COSTOS DINÁMICO (Usando la Plantilla)
    // ----------------------------------------------------------------------
    const costos = useMemo(() => {
        // Montos BASE tomados de la CUOTA TEMPLATE del período seleccionado
        const costoBaseMatricula = cuotasTemplate.cuotaMatricula?.monto || 0;
        
        // Asumimos que todas las mensualidades tienen el mismo monto base en la plantilla
        const costoBaseMensualidad = cuotasTemplate.cuotasMensualidades[0]?.monto || 0; 
        
        const descuento = parseFloat(matriculaForm.descuento_porcentaje) || 0;
        
        const montoMensualidadFinal = costoBaseMensualidad - (costoBaseMensualidad * descuento / 100);
        
        return {
            monto_matricula: parseFloat(costoBaseMatricula),
            monto_mensualidad_base: parseFloat(costoBaseMensualidad),
            monto_mensualidad_final: Math.max(0, montoMensualidadFinal).toFixed(2),
            numMeses: cuotasTemplate.cuotasMensualidades.length
        };
    }, [matriculaForm.descuento_porcentaje, cuotasTemplate]);


    // ----------------------------------------------------------------------
    // EFECTO 1: Carga de Prerrequisitos Base
    // ----------------------------------------------------------------------
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const response = await api.get('/matriculas/prerequisites');
                setPrerequisites(response.data);
                
                const activePeriodo = response.data.periodos.find(p => p.activo === 1);
                if (activePeriodo) {
                    setMatriculaForm(prev => ({ ...prev, periodo_id: activePeriodo.id }));
                }
            } catch (err) {
                setError("Error al cargar datos base (períodos, secciones, tipos de pago).");
            } finally {
                setLoading(false);
            }
        };
        fetchPrerequisites();
    }, []);

    // ----------------------------------------------------------------------
    // EFECTO 2: Carga de Plantilla de Cuotas al cambiar el Período
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (matriculaForm.periodo_id) {
            fetchCuotasTemplate(matriculaForm.periodo_id);
        } else {
            setCuotasTemplate({ cuotaMatricula: null, cuotasMensualidades: [] });
        }
    }, [matriculaForm.periodo_id]);

    const fetchCuotasTemplate = async (periodoId) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/matriculas/period/${periodoId}/cuotas-template`);
            
            if (response.data.cuotasMensualidades.length === 0) {
                 setError("Advertencia: No hay cuotas mensuales configuradas para este período.");
            }
            if (!response.data.cuotaMatricula) {
                 setError(prev => (prev || '') + " Advertencia: No hay cuota de Matrícula configurada para este período.");
            }
            
            setCuotasTemplate(response.data);
        } catch (err) {
            setError("Error al cargar la plantilla de costos para el período seleccionado. Asegúrese de que la configuración está completa.");
            setCuotasTemplate({ cuotaMatricula: null, cuotasMensualidades: [] });
        } finally {
            setLoading(false);
        }
    };


    // ----------------------------------------------------------------------
    // BUSQUEDA DE PERSONAS 
    // ----------------------------------------------------------------------
    
    const handleSearchPerson = async (type) => {
        const isStudent = type === 'estudiante';
        const rawDni = isStudent ? studentData.numero_identificacion : guardianData.dni;
        
        // FIX CLAVE: Limpiar espacios en blanco del DNI antes de buscar
        const searchDni = rawDni ? rawDni.trim() : ''; 

        if (!searchDni) {
            setError(`Ingrese el DNI/Identificación del ${type}.`);
            return;
        }
        
        setSearchLoading(true);
        setError('');
        
        try {
            const endpoint = isStudent ? `/students/dni/${searchDni}` : `/apoderados/dni/${searchDni}`;
            const response = await api.get(endpoint);
            
            const data = response.data;
            
            const mappedData = isStudent 
                ? { 
                    ...data, 
                    id: data.id,
                    fecha_nacimiento: data.fecha_nacimiento ? moment(data.fecha_nacimiento).format('YYYY-MM-DD') : '',
                }
                : { ...data, id: data.id };
            
            if (isStudent) {
                setStudentData(mappedData);
            } else {
                setGuardianData(mappedData);
            }

        } catch (err) {
            const currentDni = rawDni;
            if (err.response && err.response.status === 404) {
                // Si no existe, limpiamos campos de persona, manteniendo el DNI introducido
                if (isStudent) {
                    setStudentData({ 
                        ...DEFAULT_ESTUDIANTE_DATA, 
                        numero_identificacion: currentDni,
                        id: null 
                    });
                } else {
                    setGuardianData({ 
                        ...DEFAULT_APODERADO_DATA, 
                        dni: currentDni,
                        id: null
                    });
                }
                setError(`${type.toUpperCase()} no encontrado. Debe estar previamente registrado para matricular.`);
            } else {
                setError(`Error al buscar ${type}.`);
            }
        } finally {
            setSearchLoading(false);
        }
    };
    
    // ----------------------------------------------------------------------
    // HANDLERS DE CAMBIOS Y SUBMIT
    // ----------------------------------------------------------------------

    const handleStudentDataChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleGuardianDataChange = (e) => {
        const { name, value } = e.target;
        setGuardianData(prev => ({ ...prev, [name]: value }));
        setError('');
    };
    
    const handleMatriculaFormChange = (e) => {
        const { name, value } = e.target;
        setMatriculaForm(prev => ({ 
            ...prev, 
            [name]: name === 'periodo_id' || name === 'seccion_id' || name === 'descuento_porcentaje' ? parseInt(value) : value 
        }));
    };
    
    const handleResetPerson = (type) => {
        if (type === 'estudiante') {
            setStudentData(DEFAULT_ESTUDIANTE_DATA);
        } else {
            setGuardianData(DEFAULT_APODERADO_DATA);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!studentData.id || !guardianData.id) {
            setError("Debe seleccionar un Estudiante y un Apoderado existentes (con ID) antes de matricular.");
            return;
        }
        if (!matriculaForm.periodo_id || !matriculaForm.seccion_id) {
             setError("Debe seleccionar Periodo y Sección.");
             return;
        }
        if(costos.numMeses === 0 || !cuotasTemplate.cuotaMatricula) {
            setError("El periodo seleccionado no tiene la configuración de costos completa (Matrícula y/o Mensualidad).");
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const payload = {
                estudiante_id: studentData.id,
                apoderado_id: guardianData.id,
                periodo_id: matriculaForm.periodo_id,
                seccion_id: matriculaForm.seccion_id,
                fecha_matricula: matriculaForm.fecha_matricula,
                
                monto_matricula: costos.monto_matricula, 
                monto_mensualidad_final: costos.monto_mensualidad_final,
                descuento_porcentaje: matriculaForm.descuento_porcentaje,
            };
            
            await api.post('/matriculas', payload);
            alert("Matrícula registrada y cuotas generadas exitosamente.");
            navigate('/matriculas');
        } catch (err) {
            console.error("Error al registrar matrícula:", err);
            setError(err.response?.data?.message || 'Error al registrar la matrícula. Revise la consola.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Nueva Matrícula
            </h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto space-y-6">
                
                {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
                {loading && prerequisites.periodos.length === 0 && <div className="text-center">Cargando configuración base...</div>}


                {/* ======================================= */}
                {/* BLOQUE 1: DATOS DEL ESTUDIANTE */}
                {/* ======================================= */}
                <div className="border p-4 rounded bg-gray-50">
                    <h3 className="text-xl font-semibold mb-3 text-blue-800">1. Datos Personales del Estudiante</h3>
                    
                    {/* BÚSQUEDA DEL ESTUDIANTE */}
                    <div className="flex space-x-3 mb-4">
                        <input 
                            type="text" 
                            value={studentData.numero_identificacion} 
                            onChange={handleStudentDataChange} 
                            name="numero_identificacion"
                            className="flex-grow p-2 border rounded"
                            placeholder="DNI/Identificación del estudiante"
                            required
                            disabled={studentData.id !== null}
                        />
                        <button 
                            type="button"
                            onClick={() => handleSearchPerson('estudiante')}
                            disabled={searchLoading || studentData.id !== null}
                            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {studentData.id ? 'Estudiante Cargado' : (searchLoading ? 'Buscando...' : 'Buscar DNI')}
                        </button>
                        {studentData.id && (
                            <button
                                type="button"
                                onClick={() => handleResetPerson('estudiante')}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                    
                    {/* Campos de Estudiante */}
                    <div className="grid grid-cols-4 gap-4">
                        <input type="text" name="primer_nombre" value={studentData.primer_nombre} onChange={handleStudentDataChange} placeholder="1er Nombre" required className="p-2 border rounded" disabled={studentData.id !== null} />
                        <input type="text" name="segundo_nombre" value={studentData.segundo_nombre || ''} onChange={handleStudentDataChange} placeholder="2do Nombre (Opcional)" className="p-2 border rounded" disabled={studentData.id !== null} />
                        <input type="text" name="primer_apellido" value={studentData.primer_apellido} onChange={handleStudentDataChange} placeholder="1er Apellido" required className="p-2 border rounded" disabled={studentData.id !== null} />
                        <input type="text" name="segundo_apellido" value={studentData.segundo_apellido || ''} onChange={handleStudentDataChange} placeholder="2do Apellido (Opcional)" className="p-2 border rounded" disabled={studentData.id !== null} />
                        
                        <input type="date" name="fecha_nacimiento" value={studentData.fecha_nacimiento} onChange={handleStudentDataChange} required className="p-2 border rounded" disabled={studentData.id !== null} />
                        <select name="genero" value={studentData.genero} onChange={handleStudentDataChange} required className="p-2 border rounded" disabled={studentData.id !== null}>
                            <option value="">Género (*)</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                         
                        {studentData.id && (
                             <div className="col-span-4 text-green-600 font-medium">Estudiante #{studentData.id} encontrado y listo.</div>
                        )}
                        {!studentData.id && studentData.numero_identificacion && (
                             <div className="col-span-4 text-orange-600 font-medium">Estudiante no encontrado. Regístrelo en el módulo "Estudiantes".</div>
                        )}
                    </div>
                </div>

                {/* ======================================= */}
                {/* BLOQUE 2: DATOS DEL APODERADO */}
                {/* ======================================= */}
                <div className="border p-4 rounded bg-gray-50">
                    <h3 className="text-xl font-semibold mb-3 text-purple-800">2. Datos del Apoderado (Responsable)</h3>
                    
                    {/* BÚSQUEDA DEL APODERADO */}
                    <div className="flex space-x-3 mb-4">
                        <input 
                            type="text" 
                            value={guardianData.dni} 
                            onChange={handleGuardianDataChange} 
                            name="dni"
                            className="flex-grow p-2 border rounded"
                            placeholder="DNI del Apoderado"
                            required
                            disabled={guardianData.id !== null}
                        />
                        <button 
                            type="button"
                            onClick={() => handleSearchPerson('apoderado')}
                            disabled={searchLoading || guardianData.id !== null}
                            className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {guardianData.id ? 'Apoderado Cargado' : (searchLoading ? 'Buscando...' : 'Buscar DNI')}
                        </button>
                        {guardianData.id && (
                            <button
                                type="button"
                                onClick={() => handleResetPerson('apoderado')}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Campos del Apoderado */}
                     <div className="grid grid-cols-4 gap-4">
                        <input type="text" name="primer_nombre" value={guardianData.primer_nombre} onChange={handleGuardianDataChange} placeholder="1er Nombre" required className="p-2 border rounded" disabled={guardianData.id !== null} />
                        <input type="text" name="segundo_nombre" value={guardianData.segundo_nombre || ''} onChange={handleGuardianDataChange} placeholder="2do Nombre (Opcional)" className="p-2 border rounded" disabled={guardianData.id !== null} />
                        <input type="text" name="primer_apellido" value={guardianData.primer_apellido} onChange={handleGuardianDataChange} placeholder="1er Apellido" required className="p-2 border rounded" disabled={guardianData.id !== null} />
                        <input type="text" name="segundo_apellido" value={guardianData.segundo_apellido || ''} onChange={handleGuardianDataChange} placeholder="2do Apellido (Opcional)" className="p-2 border rounded" disabled={guardianData.id !== null} />
                        
                        <input type="tel" name="telefono" value={guardianData.telefono} onChange={handleGuardianDataChange} placeholder="Teléfono" required className="p-2 border rounded" disabled={guardianData.id !== null} />
                        <input type="email" name="email" value={guardianData.email || ''} onChange={handleGuardianDataChange} placeholder="Email" className="p-2 border rounded" disabled={guardianData.id !== null} />
                        <input type="text" name="direccion" value={guardianData.direccion || ''} onChange={handleGuardianDataChange} placeholder="Dirección" className="p-2 border rounded col-span-2" disabled={guardianData.id !== null} />
                        
                        {guardianData.id && (
                             <div className="col-span-4 text-green-600 font-medium">Apoderado #{guardianData.id} encontrado y listo.</div>
                        )}
                         {!guardianData.id && guardianData.dni && (
                             <div className="col-span-4 text-orange-600 font-medium">Apoderado no encontrado. Regístrelo en el módulo "Apoderados".</div>
                        )}
                    </div>
                </div>


                {/* ======================================= */}
                {/* BLOQUE 3: DETALLE DE MATRÍCULA Y COSTOS */}
                {/* ======================================= */}
                {studentData.id && guardianData.id ? (
                    <div className="border p-4 rounded bg-indigo-50">
                        <h3 className="text-xl font-semibold mb-4 text-indigo-800">3. Configuración Académica y Costos</h3>
                        
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Periodo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Período (*)</label>
                                <select name="periodo_id" value={matriculaForm.periodo_id} onChange={handleMatriculaFormChange} required className="p-2 border rounded w-full">
                                    <option value="">Seleccione Periodo</option>
                                    {prerequisites.periodos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} {p.activo === 1 ? '(ACTIVO)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Sección */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Grado y Sección (*)</label>
                                <select name="seccion_id" value={matriculaForm.seccion_id} onChange={handleMatriculaFormChange} required className="p-2 border rounded w-full">
                                    <option value="">Seleccione Sección</option>
                                    {prerequisites.secciones.map(s => (
                                        <option key={s.id} value={s.id}>{s.nivel_nombre} - {s.grado_nombre} {s.seccion_nombre}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Fecha */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Matrícula (*)</label>
                                <input type="date" name="fecha_matricula" value={matriculaForm.fecha_matricula} onChange={handleMatriculaFormChange} required className="p-2 border rounded w-full" />
                            </div>
                        </div>

                        {/* Detalle de Costos */}
                        <div className="grid grid-cols-3 gap-6 p-4 border rounded bg-white">
                            
                            {/* Columna 1: Matrícula */}
                            <div className="border-r pr-4">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Matrícula ({tipoMatricula?.nombre || 'Tipo no definido'})</h4>
                                <p className="text-gray-600">Monto Base:</p>
                                <p className="text-2xl font-bold">S/ {costos.monto_matricula.toFixed(2)}</p>
                                {cuotasTemplate.cuotaMatricula === null && <p className="text-sm text-red-500">No hay plantilla de Matrícula.</p>}
                            </div>

                            {/* Columna 2: Mensualidad */}
                            <div className="border-r pr-4">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Pensión ({tipoMensualidad?.nombre || 'Tipo no definido'})</h4>
                                <p className="text-gray-600">Monto Base: S/ {costos.monto_mensualidad_base.toFixed(2)}</p>
                                <p className="text-gray-600 text-sm">Cuotas a generar: {costos.numMeses}</p>
                                
                                <label className="block text-sm font-medium text-gray-700 mt-2">Descuento (%)</label>
                                <input 
                                    type="number" 
                                    name="descuento_porcentaje" 
                                    value={matriculaForm.descuento_porcentaje} 
                                    onChange={handleMatriculaFormChange} 
                                    min="0" max="100" 
                                    className="p-2 border rounded w-full" 
                                />
                            </div>

                            {/* Columna 3: Resultado Final */}
                            <div className="flex flex-col justify-center bg-green-50 p-3 rounded">
                                <h4 className="font-bold text-md text-green-700">Monto Mensual Final</h4>
                                <p className="text-2xl font-extrabold text-green-900">
                                    S/ {costos.monto_mensualidad_final}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">Se generarán {costos.numMeses} cuotas con este valor.</p>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500 border border-dashed rounded">
                        Debe encontrar y cargar un Estudiante y un Apoderado para configurar la matrícula.
                    </div>
                )}
                
                <div className="flex justify-end pt-4 border-t">
                    <button 
                        type="submit" 
                        disabled={loading || !studentData.id || !guardianData.id || costos.numMeses === 0 || !cuotasTemplate.cuotaMatricula}
                        className="bg-green-600 text-white px-6 py-3 rounded disabled:opacity-50 text-lg font-bold"
                    >
                        {loading ? 'Registrando...' : 'Registrar Matrícula'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MatriculaFormPage;