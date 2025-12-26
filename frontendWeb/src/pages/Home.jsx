import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { getConsolidada } from '../services/bancaApi'

export default function Home(){
  const { state, setUserAccounts } = useAuth()
  
  useEffect(() => {
    const loadAccounts = async () => {
      // Usamos la identificación (cédula) guardada en el login
      const id = state.user && state.user.identificacion
      console.log('🔍 Home - Identificacion del usuario:', id)
      
      if (!id) {
        console.warn('⚠️ No hay identificación, no se cargan cuentas')
        return
      }
      
      try {
        console.log('📡 Llamando a getConsolidada con:', id)
        const cuentasRaw = await getConsolidada(id)
        console.log('✅ Cuentas crudas recibidas:', cuentasRaw)
        
        // Mapeo de DTO Backend -> Estado Frontend
        const mapped = (cuentasRaw || []).map(c => ({ 
          id: String(c.idCuenta), 
          number: c.numeroCuenta, 
          // Mapeo simple de tipo. Si tienes un endpoint de tipos, mejor.
          type: c.idTipoCuenta === 1 ? "Ahorros" : "Corriente", 
          balance: Number(c.saldoDisponible || c.saldoActual || 0) 
        }))
        
        console.log('✅ Cuentas mapeadas para UI:', mapped)
        setUserAccounts(mapped)
      } catch (e) {
        console.error('❌ Error cargando cuentas:', e.message)
      }
    }
    
    if(state.user) {
        loadAccounts()
    }
  }, [state.user?.identificacion]) // Dependencia segura

  return (
    <div>
      <div className="header-inline">
        <h1>Inicio</h1>
        <div className="small">Bienvenido, {state.user?.name || "Usuario"}</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12}}>
        {state.user?.accounts?.length > 0 ? (
            state.user.accounts.map(a => (
              <div className="card" key={a.id}>
                <div className="small">{a.type} | N°. {a.number}</div>
                <div style={{fontSize:20,fontWeight:700}}>${a.balance.toFixed(2)}</div>
                <div style={{marginTop:8}}>
                  <Link to={`/movimientos?cuenta=${a.number}`} className="small">Ver movimientos</Link>
                </div>
              </div>
            ))
        ) : (
            <p>No tienes cuentas activas o está cargando...</p>
        )}
      </div>
    </div>
  )
}