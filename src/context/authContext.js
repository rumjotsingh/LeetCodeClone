// src/context/AuthContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  logoutUser,
  loadUserFromStorage,
} from "../redux/slices/authSlice";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: reduxLoading } = useSelector((state) => state.auth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      if (!initialized) {
        setLoading(true);

        const hasUser = localStorage.getItem("user");
        const hasToken = localStorage.getItem("token");

        if (hasUser && hasToken) {
          try {
            await dispatch(loadUserFromStorage()).unwrap();
          } catch (error) {
            console.error("Failed to load user:", error);
          }
        }

        setInitialized(true);
        setLoading(false);
      }
    };

    initAuth();
  }, [dispatch, initialized]);

  // Handle auth state changes
  useEffect(() => {
    if (!loading) {
      const newIsAuthenticated = !!user;
      setIsAuthenticated(newIsAuthenticated);

      // Redirect if on auth pages while authenticated
      if (
        newIsAuthenticated &&
        (pathname === "/login" || pathname === "/register")
      ) {
        router.replace(
          user.role === "admin" ? "/dashboard/admin" : "/dashboard/user"
        );
      }
    }
  }, [user, loading, router, pathname]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      await dispatch(loginUser({ email, password })).unwrap();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    dispatch(logoutUser());
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
    setLoading(false);
  };

  const value = {
    isAuthenticated,
    user,
    loading: loading || reduxLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
