import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMovimientos } from '../services/bancaApi'
import { FiRefreshCw, FiArrowUpRight, FiArrowDownLeft, FiCalendar, FiDollarSign, FiSearch } from 'react-icons/fi'
import './Movimientos.css'

export default function Movimientos() {
  const { state, refreshAccounts } = useAuth()

  // Estado de cuenta seleccionada
  const [selectedAccId, setSelectedAccId] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Carga inicial
  useEffect(() => {
    if (state.user.accounts && state.user.accounts.length > 0 && !selectedAccId) {
      setSelectedAccId(state.user.accounts[0].id)
    }
  }, [state.user.accounts])

  // Cargar movimientos
  useEffect(() => {
    if (selectedAccId) {
      loadMovements()
    }
  }, [selectedAccId])

  const loadMovements = async () => {
    if (!selectedAccId) return
    setLoading(true)
    try {
      const [resp] = await Promise.all([
        getMovimientos(selectedAccId),
        refreshAccounts()
      ])

      const listaRaw = Array.isArray(resp) ? resp : []
      const movsAll = listaRaw.map((m, i) => {
        const isDebit = ['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_INTERNA'].includes(m.tipoOperacion)
          && m.idCuentaOrigen == selectedAccId

        let fechaStr = 'Sin fecha'
        if (m.fechaCreacion) {
          let dateStr = m.fechaCreacion
          if (!dateStr.endsWith('Z') && !dateStr.includes('+')) dateStr += 'Z'
          const fecha = new Date(dateStr)
          fechaStr = fecha.toLocaleString('es-EC', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
          })
        }

        return {
          id: m.idTransaccion || `mv-${i}`,
          fecha: fechaStr,
          desc: m.descripcion || '-',
          tipo: m.tipoOperacion,
          amount: m.monto,
          saldoResultante: m.saldoResultante,
          isDebit: isDebit
        }
      })

      setTransactions(movsAll.sort((a, b) => b.id - a.id))
    } catch (e) {
      console.error('Error cargando movimientos:', e)
    } finally {
      setLoading(false)
    }
  }

  const cuentaActual = state.user.accounts?.find(a => a.id == selectedAccId)

  return (
    <div className="mov-page">
      <div className="mov-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h2 className="mov-title text-gradient">Historial de Movimientos</h2>
          <button className="mov-refresh-btn" onClick={loadMovements} disabled={loading}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        <div className="mov-header">
          <div className="mov-account-selector">
            <label><FiSearch style={{ marginRight: 8 }} /> Seleccionar Cuenta</label>
            <select
              value={selectedAccId}
              onChange={e => setSelectedAccId(e.target.value)}
              className="mov-select"
            >
              {state.user.accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.type} — {a.number}
                </option>
              ))}
            </select>
          </div>

          {cuentaActual && (
            <div className="mov-balance-card">
              <span className="mov-balance-label">Saldo Disponible</span>
              <span className="mov-balance-amount">
                <span style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', marginRight: 8 }}>$</span>
                {Number(cuentaActual.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <div className="mov-list-container">
          {loading ? (
            <div className="mov-loading">
              <div className="loader" style={{ margin: '0 auto 20px' }}></div>
              Sincronizando transacciones...
            </div>
          ) : transactions.length === 0 ? (
            <div className="mov-empty">
              <span className="mov-empty-icon">📁</span>
              <p>No se encontraron movimientos registrados.</p>
            </div>
          ) : (
            <table className="mov-table">
              <thead>
                <tr>
                  <th><FiCalendar style={{ marginRight: 8 }} /> Fecha</th>
                  <th>Operación</th>
                  <th>Detalle</th>
                  <th><FiDollarSign style={{ marginRight: 8 }} /> Monto</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={tx.id} className={`stagger-${(idx % 3) + 1}`}>
                    <td className="mov-date">{tx.fecha}</td>
                    <td>
                      <span className={`mov-type-badge ${tx.isDebit ? 'debit' : 'credit'}`}>
                        {tx.isDebit ? <FiArrowUpRight style={{ marginRight: 6 }} /> : <FiArrowDownLeft style={{ marginRight: 6 }} />}
                        {tx.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="mov-desc">{tx.desc}</td>
                    <td className={`mov-amount ${tx.isDebit ? 'debit' : 'credit'}`}>
                      {tx.isDebit ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="mov-saldo">${Number(tx.saldoResultante || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
