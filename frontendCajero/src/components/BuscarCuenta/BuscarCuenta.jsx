import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cuentas } from '../../services/api';
import '../BuscarCuenta/BuscarCuenta.css';

export default function BuscarCuenta() {
  const [params] = useSearchParams();
  const tipo = params.get('tipo') || 'Transacción'; // 'RETIRO' o 'DEPOSITO'
  const [numero, setNumero] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const buscar = async () => {
    setError('');

    if (!numero) {
      setError('Por favor ingrese un número de cuenta o cédula.');
      return;
    }

    setLoading(true);
    try {
      // Usamos el método unificado del api.js que decide a qué endpoint llamar
      await cuentas.getCuenta(numero);

      // Si no hay error, navegamos
      navigate(`/datos?tipo=${tipo}&cuenta=${numero}`);
    } catch (e) {
      console.error(e);
      setError('Cuenta no encontrada o número incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="header">
        <div className="left">BANTEC</div>
        <div className="right">
          <button className="btn-logout" onClick={() => { localStorage.removeItem('cajero'); window.location.href = '/' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="screen">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3>{tipo} - Buscar Cliente</h3>
          <p className="small-muted" style={{ marginBottom: '1rem' }}>
            Ingrese el número de cuenta o cédula para verificar los datos antes de continuar.
          </p>

          <label>Número de cédula / cuenta</label>
          <input
            value={numero}
            onChange={e => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) setNumero(val);
            }}
            placeholder="Ej: 1726689095 o 123456789012"
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
          />

          {error && <div className="error">{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className="btn-primary" onClick={buscar} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </>
  );
}