import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login.jsx";
import SeleccionarTransaccion from "./pages/SeleccionarTransaccion.jsx";
import GestionDevoluciones from "./pages/GestionDevoluciones.jsx";
import BuscarCuenta from "./components/BuscarCuenta/BuscarCuenta.jsx";
import DatosCuenta from "./components/DatosCuenta/DatosCuenta.jsx";
import ValoresTransaccion from "./components/ValoresTransaccion/ValoresTransaccion.jsx";
import ValoresDeposito from "./components/ValoresDeposito/ValoresDeposito.jsx";
import Comprobante from "./components/Comprobante/Comprobante.jsx";
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/seleccionar" element={<SeleccionarTransaccion />} />
        <Route path="/devoluciones" element={<GestionDevoluciones />} />
        <Route path="/buscar" element={<BuscarCuenta />} />
        <Route path="/datos" element={<DatosCuenta />} />
        <Route path="/valores" element={<ValoresTransaccion />} />
        <Route path="/deposito" element={<ValoresDeposito />} />
        <Route path="/comprobante/:id" element={<Comprobante />} />
      </Routes>
    </BrowserRouter>
  );
}