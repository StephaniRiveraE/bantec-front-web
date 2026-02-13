import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowAnonymous = false }) {
  const { loggedIn } = useAuth();
  const location = useLocation();

  // 1. Acceso explícitamente público
  if (allowAnonymous) return children;

  // 2. Modo desarrollo (opcional, quitar en prod)
  if (location?.pathname?.includes('-dev')) return children;

  // 3. Validación de Autenticación
  // Si no está logueado, redirigir al login preservando la ruta intentada en state (opcional)
  if (!loggedIn) {
      return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 4. Acceso concedido
  return children;
}