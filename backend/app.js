const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const apoderadoRoutes = require("./routes/apoderadoRoutes");
const configRoutes = require("./routes/configRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes"); 
const paymentRoutes = require("./routes/paymentRoutes");

/* 
const configRoutes = require("./routes/configRoutes");
const studentRoutes = require("./routes/studentRoutes");
const statsRoutes = require("./routes/statsRoutes");
const pagoRoutes = require("./routes/pagoRoutes");
const tipoPagoRoutes = require("./routes/tipoPagoRoutes");
const metodoPagoRoutes = require("./routes/metodoPagoRoutes");
const responsableRoutes = require("./routes/responsableRoutes");
const cuotaRoutes = require("./routes/cuotaRoutes");
const periodoRoutes = require("./routes/periodoRoutes"); */

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/apoderados", apoderadoRoutes);
app.use("/api/config", configRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/pagos", paymentRoutes);
/* 
app.use("/api/stats", statsRoutes);
*/

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

module.exports = app;
