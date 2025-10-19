import { useState, useEffect, createContext, useContext } from "react";
import api from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  /*   const [institution, setInstitution] = useState(null);
   */ const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const userResponse = await api.get("/users/me");
          setUser(userResponse.data);

          /* try {
            const institutionResponse = await api.get("/config/institution");
            setInstitution(institutionResponse.data);
          } catch (instError) {
            console.warn(
              "No se pupo obtener informacion de la institución.",
              instError.response?.data?.message || instError.message
            );
            setInstitution(null);
          } */
        } catch (error) {
          console.error("Error al inicializar autenticación:", error);
          // Si falla la obtención del usuario, limpia el estado
          setToken(null);
          localStorage.removeItem("authToken");
          setUser(null);
          /*           setInstitution(null);
           */
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      localStorage.setItem("authToken", response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);

      /* try {
        const institutionResponse = await api.get("/config/institution");
        setInstitution(institutionResponse.data);
      } catch (instError) {
        console.warn(
          "Could not fetch institution data on login:",
          instError.response?.data?.message || instError.message
        );
        setInstitution(null);
      }
 */
      return response.data;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Register error:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
/*     setInstitution(null);
 */  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
