const Structure = require("../models/EducationalStructure");
const AcademicConfig = require("../models/AcademicConfig");
const Institution = require("../models/Institution");

/* =========================================================
 Estructura Educativa (Niveles, Grados, Secciones)
   ========================================================= */
exports.getStructureData = async (req, res) => {
  try {
    const [niveles, grados, secciones] = await Promise.all([
      Structure.getAllNiveles(),
      Structure.getAllGrados(),
      Structure.getAllSecciones(),
    ]);
    res.json({ niveles, grados, secciones });
  } catch (error) {
    console.error("Error al obtener estructura educativa:", error);
    res
      .status(500)
      .json({ message: "Error al cargar la estructura educativa." });
  }
};

/* --- CRUD Nivel --- */

exports.createNivel = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === "")
    return res
      .status(400)
      .json({ message: "El nombre del nivel es obligatorio." });
  try {
    const nuevoNivel = await Structure.createNivel(nombre.trim());
    res.status(201).json(nuevoNivel);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un nivel con ese nombre." });
    }
    console.error("Error al crear nivel:", error);
    res.status(500).json({ message: "Error interno al crear nivel." });
  }
};

exports.updateNivel = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === "")
    return res.status(400).json({ message: "El nombre es obligatorio." });
  try {
    const success = await Structure.updateNivel(id, nombre.trim());
    if (!success)
      return res.status(404).json({ message: "Nivel no encontrado." });
    res.json({ message: "Nivel actualizado." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un nivel con ese nombre." });
    }
    console.error("Error al actualizar nivel:", error);
    res.status(500).json({ message: "Error interno al actualizar nivel." });
  }
};

exports.deleteNivel = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await Structure.deleteNivel(id);
    if (!success)
      return res.status(404).json({ message: "Nivel no encontrado." });
    res.json({ message: "Nivel eliminado exitosamente." });
  } catch (error) {
    // Manejo de error de clave foránea
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "No se puede eliminar el nivel porque tiene grados asociados.",
      });
    }
    console.error("Error al eliminar nivel:", error);
    res.status(500).json({ message: "Error interno al eliminar nivel." });
  }
};

/* --- CRUD Grado --- */

exports.createGrado = async (req, res) => {
  const { nombre, nivel_id } = req.body;
  if (!nombre || !nivel_id)
    return res
      .status(400)
      .json({ message: "El nombre y el ID del nivel son obligatorios." });
  try {
    const nuevoGrado = await Structure.createGrado(nombre.trim(), nivel_id);
    res.status(201).json(nuevoGrado);
  } catch (error) {
    console.error("Error al crear grado:", error);
    res.status(500).json({ message: "Error interno al crear grado." });
  }
};

exports.updateGrado = async (req, res) => {
  const { id } = req.params;
  const { nombre, nivel_id } = req.body;
  if (!nombre || !nivel_id)
    return res
      .status(400)
      .json({ message: "El nombre y el ID del nivel son obligatorios." });
  try {
    const success = await Structure.updateGrado(id, nombre.trim(), nivel_id);
    if (!success)
      return res.status(404).json({ message: "Grado no encontrado." });
    res.json({ message: "Grado actualizado." });
  } catch (error) {
    console.error("Error al actualizar grado:", error);
    res.status(500).json({ message: "Error interno al actualizar grado." });
  }
};

exports.deleteGrado = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await Structure.deleteGrado(id);
    if (!success)
      return res.status(404).json({ message: "Grado no encontrado." });
    res.json({ message: "Grado eliminado exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "No se puede eliminar el grado porque tiene secciones asociadas.",
      });
    }
    console.error("Error al eliminar grado:", error);
    res.status(500).json({ message: "Error interno al eliminar grado." });
  }
};

/* --- CRUD Sección --- */

exports.createSeccion = async (req, res) => {
  const { nombre, grado_id } = req.body;
  if (!nombre || !grado_id)
    return res
      .status(400)
      .json({ message: "El nombre y el ID del grado son obligatorios." });
  try {
    const nuevaSeccion = await Structure.createSeccion(nombre.trim(), grado_id);
    res.status(201).json(nuevaSeccion);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Ya existe una sección con ese nombre para este grado.",
      });
    }
    console.error("Error al crear sección:", error);
    res.status(500).json({ message: "Error interno al crear sección." });
  }
};

exports.updateSeccion = async (req, res) => {
  const { id } = req.params;
  const { nombre, grado_id } = req.body; // grado_id podría ser necesario si permitimos mover la sección
  if (!nombre || !grado_id)
    return res
      .status(400)
      .json({ message: "El nombre y el ID del grado son obligatorios." });
  try {
    const success = await Structure.updateSeccion(id, nombre.trim(), grado_id);
    if (!success)
      return res.status(404).json({ message: "Sección no encontrada." });
    res.json({ message: "Sección actualizada." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Ya existe una sección con ese nombre para este grado.",
      });
    }
    console.error("Error al actualizar sección:", error);
    res.status(500).json({ message: "Error interno al actualizar sección." });
  }
};

exports.deleteSeccion = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await Structure.deleteSeccion(id);
    if (!success)
      return res.status(404).json({ message: "Sección no encontrada." });
    res.json({ message: "Sección eliminada exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "No se puede eliminar la sección porque tiene matrículas asociadas.",
      });
    }
    console.error("Error al eliminar sección:", error);
    res.status(500).json({ message: "Error interno al eliminar sección." });
  }
};

/* =========================================================
   PARTE 2: Periodos y Cuotas
   ========================================================= */

/* --- CRUD Periodos --- */

exports.getAllPeriodos = async (req, res) => {
  try {
    const periodos = await AcademicConfig.getAllPeriodos();
    res.json(periodos);
  } catch (error) {
    console.error("Error al cargar periodos:", error);
    res.status(500).json({ message: "Error al cargar periodos." });
  }
};

exports.createPeriodo = async (req, res) => {
  const data = req.body;
  if (!data.nombre || !data.fecha_inicio || !data.fecha_fin) {
    return res.status(400).json({
      message: "Nombre, fecha de inicio y fecha de fin son requeridos.",
    });
  }
  // Convertir activo a TINYINT (0 o 1)
  data.activo = data.activo ? 1 : 0;

  try {
    // Lógica avanzada: Si se marca como activo, desactivar otros (Opcional, se puede hacer en el modelo)

    const nuevoPeriodo = await AcademicConfig.createPeriodo(data);
    res.status(201).json(nuevoPeriodo);
  } catch (error) {
    console.error("Error al crear periodo:", error);
    res.status(500).json({ message: "Error al crear periodo." });
  }
};

exports.updatePeriodo = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!data.nombre || !data.fecha_inicio || !data.fecha_fin) {
    return res.status(400).json({
      message: "Nombre, fecha de inicio y fecha de fin son requeridos.",
    });
  }
  data.activo = data.activo ? 1 : 0;

  try {
    const success = await AcademicConfig.updatePeriodo(id, data);
    if (!success)
      return res.status(404).json({ message: "Periodo no encontrado." });
    res.json({ message: "Periodo actualizado." });
  } catch (error) {
    console.error("Error al actualizar periodo:", error);
    res.status(500).json({ message: "Error al actualizar periodo." });
  }
};

exports.deletePeriodo = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await AcademicConfig.deletePeriodo(id);
    if (!success)
      return res.status(404).json({ message: "Periodo no encontrado." });
    res.json({ message: "Periodo eliminado exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "No se puede eliminar el periodo porque tiene cuotas o matrículas asociadas.",
      });
    }
    console.error("Error al eliminar periodo:", error);
    res.status(500).json({ message: "Error interno al eliminar periodo." });
  }
};

/* --- CRUD Cuotas y Tipos de Pago --- */

exports.getPeriodoCuotas = async (req, res) => {
  const { periodoId } = req.params;
  try {
    const [cuotas, tiposPago] = await Promise.all([
      AcademicConfig.getCuotasByPeriodo(periodoId),
      AcademicConfig.getAllTiposPago(),
    ]);
    res.json({ cuotas, tiposPago });
  } catch (error) {
    console.error("Error al obtener cuotas:", error);
    res
      .status(500)
      .json({ message: "Error al cargar cuotas y tipos de pago." });
  }
};
const getMonthName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', { month: 'long' });
};

exports.createCuota = async (req, res) => {
  const data = req.body;

  // Necesitamos el tipo_pago_nombre (del frontend) y el periodo_id, monto, fecha_limite
  if (!data.periodo_id || !data.tipo_pago_id || !data.monto || !data.fecha_limite || !data.tipo_pago_nombre) {
    return res.status(400).json({ message: "Faltan campos obligatorios para la cuota (incluyendo tipo_pago_nombre)." });
  }

  if (isNaN(data.monto) || data.monto <= 0) {
    return res.status(400).json({ message: "El monto debe ser un número positivo." });
  }

  try {
    // 1. Deducir el Número de Orden (Mes)
    const date = new Date(data.fecha_limite);
    const monthNumber = date.getMonth() + 1; // getMonth() es 0-indexado

    // 2. Generar Concepto si no se proporciona uno explícito
    let conceptoGenerado = data.concepto?.trim() || '';
    if (conceptoGenerado === '') {
      const monthName = getMonthName(data.fecha_limite);
      // Ejemplo: "Mensualidad (Marzo)"
      conceptoGenerado = `${data.tipo_pago_nombre} (${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
    }

    const payload = {
      periodo_id: data.periodo_id,
      tipo_pago_id: data.tipo_pago_id,
      concepto: conceptoGenerado,
      monto: data.monto,
      fecha_limite: data.fecha_limite,
      orden: monthNumber, // Usamos el número de mes como orden
    };

    const nuevaCuota = await AcademicConfig.createCuota(payload);
    res.status(201).json(nuevaCuota);
  } catch (error) {
    console.error("Error al crear cuota:", error);
    res.status(500).json({ message: "Error al crear cuota." });
  }
};

exports.updateCuota = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Validamos campos obligatorios (incluyendo tipo_pago_nombre)
  if (!data.tipo_pago_id || !data.monto || !data.fecha_limite || !data.tipo_pago_nombre) {
    return res.status(400).json({ message: "Faltan campos obligatorios para actualizar la cuota." });
  }

  if (isNaN(data.monto) || data.monto <= 0) {
    return res.status(400).json({ message: "El monto debe ser un número positivo." });
  }

  try {
    // 1. Deducir el Número de Orden (Mes) y generar concepto (mismo flujo)
    const date = new Date(data.fecha_limite);
    const monthNumber = date.getMonth() + 1;

    let conceptoGenerado = data.concepto?.trim() || '';
    if (conceptoGenerado === '') {
      const monthName = getMonthName(data.fecha_limite);
      conceptoGenerado = `${data.tipo_pago_nombre} (${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
    }

    const payload = {
      tipo_pago_id: data.tipo_pago_id,
      concepto: conceptoGenerado,
      monto: data.monto,
      fecha_limite: data.fecha_limite,
      orden: monthNumber, 
    };

    const success = await AcademicConfig.updateCuota(id, payload);
    if (!success) return res.status(404).json({ message: "Cuota no encontrada." });
    res.json({ message: "Cuota actualizada." });
  } catch (error) {
    console.error("Error al actualizar cuota:", error);
    res.status(500).json({ message: "Error al actualizar cuota." });
  }
};
exports.deleteCuota = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await AcademicConfig.deleteCuota(id);
    if (!success)
      return res.status(404).json({ message: "Cuota no encontrada." });
    res.json({ message: "Cuota eliminada exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "No se puede eliminar la cuota porque está asociada a pagos realizados.",
      });
    }
    console.error("Error al eliminar cuota:", error);
    res.status(500).json({ message: "Error interno al eliminar cuota." });
  }
};

/* --- CRUD Tipos de Pago --- */

exports.getAllTiposPago = async (req, res) => {
  try {
    const tiposPago = await AcademicConfig.getAllTiposPago();
    res.json(tiposPago);
  } catch (error) {
    console.error("Error al cargar Tipos de Pago:", error);
    res.status(500).json({ message: "Error al cargar Tipos de Pago." });
  }
};

exports.createTipoPago = async (req, res) => {
  const data = req.body;
  if (!data.nombre)
    return res.status(400).json({ message: "El nombre es obligatorio." });
  try {
    const nuevoTipo = await AcademicConfig.createTipoPago(data);
    res.status(201).json(nuevoTipo);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un Tipo de Pago con ese nombre." });
    }
    res.status(500).json({ message: "Error al crear Tipo de Pago." });
  }
};

exports.updateTipoPago = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!data.nombre)
    return res.status(400).json({ message: "El nombre es obligatorio." });
  try {
    const success = await AcademicConfig.updateTipoPago(id, data);
    if (!success)
      return res.status(404).json({ message: "Tipo de Pago no encontrado." });
    res.json({ message: "Tipo de Pago actualizado." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un Tipo de Pago con ese nombre." });
    }
    res.status(500).json({ message: "Error al actualizar Tipo de Pago." });
  }
};

exports.deleteTipoPago = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await AcademicConfig.deleteTipoPago(id);
    if (!success)
      return res.status(404).json({ message: "Tipo de Pago no encontrado." });
    res.json({ message: "Tipo de Pago eliminado exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .json({
          message:
            "No se puede eliminar el Tipo de Pago porque tiene cuotas asociadas.",
        });
    }
    res.status(500).json({ message: "Error al eliminar Tipo de Pago." });
  }
};

/* --- CRUD Métodos de Pago --- */

exports.getAllMetodosPago = async (req, res) => {
  try {
    const metodosPago = await AcademicConfig.getAllMetodosPago();
    res.json(metodosPago);
  } catch (error) {
    console.error("Error al cargar Métodos de Pago:", error);
    res.status(500).json({ message: "Error al cargar Métodos de Pago." });
  }
};

exports.createMetodoPago = async (req, res) => {
  const data = req.body;
  if (!data.nombre)
    return res.status(400).json({ message: "El nombre es obligatorio." });
  try {
    const nuevoMetodo = await AcademicConfig.createMetodoPago(data);
    res.status(201).json(nuevoMetodo);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un Método de Pago con ese nombre." });
    }
    res.status(500).json({ message: "Error al crear Método de Pago." });
  }
};

exports.updateMetodoPago = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!data.nombre)
    return res.status(400).json({ message: "El nombre es obligatorio." });
  try {
    const success = await AcademicConfig.updateMetodoPago(id, data);
    if (!success)
      return res.status(404).json({ message: "Método de Pago no encontrado." });
    res.json({ message: "Método de Pago actualizado." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un Método de Pago con ese nombre." });
    }
    res.status(500).json({ message: "Error al actualizar Método de Pago." });
  }
};

exports.deleteMetodoPago = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await AcademicConfig.deleteMetodoPago(id);
    if (!success)
      return res.status(404).json({ message: "Método de Pago no encontrado." });
    res.json({ message: "Método de Pago eliminado exitosamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .json({
          message:
            "No se puede eliminar el Método de Pago porque está asociado a pagos realizados.",
        });
    }
    res.status(500).json({ message: "Error al eliminar Método de Pago." });
  }
};
/* =========================================================
   PARTE 3: Configuración Institución
   ========================================================= */

exports.getInstitution = async (req, res) => {
  try {
    const institution = await Institution.get();
    res.json(institution || {}); // Devuelve un objeto vacío si no existe
  } catch (error) {
    console.error("Error al obtener datos de la institución:", error);
    res.status(500).json({ message: "Error al obtener la configuración institucional." });
  }
};

exports.saveInstitution = async (req, res) => {
  const data = req.body;

  if (!data.nombre || data.nombre.length < 3) {
    return res.status(400).json({ message: "El nombre de la institución es obligatorio." });
  }

  try {
    let institution;
    if (data.id) {
      // Actualizar
      institution = await Institution.update(data);
      res.json({ message: "Datos de la institución actualizados.", institution });
    } else {
      // Crear (Solo debería haber una fila)
      institution = await Institution.create(data);
      res.status(201).json({ message: "Datos de la institución guardados.", institution });
    }
  } catch (error) {
    console.error("Error al guardar datos de la institución:", error);
    res.status(500).json({ message: "Error al procesar la configuración institucional." });
  }
};
