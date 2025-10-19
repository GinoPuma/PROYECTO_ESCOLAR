const pool = require("../config/db");
const Matricula = require("../models/Matricula");
const AcademicConfig = require("../models/AcademicConfig");

exports.getMatriculaPrerequisites = async (req, res) => {
  try {
    const data = await Matricula.getPrerequisites();
    res.json(data);
  } catch (error) {
    console.error("Error al cargar requisitos de matrícula:", error);
    res
      .status(500)
      .json({ message: "Error al cargar datos base para la matrícula." });
  }
};

exports.getAllMatriculas = async (req, res) => {
  try {
    const matriculas = await Matricula.findAll();
    res.json(matriculas);
  } catch (error) {
    console.error("Error al listar matrículas:", error);
    res.status(500).json({ message: "Error al listar matrículas." });
  }
};

exports.createMatricula = async (req, res) => {
  const {
    estudiante_id,
    apoderado_id,
    periodo_id,
    seccion_id,
    monto_matricula,
    monto_mensualidad_final,
    fecha_matricula,
  } = req.body;

  if (
    !estudiante_id ||
    !apoderado_id ||
    !periodo_id ||
    !seccion_id ||
    monto_matricula === undefined ||
    monto_mensualidad_final === undefined
  ) {
    return res.status(400).json({
      message: "Faltan datos esenciales para la matrícula (IDs o Montos).",
    });
  }

  const finalMontoMatricula = parseFloat(monto_matricula);
  const finalMontoMensualidad = parseFloat(monto_mensualidad_final);

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Verificar duplicidad de matrícula (Activa en el mismo periodo)
    const existingActiveMatricula = await Matricula.findByStudentAndPeriod(
      estudiante_id,
      periodo_id
    );
    if (existingActiveMatricula) {
      await connection.rollback();
      return res.status(409).json({
        message: "El estudiante ya tiene una matrícula activa en este periodo.",
      });
    }

    // 2. Crear la Matrícula principal (Usando la conexión transaccional)
    const [result] = await connection.execute(
      `INSERT INTO matriculas (estudiante_id, apoderado_id, seccion_id, periodo_id, fecha_matricula, estado) 
             VALUES (?, ?, ?, ?, ?, 'Activa')`,
      [estudiante_id, apoderado_id, seccion_id, periodo_id, fecha_matricula]
    );
    const nuevaMatriculaId = result.insertId;

    // 3. Generar Cuotas de Pago (Matrícula + Mensualidades)

    const cuotasBase = await AcademicConfig.getCuotasByPeriodo(periodo_id);
    const tiposPago = await AcademicConfig.getAllTiposPago();

    const tipoMatricula = tiposPago.find((tp) =>
      tp.nombre.toLowerCase().includes("matrícula")
    );
    const tipoMensualidad = tiposPago.find((tp) =>
      tp.nombre.toLowerCase().includes("mensualidad")
    );

    // a) Generar Cuota de Matrícula
    if (tipoMatricula && finalMontoMatricula > 0) {
      await connection.execute(
        `INSERT INTO cuotas (periodo_id, tipo_pago_id, concepto, monto, fecha_limite, orden, matricula_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          periodo_id,
          tipoMatricula.id,
          "Cuota Matrícula",
          finalMontoMatricula,
          fecha_matricula,
          0, // Orden 0 para matrícula
          nuevaMatriculaId,
        ]
      );
    }

    // b) Generar Mensualidades
    const mensualidadesBase = cuotasBase.filter(
      (c) => c.tipo_pago_id === tipoMensualidad?.id
    );

    for (const base of mensualidadesBase) {
      await connection.execute(
        `INSERT INTO cuotas (periodo_id, tipo_pago_id, concepto, monto, fecha_limite, orden, matricula_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          periodo_id,
          tipoMensualidad.id,
          `Mensualidad ${base.orden}`,
          finalMontoMensualidad, // Monto con descuento aplicado
          base.fecha_limite,
          base.orden,
          nuevaMatriculaId,
        ]
      );
    }

    // 4. Confirmar Transacción
    await connection.commit();
    connection.release();

    res.status(201).json({
      message: "Matrícula y Cuotas generadas exitosamente.",
      matricula: { id: nuevaMatriculaId },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();

    console.error("Error en createMatricula:", error);
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message:
          "Uno de los IDs (Estudiante, Apoderado, Sección o Período) es inválido.",
      });
    }
    res.status(500).json({ message: "Error interno al crear la matrícula." });
  }
};

exports.getPeriodCuotasTemplate = async (req, res) => {
  const { periodoId } = req.params;

  try {
    const [cuotas, tiposPago] = await Promise.all([
      AcademicConfig.getCuotasByPeriodo(periodoId),
      AcademicConfig.getAllTiposPago(),
    ]);

    // Mapear los tipos de pago por ID para fácil acceso
    const tiposPagoMap = tiposPago.reduce(
      (acc, tp) => ({ ...acc, [tp.id]: tp }),
      {}
    );

    // Filtrar cuota de Matrícula (orden 0 o concepto similar)
    const cuotaMatricula = cuotas.find(
      (c) => c.concepto.toLowerCase().includes("matrícula") || c.orden === 0
    );

    // Filtrar cuotas de Mensualidad
    const cuotasMensualidades = cuotas.filter(
      (c) => c.concepto.toLowerCase().includes("mensualidad") && c.orden > 0
    );

    res.json({
      cuotaMatricula: cuotaMatricula, // Para obtener el monto base
      cuotasMensualidades: cuotasMensualidades, // Para obtener el monto base y el número de meses
      tiposPagoMap: tiposPagoMap,
    });
  } catch (error) {
    console.error("Error al obtener plantilla de cuotas:", error);
    res
      .status(500)
      .json({ message: "Error al cargar la plantilla de cuotas del período." });
  }
};
