import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMovimientos, getTransferStatus } from '../services/bancaApi'
import { FiRefreshCw, FiArrowUpRight, FiArrowDownLeft, FiCalendar, FiDollarSign, FiSearch, FiRotateCcw, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import './Movimientos.css'

export default function Movimientos() {
  const { state, refreshAccounts } = useAuth()

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
      const resp = await getMovimientos(selectedAccId)
      await refreshAccounts()

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

        const desc = m.descripcion || '-';
        // Detectar si es una transacción que quedó pendiente/en validación
        const isPending = (m.estado === 'PENDIENTE') || desc.includes("validación") || desc.includes("proceso");

        // Prioridad de búsqueda de referencia para el Switch
        const refSwitch = m.referencia || m.ref || m.transactionId || m.referenciaRed || m.externalId;

        return {
          id: m.idTransaccion || `mv-${i}`,
          referencia: refSwitch,
          fecha: fechaStr,
          desc: desc,
          tipo: m.tipoOperacion,
          amount: m.monto,
          saldoResultante: m.saldoResultante,
          isDebit: isDebit,
          originalDate: m.fechaCreacion,
          estado: m.estado || 'COMPLETADA',
          isPending: isPending
        }
      })

      setTransactions(movsAll.sort((a, b) => b.id - a.id))
    } catch (e) {
      console.error('Error cargando movimientos:', e)
    } finally {
      setLoading(false)
    }
  }

  // --- Verificar Estado en Switch ---
  const handleCheckStatus = async (tx) => {
    // 1. Intentar obtener referencia válida
    let refToUse = tx.referencia;

    // Si no hay referencia, intentar extraerla de la descripción si tiene formato UUID
    if (!refToUse && tx.desc) {
      const match = tx.desc.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) refToUse = match[0];
    }

    if (!refToUse) {
      return alert("⚠️ No se encontró una referencia válida (UUID) de transacción.\n\nEs posible que la transacción interna no haya generado un ID de rastreo externo.");
    }

    const confirmMsg = window.confirm(`Consultando al Switch por:\n${refToUse}\n\n¿Desea verificar el estado final?`);
    if (!confirmMsg) return;

    setLoading(true);
    try {
      const status = await getTransferStatus(refToUse);
      console.log("Respuesta Switch:", status);

      const estadoSwitch = (status.estado || status.status || "").toUpperCase();
      const codigoSwitch = (status.codigo || "").toUpperCase();

      // Criterios de Éxito Ampliados
      const isSuccess = estadoSwitch === 'COMPLETED' || estadoSwitch === 'SUCCESS' || estadoSwitch === 'APROBADA' || codigoSwitch === 'AC00' || estadoSwitch === 'EXITOSA';

      // Criterios de Fallo
      const isFailed = estadoSwitch === 'FAILED' || estadoSwitch === 'REJECTED' || estadoSwitch === 'RECHAZADA' || estadoSwitch === 'FALLIDA';

      if (isSuccess) {
        alert("✅ ¡CONFIRMADO! Transacción EXITOSA.\n\nEl Switch ha validado que los fondos llegaron al destino correctamente.");

        // Actualización Optimista de la UI (Local) para feedback inmediato
        setTransactions(prev => prev.map(t => {
          if (t.id === tx.id) {
            return {
              ...t,
              estado: 'COMPLETADA',
              isPending: false,
              desc: t.desc.replace(/En proceso.*/, "") + " (Verificada)"
            };
          }
          return t;
        }));

        // Intentar sincronizar backend
        loadMovements();

      } else if (isFailed) {
        const motivo = status.mensaje || status.error || status.motivo || "Error no especificado";
        alert("❌ TRANSACCIÓN FALLIDA\n\nEl Switch indica fallo:\n" + motivo);
        loadMovements();

      } else {
        alert(`ℹ️ Estado Actual: ${estadoSwitch}\n\nEl Switch indica que la operación sigue en curso.`);
      }
    } catch (err) {
      console.error(err);
      let errMsg = err.message || "Error desconocido";
      if (errMsg.includes("Not Found") || errMsg.includes("404")) {
        errMsg = "La transacción no existe en el Switch (404).\nProbablemente nunca fue enviada o ya caducó.";
      }
      alert("Error consultando estado:\n" + errMsg);
    } finally {
      setLoading(false);
    }
  }

  const cuentaActual = state.user.accounts?.find(a => a.id == selectedAccId)

  // Helper moved to scope
  const getFriendlyDesc = (t) => {
    if (!t) return '';
    const desc = t.desc || '';
    if (desc.includes("ERROR TÉCNICO") || desc.includes("Switch Error")) {
      if (desc.includes("AC01")) return "Transacción Rechazada (Cuenta Inválida)";
      if (desc.includes("422")) return "Transacción Rechazada (Datos inválidos)";
      if (desc.includes("504") || desc.includes("timeout")) return "Transacción Fallida (Tiempo de espera agotado)";
      return "Transacción Fallida (Error Técnico)";
    }
    if (desc.includes("RECHAZADA")) return desc; // Already parsed by backend
    return desc;
  };

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
              {state.user.accounts?.map(a => (
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
          {loading && transactions.length === 0 ? (
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
            <div className="table-responsive">
              <table className="mov-table">
                <thead>
                  <tr>
                    <th>FECHA / HORA</th>
                    <th>CONCEPTO DE OPERACIÓN</th>
                    <th>TIPO</th>
                    <th style={{ textAlign: 'right' }}>MONTO</th>
                    <th style={{ textAlign: 'right' }}>BALANCE RESULTANTE</th>
                    <th style={{ textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => {
                    return (
                      <tr key={tx.id} className={`stagger-${(idx % 3) + 1}`}>
                        <td className="mov-date">{tx.fecha}</td>
                        <td className="mov-desc">
                          <div style={{ fontWeight: 500, color: '#e0e0e0' }}>{getFriendlyDesc(tx)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 3 }}>ID: {tx.id}</div>
                          {tx.isPending && <div style={{ fontSize: '0.75rem', color: 'orange', marginTop: 4 }}><FiAlertTriangle /> En proceso</div>}
                        </td>
                        <td>
                          <span className={`mov-type-badge ${tx.isDebit ? 'debit' : 'credit'}`}>
                            {tx.tipo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`mov-amount ${tx.isDebit ? 'debit' : 'credit'}`} style={{ textAlign: 'right' }}>
                          {tx.isDebit ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                        </td>
                        <td className="mov-saldo" style={{ textAlign: 'right' }}>
                          ${Number(tx.saldoResultante || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {tx.isPending && (
                            <button
                              className="btn-verify-sm"
                              onClick={() => handleCheckStatus(tx)}
                              title="Verificar estado"
                            >
                              <FiRefreshCw />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
        
        /* Verify Button Styles */
        .btn-verify-sm {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            color: #1976d2;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .btn-verify-sm:hover {
            background: #bbdefb;
            transform: scale(1.05);
        }
      `}</style>
    </div >
  )
}
