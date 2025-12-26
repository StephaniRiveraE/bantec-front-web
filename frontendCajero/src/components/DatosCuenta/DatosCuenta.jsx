import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cuentas } from '../../services/api';
import '../DatosCuenta/DatosCuenta.css';

export default function DatosCuenta(){
  const [params] = useSearchParams();
  const tipo = params.get('tipo');
  const cuenta = params.get('cuenta');
  const nav = useNavigate();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');

  useEffect(()=>{
    if(!cuenta) return;
    
    cuentas.getCuenta(cuenta)
      .then(data => {
        // Adaptamos la respuesta del backend al formato que espera la vista
        setInfo({
            ...data,
            // Si el backend no devuelve nombre (solo idCliente), ponemos un fallback
            nombre: data.nombres || data.nombre || `Cliente ID: ${data.idCliente}`,
            balance: data.saldoDisponible // Mapeamos el campo DTO Java
        });
      })
      .catch((e) => {
        console.error(e);
        setErr('Error cargando cuenta o cuenta no encontrada');
      });
  }, [cuenta]);

  if(err) return <div className="screen error-container"><p className="error-text">{err}</p><button className="btn-secondary" onClick={()=>nav(-1)}>Volver</button></div>;
  if(!info) return <p className="screen loading">Cargando información...</p>;

  return (
    <>
      <div className="header">
        <div className="left">Inicio</div>
        <div className="right">
            <button className="btn-logout" onClick={()=>{localStorage.removeItem('cajero'); window.location.href='/'}}>
                Cerrar sesión
            </button>
        </div>
      </div>

      <div className="screen">
        <div className="card" style={{maxWidth:620, margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p className="small-muted">Titular</p>
              <h3>{info.nombre}</h3>
            </div>
            <div style={{textAlign:'right'}}>
              <p className="small-muted">N° Cuenta</p>
              <h3>{info.numeroCuenta}</h3>
            </div>
          </div>

          <div style={{display:'flex', gap:20, marginTop:12}}>
            <div>
              <p className="small-muted">Tipo</p>
              {/* Si idTipoCuenta es 1, mostramos Ahorros, sino lo que venga */}
              <p>{info.idTipoCuenta === 1 ? 'Ahorros' : 'Corriente'}</p>
            </div>
            <div>
              <p className="small-muted">Saldo Disponible</p>
              <p style={{fontWeight:700, fontSize: '1.2rem', color: '#2c3e50'}}>
                $ {Number(info.balance).toFixed(2)}
              </p>
            </div>
            <div>
                <p className="small-muted">Estado</p>
                <span className={`badge ${info.estado === 'ACTIVA' ? 'success' : 'danger'}`}>
                    {info.estado}
                </span>
            </div>
          </div>

          <div style={{display:'flex', gap:10, marginTop:24}}>
            <button className="btn-primary" onClick={()=>nav(`/valores?tipo=${tipo}&cuenta=${cuenta}`)}>
                Continuar
            </button>
            <button className="btn-secondary" onClick={()=>nav(-1)}>
                Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}