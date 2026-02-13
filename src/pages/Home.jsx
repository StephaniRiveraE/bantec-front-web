import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { FaWallet, FaArrowRight, FaCreditCard, FaRegUserCircle } from 'react-icons/fa'

export default function Home() {
  const { state, refreshAccounts } = useAuth()

  useEffect(() => {
    const loadAccounts = async () => {
      const id = state.user && state.user.identificacion
      if (!id) return
      try {
        await refreshAccounts()
      } catch (e) {
        console.error('❌ Error cargando cuentas:', e.message)
      }
    }

    if (state.user) {
      loadAccounts()
    }
  }, [state.user?.identificacion])

  const accounts = state.user?.accounts || [];
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  return (
    <div className="home-dashboard">
      <div className="header-inline">
        <div>
          <h1 className="text-gradient">Resumen de Cuentas</h1>
          <p className="small" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Bienvenido de vuelta, {state.user?.name || "Usuario"}
          </p>
        </div>
        <div className="profile-badge">
          <FaRegUserCircle style={{ fontSize: 32, color: 'var(--accent-primary)' }} />
        </div>
      </div>

      {/* Tarjeta de Saldo Total Consolidado */}
      <div className="card total-card" style={{
        marginTop: 32,
        padding: '30px',
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div className="small" style={{ color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Saldo Total Consolidado
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent-gold)', fontSize: 24 }}>$</span>
            {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <button
          onClick={refreshAccounts}
          className="btn-logout"
          style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: 18 }}>🔄</span> Actualizar
        </button>
      </div>

      <div className="accounts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        marginTop: 24
      }}>
        {accounts.length > 0 ? (
          accounts.map((a, idx) => (
            <div className={`card account-card stagger-${(idx % 3) + 1}`} key={a.id} style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="card-accent" style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: 'var(--accent-primary)'
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="small" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                    {a.type === 'AHORROS' || a.type === 'Ahorros' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'}
                  </div>
                  <h3 style={{ fontSize: 16, opacity: 0.8 }}>N°. {a.number}</h3>
                </div>
                <div style={{
                  background: 'rgba(0, 229, 255, 0.1)', padding: 10, borderRadius: 12,
                  color: 'var(--accent-primary)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
                }}>
                  {a.type === 'AHORROS' || a.type === 'Ahorros' ? <FaWallet /> : <FaCreditCard />}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="small" style={{ color: 'var(--text-muted)' }}>Saldo Disponible</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  <span style={{ fontSize: 18, marginRight: 4, verticalAlign: 'middle', opacity: 0.7 }}>$</span>
                  {(Number(a.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ marginTop: 24, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
                <Link to={`/movimientos?cuenta=${a.number}`} className="nav-link-modern" style={{
                  display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                  color: 'var(--accent-gold)', fontSize: 14, fontWeight: 700
                }}>
                  Ver detalles de actividad <FaArrowRight style={{ fontSize: 12 }} />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Sincronizando tus cuentas...</p>
            <div className="loader" style={{ marginTop: 16 }}></div>
          </div>
        )}
      </div>

      <div className="quick-actions" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Acceso Rápido</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/transferir" className="btn" style={{ textDecoration: 'none' }}>Transferencia Directa</Link>
          <Link to="/interbancarias" className="btn ghost" style={{ textDecoration: 'none' }}>Pagos Interbancarios</Link>
        </div>
      </div>
    </div >
  )
}
