import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMovimientos, solicitarReverso, getTransferStatus } from '../services/bancaApi' // Importar getTransferStatus
import { FiRefreshCw, FiArrowUpRight, FiArrowDownLeft, FiCalendar, FiDollarSign, FiSearch, FiRotateCcw, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import './Movimientos.css'

export default function Movimientos() {
  const { state, refreshAccounts } = useAuth()

  const [selectedAccId, setSelectedAccId] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Estado para Modal de Reverso
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundTx, setRefundTx] = useState(null)
  const [refundReason, setRefundReason] = useState('FRAD')
  const [refundObs, setRefundObs] = useState('')
  const [processingRefund, setProcessingRefund] = useState(false)
  const [refundResult, setRefundResult] = useState(null) // { success: boolean, msg: string }

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

        const desc = m.descripcion || '-';
        // Detectar si es una transacción que quedó pendiente/en validación
        const isPending = (m.estado === 'PENDIENTE') || desc.includes("validación") || desc.includes("proceso");

        return {
          id: m.idTransaccion || `mv-${i}`,
          referencia: m.referencia || m.ref || m.transactionId, // Referencia para consultar Switch
          fecha: fechaStr,
          desc: desc,
          tipo: m.tipoOperacion,
          amount: m.monto,
          saldoResultante: m.saldoResultante,
          isDebit: isDebit,
          originalDate: m.fechaCreacion, // Guardar fecha original para validación
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
    if (!tx.referencia) return alert("No se encontró referencia para consultar al Switch.");

    const confirmMsg = window.confirm("¿Desea consultar el estado actual de esta transferencia en el Switch?");
    if (!confirmMsg) return;

    setLoading(true);
    try {
      const status = await getTransferStatus(tx.referencia);
      console.log("Estado Switch:", status);

      if (status.estado === 'COMPLETED' || status.status === 'COMPLETED') {
        alert("✅ TRANSACCIÓN COMPLETADA\n\nEl Switch ha confirmado el éxito de la operación.");
        // Aquí idealmente llamaríamos al backend para actualizar el estado, 
        // pero por ahora recargamos para ver si el backend ya se sincronizó (polling interno)
        loadMovements();
      } else if (status.estado === 'FAILED' || status.status === 'FAILED') {
        alert("❌ TRANSACCIÓN FALLIDA\n\nMotivo: " + (status.mensaje || status.error || "Desconocido"));
        loadMovements();
      } else {
        alert("⚠️ ESTADO: " + (status.estado || status.status) + "\n\nLa operación sigue en proceso.");
      }
    } catch (err) {
      alert("Error consultando: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Lógica de Reverso ---
  const handleOpenRefund = (tx) => {
    setRefundTx(tx)
    setRefundReason('FRAD')
    setRefundObs('')
    setRefundResult(null)
    setShowRefundModal(true)
  }

  const handleConfirmRefund = async () => {
    if (!refundTx) return
    setProcessingRefund(true)
    setRefundResult(null)

    try {
      await solicitarReverso({
        idTransaccion: refundTx.id, // ID original
        motivo: refundReason,
        observacion: refundObs
      })

      setRefundResult({ success: true, msg: 'Solicitud de reverso enviada exitosamente.' })
      // Recargar movimientos para ver si cambió algo (opcional, dependiendo de si es síncrono)
      setTimeout(() => {
        loadMovements()
        setShowRefundModal(false)
      }, 2000)

    } catch (error) {
      console.error('Error reverso:', error)
      setRefundResult({ success: false, msg: error.message || 'Error al procesar la solicitud.' })
    } finally {
      setProcessingRefund(false)
    }
  }

  // Helper para verificar 24h
  const canRefund = (tx) => {
    if (!tx.isDebit) return false
    if (tx.isPending) return false; // No reversar si está pendiente
    // Permitir reversar incluso si falló para pruebas, o solo completadas
    // if (tx.estado !== 'COMPLETADA' && tx.estado !== 'EXITOSA') return false 
    if (!tx.originalDate) return false

    const txDate = new Date(tx.originalDate) // Asegurar formato ISO o parseable
    const now = new Date()
    const diffMs = now - txDate
    const diffHours = diffMs / (1000 * 60 * 60)

    return diffHours < 24
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
                    // Helper simple para limpiar descripción
                    const getFriendlyDesc = (t) => {
                      if (t.desc.includes("ERROR TÉCNICO") || t.desc.includes("Switch Error")) {
                        if (t.desc.includes("AC01")) return "Transacción Rechazada (Cuenta Inválida)";
                        if (t.desc.includes("422")) return "Transacción Rechazada (Datos inválidos)";
                        if (t.desc.includes("504") || t.desc.includes("timeout")) return "Transacción Fallida (Tiempo de espera agotado)";
                        return "Transacción Fallida (Error Técnico)";
                      }
                      if (t.desc.includes("RECHAZADA")) return "Transacción Rechazada";
                      return t.desc;
                    };

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
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            {tx.isPending && (
                              <button
                                className="btn-verify-sm"
                                onClick={() => handleCheckStatus(tx)}
                                title="Verificar estado"
                              >
                                <FiRefreshCw />
                              </button>
                            )}

                            {canRefund(tx) && (
                              <button
                                className="btn-refund-sm"
                                onClick={() => handleOpenRefund(tx)}
                                title="Solicitar Devolución"
                              >
                                Solicitar Devolución
                              </button>
                            )}
                          </div>
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

      {/* MODAL DE REVERSO */}
      {showRefundModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Solicitud de Reverso</h3>

            {refundResult ? (
              <div className={`refund-alert ${refundResult.success ? 'success' : 'error'}`}>
                {refundResult.success ? '✅' : '❌'} {refundResult.msg}
              </div>
            ) : (
              <>
                <div className="refund-summary">
                  <p><strong>Transacción:</strong> {refundTx?.id}</p>
                  <p><strong>Monto:</strong> ${Number(refundTx?.amount).toFixed(2)}</p>
                  <p><strong>Beneficiario:</strong> {refundTx?.desc}</p>
                </div>

                <div className="form-group-refund">
                  <label>Motivo de la devolución <span className="req">*</span></label>
                  <select
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    className="refund-select"
                  >
                    <option value="FRAD">🚨 Fraude / No Autorizado (FRAD)</option>
                    <option value="DUPL">👯‍♀️ Pago Duplicado (DUPL)</option>
                    <option value="TECH">🔁 Error Técnico (TECH)</option>
                    <option value="AM09">Monto Incorrecto (AM09)</option>
                  </select>
                </div>

                <div className="form-group-refund">
                  <label>Observación (Interna)</label>
                  <textarea
                    rows="2"
                    value={refundObs}
                    onChange={e => setRefundObs(e.target.value)}
                    placeholder="Detalles adicionales..."
                    className="refund-textarea"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowRefundModal(false)}
                    disabled={processingRefund}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-confirm-refund"
                    onClick={handleConfirmRefund}
                    disabled={processingRefund}
                  >
                    {processingRefund ? 'Enviando...' : 'Confirmar y Enviar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        /* Refund Button Styles */
        .btn-refund-sm {
          background: #ffebee;
          border: 1px solid #ffcdd2;
          color: #c62828;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .btn-refund-sm:hover {
          background: #ffcdd2;
          transform: scale(1.05);
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .modal-content {
          background: white;
          padding: 25px;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-title {
          margin: 0 0 20px;
          color: #333;
          font-size: 1.3rem;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 10px;
        }
        .refund-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e0e0e0;
        }
        .refund-summary p {
          margin: 5px 0;
          font-size: 0.95rem;
          color: #555;
        }
        .form-group-refund {
          margin-bottom: 15px;
        }
        .form-group-refund label {
          display: block;
          margin-bottom: 6px;
          color: #666;
          font-weight: 500;
          font-size: 0.9rem;
        }
        .refund-select, .refund-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          color: #333; /* Color negro explícito para textos */
        }
        .refund-textarea { resize: vertical; }
        .req { color: red; }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 25px;
        }
        .btn-cancel {
          background: #f5f5f5;
          border: 1px solid #ddd;
          color: #666;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-confirm-refund {
          background: #d32f2f;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-confirm-refund:hover { background: #b71c1c; }
        .btn-confirm-refund:disabled { opacity: 0.7; cursor: not-allowed; }

        .refund-alert {
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          font-weight: 500;
        }
        .refund-alert.success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .refund-alert.error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
      `}</style>
    </div>
  )
}
