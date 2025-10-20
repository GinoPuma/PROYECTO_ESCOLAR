import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AdminUsersPage from "./pages/AdminPage";
import UserFormPage from "./pages/UserFormPage";
import StudentListPage from "./pages/StudentListPage";
import StudentFormPage from "./pages/StudentFormPage";
import ApoderadoListPage from "./pages/ApoderadoListPage";
import ApoderadoFormPage from "./pages/ApoderadoFormPage";
import ConfigPage from "./pages/ConfigPage";
import EnrollmentFormPage from "./pages/EnrollmentFormPage";
import EnrollmentListPage from "./pages/EnrollmentListPage";
import PaymentListPage from "./pages/PaymentListPage";
import PaymentFormPage from "./pages/PaymentFormPage";
import ReportsPage from "./pages/ReportsPage";

/* 
import PagosListPage from "./pages/PagosListPage";
import PagoFormPage from "./pages/PagoFormPage";
import ReportesPage from "./pages/ReportesPage";*/

import Layout from "./components/Layout/Layout";

const ProtectedRoute = ({ element: Element, allowedRoles, ...rest }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Cargando...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role) => user.rol === role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Element {...rest} />;
};

function App() {
  const generalManagerRoles = ["Secretaria", "Administrador"];

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute element={DashboardPage} />}
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute
                  element={AdminUsersPage}
                  allowedRoles={["Administrador"]}
                />
              }
            />
            <Route
              path="/admin/users/new"
              element={
                <ProtectedRoute
                  element={UserFormPage}
                  allowedRoles={["Administrador"]}
                />
              }
            />
            <Route
              path="/admin/users/edit/:id"
              element={
                <ProtectedRoute
                  element={UserFormPage}
                  allowedRoles={["Administrador"]}
                />
              }
            />
            {/* Rutas para gestionar estudiantes */}
            <Route
              path="/estudiantes"
              element={
                <ProtectedRoute
                  element={StudentListPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/estudiantes/new"
              element={
                <ProtectedRoute
                  element={StudentFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/estudiantes/edit/:id"
              element={
                <ProtectedRoute
                  element={StudentFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />

            {/* Rutas para gestionar apoderados */}
            <Route
              path="/responsables"
              element={
                <ProtectedRoute
                  element={ApoderadoListPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/responsables/new"
              element={
                <ProtectedRoute
                  element={ApoderadoFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/responsables/edit/:id"
              element={
                <ProtectedRoute
                  element={ApoderadoFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />

            <Route
              path="/matriculas"
              element={
                <ProtectedRoute
                  element={EnrollmentListPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/matriculas/new"
              element={
                <ProtectedRoute
                  element={EnrollmentFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/matriculas/edit/:id"
              element={
                <ProtectedRoute
                  element={EnrollmentFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />

            <Route
              path="/pagos"
              element={
                <ProtectedRoute
                  element={PaymentListPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/pagos/register/:matriculaId"
              element={
                <ProtectedRoute
                  element={PaymentFormPage}
                  allowedRoles={generalManagerRoles}
                />
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute
                  element={ReportsPage}
                  allowedRoles={["Administrador"]}
                />
              }
            />

            {/* Ruta de Configuración (Solo Admin) */}
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute
                  element={ConfigPage}
                  allowedRoles={["Administrador"]}
                />
              }
            />
            
          </Route>

          <Route
            path="*"
            element={
              <div className="p-8 text-center text-xl">
                Página no encontrada
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
