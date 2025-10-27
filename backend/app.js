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
const reportRoutes = require("./routes/reportRoutes");
const aiReminderRoutes = require("./routes/aiReminderRoutes"); 
const reminderConfigRoutes = require("./routes/reminderConfigRoutes");
const statsRoutes = require("./routes/statsRoutes");


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
app.use("/api/reports", reportRoutes);
app.use("/api/reminder", aiReminderRoutes);
app.use("/api/reminder-config", reminderConfigRoutes);
app.use("/api/stats", statsRoutes); 

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

module.exports = app;
