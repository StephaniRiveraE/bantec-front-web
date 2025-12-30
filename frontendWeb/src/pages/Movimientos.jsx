import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMovimientos, getConsolidada } from '../services/bancaApi'
import './Movimientos.css'

export default function Movimientos() {
  const { state, setUserAccounts } = useAuth()

  // Estado de cuenta seleccionada (Guardamos el ID para el backend)
  const [selectedAccId, setSelectedAccId] = useState('')

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Carga inicial: Seleccionar la primera cuenta si existe
  useEffect(() => {
    if (state.user.accounts && state.user.accounts.length > 0 && !selectedAccId) {
      setSelectedAccId(state.user.accounts[0].id)
    }
  }, [state.user.accounts])

  // Cargar movimientos cuando cambia la cuenta
  useEffect(() => {
    if (selectedAccId) {
      loadMovements()
    }
  }, [selectedAccId])

  const loadMovements = async () => {
    if (!selectedAccId) return

    setLoading(true)
    try {
      // 1. Cargar movimientos y cuentas en paralelo para actualizar saldo
      const [resp, cuentasRaw] = await Promise.all([
        getMovimientos(selectedAccId),
        state.user.identificacion ? getConsolidada(state.user.identificacion) : Promise.resolve([])
      ])

      // 2. Si recibimos cuentas actualizadas, refrescamos el estado global (balance)
      if (cuentasRaw && cuentasRaw.length > 0) {
        const mapped = cuentasRaw.map(c => ({
          id: String(c.idCuenta),
          number: c.numeroCuenta,
          type: c.idTipoCuenta === 1 ? "Ahorros" : "Corriente",
          balance: Number(c.saldoDisponible || c.saldoActual || 0)
        }))
        setUserAccounts(mapped)
      }

      console.log('Movimientos recibidos:', resp)

      // Mapeo de respuesta DTO -> Vista
      const listaRaw = Array.isArray(resp) ? resp : []

      const movsAll = listaRaw.map((m, i) => {
        // Determinar si es débito (sale dinero) o crédito (entra dinero)
        const isDebit = ['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_INTERNA'].includes(m.tipoOperacion)
          && m.idCuentaOrigen == selectedAccId

        // Formatear fecha
        let fechaStr = 'Sin fecha'
        if (m.fechaCreacion) {
          // Asegurar que se trate como UTC si viene sin offset
          let dateStr = m.fechaCreacion
          if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr += 'Z'
          }
          const fecha = new Date(dateStr)
          fechaStr = fecha.toLocaleString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        }

        return {
          id: m.idTransaccion || `mv-${i}`,
          fecha: fechaStr,
          desc: m.descripcion || '-',
          tipo: m.tipoOperacion,
          amount: m.monto,
          saldoResultante: m.saldoResultante,
          isDebit: isDebit,
          referencia: m.referencia
        }
      })

      // Ordenar por ID descendente (más reciente primero)
      const sorted = movsAll.sort((a, b) => b.id - a.id)
      setTransactions(sorted)

    } catch (e) {
      console.error('Error cargando movimientos:', e)
    } finally {
      setLoading(false)
    }
  }

  // Obtener la cuenta seleccionada para mostrar info
  const cuentaActual = state.user.accounts?.find(a => a.id == selectedAccId)

  return (
    <div className="mov-page">
      <div className="mov-container">
        <h2 className="mov-title">Historial de Movimientos</h2>

        <div className="mov-header">
          <div className="mov-account-selector">
            <label>Cuenta</label>
            <select
              value={selectedAccId}
              onChange={e => setSelectedAccId(e.target.value)}
              className="mov-select"
            >
              {state.user.accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.type} - {a.number}
                </option>
              ))}
            </select>
          </div>

          {cuentaActual && (
            <div className="mov-balance-card">
              <span className="mov-balance-label">Saldo Disponible</span>
              <span className="mov-balance-amount">${cuentaActual.balance?.toFixed(2) || '0.00'}</span>
            </div>
          )}

          <button className="mov-refresh-btn" onClick={loadMovements} disabled={loading}>
            {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
          </button>
        </div>

        <div className="mov-list-container">
          {loading && (
            <div className="mov-loading">Cargando movimientos...</div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="mov-empty">
              <span className="mov-empty-icon">📋</span>
              <p>No hay movimientos registrados para esta cuenta.</p>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <table className="mov-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="mov-date">{tx.fecha}</td>
                    <td>
                      <span className={`mov-type-badge ${tx.isDebit ? 'debit' : 'credit'}`}>
                        {tx.tipo}
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
    </div>
  )
}