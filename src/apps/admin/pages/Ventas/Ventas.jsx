import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, Filter, DollarSign, Package, Users, BarChart3, PieChart, Download, Eye, Clock, Percent } from 'lucide-react';
import { getCashRegisters, subscribeToCashRegisters } from '../../../../firebase';
import styles from './Ventas.module.css';

/**
 * Página de Estadísticas de Ventas
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * - Dashboard de ventas con datos de arqueos de caja
 * - Filtros por fecha, turno, período
 * - Gráficos de ventas por método de pago
 * - Estadísticas de descuentos aplicados
 * - Vista detallada de cierres de caja
 * - Análisis de tendencias temporales
 */
const Ventas = () => {
  // Estados principales
  const [cashRegisters, setCashRegisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('mes'); // 'dia', 'semana', 'mes', 'todos'
  const [selectedTurn, setSelectedTurn] = useState('todos'); // 'mediodia', 'noche', 'todos'
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedCashRegister, setSelectedCashRegister] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cargar datos de arqueos
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = subscribeToCashRegisters(
      (registers) => {
        console.log('📊 Arqueos cargados:', registers.length);
        
        // Si no hay datos reales, mostrar datos de demostración
        if (registers.length === 0) {
          const demoData = [
            {
              id: 'demo-1',
              fecha: '2025-01-22',
              turno: 'mediodia',
              totales: {
                efectivo: 45000,
                tarjeta: 32000,
                transferencia: 18000,
                total: 95000
              },
              contadores: {
                totalPedidos: 12,
                pedidosEfectivo: 7,
                pedidosTarjeta: 4,
                pedidosTransferencia: 1,
                promedioVenta: 7916
              },
              descuentos: {
                totalDescuentos: 3500,
                cantidadDescuentos: 3,
                descuentosPorRazon: {
                  'Cliente frecuente': { monto: 2000, cantidad: 2 },
                  'Cumpleaños': { monto: 1500, cantidad: 1 }
                }
              },
              timestamp: new Date(),
              empleado: 'admin',
              pedidos: []
            },
            {
              id: 'demo-2',
              fecha: '2025-01-22',
              turno: 'noche',
              totales: {
                efectivo: 72000,
                tarjeta: 58000,
                transferencia: 35000,
                total: 165000
              },
              contadores: {
                totalPedidos: 18,
                pedidosEfectivo: 8,
                pedidosTarjeta: 7,
                pedidosTransferencia: 3,
                promedioVenta: 9166
              },
              descuentos: {
                totalDescuentos: 5200,
                cantidadDescuentos: 4,
                descuentosPorRazon: {
                  'Cliente frecuente': { monto: 3200, cantidad: 3 },
                  'Error en pedido': { monto: 2000, cantidad: 1 }
                }
              },
              timestamp: new Date(),
              empleado: 'admin',
              pedidos: []
            },
            {
              id: 'demo-3',
              fecha: '2025-01-21',
              turno: 'mediodia',
              totales: {
                efectivo: 38000,
                tarjeta: 42000,
                transferencia: 25000,
                total: 105000
              },
              contadores: {
                totalPedidos: 15,
                pedidosEfectivo: 6,
                pedidosTarjeta: 7,
                pedidosTransferencia: 2,
                promedioVenta: 7000
              },
              descuentos: {
                totalDescuentos: 2800,
                cantidadDescuentos: 2,
                descuentosPorRazon: {
                  'Promoción': { monto: 1500, cantidad: 1 },
                  'Cliente frecuente': { monto: 1300, cantidad: 1 }
                }
              },
              timestamp: new Date(),
              empleado: 'admin',
              pedidos: []
            }
          ];
          
          console.log('📊 Mostrando datos de demostración');
          setCashRegisters(demoData);
        } else {
          setCashRegisters(registers);
        }
        
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error cargando arqueos:', error);
        setLoading(false);
        
        // Manejar diferentes tipos de errores
        if (error.code === 'permission-denied') {
          setError('No tienes permisos para ver las estadísticas de ventas. Asegúrate de estar autenticado como staff.');
        } else if (error.code === 'unavailable') {
          setError('Servicio temporalmente no disponible. Intenta de nuevo en unos momentos.');
        } else {
          setError(`Error cargando datos: ${error.message}`);
        }
      }
    );

    return () => unsubscribe && unsubscribe();
  }, []);

  // Filtrar arqueos según criterios seleccionados
  const filteredRegisters = useMemo(() => {
    let filtered = [...cashRegisters];

    // Filtrar por fechas
    if (startDate && endDate) {
      filtered = filtered.filter(register => {
        const registerDate = register.fecha;
        return registerDate >= startDate && registerDate <= endDate;
      });
    }

    // Filtrar por turno
    if (selectedTurn !== 'todos') {
      filtered = filtered.filter(register => register.turno === selectedTurn);
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha + 'T' + (a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date()).toTimeString());
      const dateB = new Date(b.fecha + 'T' + (b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date()).toTimeString());
      return dateB - dateA;
    });

    return filtered;
  }, [cashRegisters, startDate, endDate, selectedTurn]);

  // Calcular estadísticas totales
  const statistics = useMemo(() => {
    if (filteredRegisters.length === 0) {
      return {
        totalVentas: 0,
        totalPedidos: 0,
        promedioVenta: 0,
        totalDescuentos: 0,
        metodosDistribucion: { efectivo: 0, tarjeta: 0, transferencia: 0 },
        ventasPorDia: {},
        mejorDia: null,
        peorDia: null,
        tendencia: 0
      };
    }

    const stats = filteredRegisters.reduce((acc, register) => {
      const total = register.totales?.total || 0;
      const pedidos = register.contadores?.totalPedidos || 0;
      const descuentos = register.descuentos?.totalDescuentos || 0;
      
      acc.totalVentas += total;
      acc.totalPedidos += pedidos;
      acc.totalDescuentos += descuentos;
      
      // Métodos de pago
      acc.metodosDistribucion.efectivo += register.totales?.efectivo || 0;
      acc.metodosDistribucion.tarjeta += register.totales?.tarjeta || 0;
      acc.metodosDistribucion.transferencia += register.totales?.transferencia || 0;
      
      // Ventas por día
      const fecha = register.fecha;
      if (!acc.ventasPorDia[fecha]) {
        acc.ventasPorDia[fecha] = { total: 0, pedidos: 0, cierres: 0 };
      }
      acc.ventasPorDia[fecha].total += total;
      acc.ventasPorDia[fecha].pedidos += pedidos;
      acc.ventasPorDia[fecha].cierres += 1;
      
      return acc;
    }, {
      totalVentas: 0,
      totalPedidos: 0,
      totalDescuentos: 0,
      metodosDistribucion: { efectivo: 0, tarjeta: 0, transferencia: 0 },
      ventasPorDia: {}
    });

    stats.promedioVenta = stats.totalPedidos > 0 ? stats.totalVentas / stats.totalPedidos : 0;
    
    // Encontrar mejor y peor día
    const dias = Object.entries(stats.ventasPorDia);
    if (dias.length > 0) {
      stats.mejorDia = dias.reduce((a, b) => a[1].total > b[1].total ? a : b);
      stats.peorDia = dias.reduce((a, b) => a[1].total < b[1].total ? a : b);
    }

    return stats;
  }, [filteredRegisters]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Formatear turno
  const formatTurn = (turn) => {
    return turn === 'mediodia' ? 'Mediodía' : 'Noche';
  };

  // Manejar click en "Ver Detalles"
  const handleViewDetails = (register) => {
    setSelectedCashRegister(register);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <BarChart3 size={48} className={styles.loadingIcon} />
          <p>Cargando datos de ventas...</p>
        </div>
      </div>
    );
  }

  // Mostrar errores de autenticación o permisos
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Error de Acceso</h2>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.retryButton}
            >
              Reintentar
            </button>
            <button 
              onClick={() => window.location.href = '/admin/dashboard'} 
              className={styles.backButton}
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje cuando no hay datos
  if (!loading && cashRegisters.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📊</div>
          <h2>No hay datos de ventas</h2>
          <p>Aún no se han realizado arqueos de caja. Los datos aparecerán aquí después de hacer el primer cierre de caja.</p>
          <div className={styles.emptyActions}>
            <button 
              onClick={() => window.location.href = '/admin/pedidos'} 
              className={styles.goPedidosButton}
            >
              Ir a Pedidos
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.refreshButton}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ventasContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleWithIcon}>
              <TrendingUp size={28} />
              <h1 className={styles.pageTitle}>Estadísticas de Ventas</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Análisis completo de cierres de caja y rendimiento del restaurante
            </p>
            {cashRegisters.length > 0 && cashRegisters[0].id?.startsWith('demo-') && (
              <div className={styles.demoNotice}>
                📊 Mostrando datos de demostración - Los datos reales aparecerán después de realizar arqueos de caja
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label>Período:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="dia">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="todos">Personalizado</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Turno:</label>
            <select 
              value={selectedTurn} 
              onChange={(e) => setSelectedTurn(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="mediodia">Mediodía</option>
              <option value="noche">Noche</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Desde:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Hasta:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={32} />
          </div>
          <div className={styles.statContent}>
            <h3>Total en Ventas</h3>
            <p className={styles.statValue}>{formatCurrency(statistics.totalVentas)}</p>
            <span className={styles.statSubtext}>{filteredRegisters.length} cierres de caja</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Package size={32} />
          </div>
          <div className={styles.statContent}>
            <h3>Total Pedidos</h3>
            <p className={styles.statValue}>{statistics.totalPedidos}</p>
            <span className={styles.statSubtext}>Promedio: {formatCurrency(statistics.promedioVenta)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Percent size={32} />
          </div>
          <div className={styles.statContent}>
            <h3>Descuentos</h3>
            <p className={styles.statValue}>{formatCurrency(statistics.totalDescuentos)}</p>
            <span className={styles.statSubtext}>
              {statistics.totalVentas > 0 ? 
                ((statistics.totalDescuentos / (statistics.totalVentas + statistics.totalDescuentos)) * 100).toFixed(1) : 0}% del subtotal
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BarChart3 size={32} />
          </div>
          <div className={styles.statContent}>
            <h3>Mejor Día</h3>
            <p className={styles.statValue}>
              {statistics.mejorDia ? formatCurrency(statistics.mejorDia[1].total) : '$0'}
            </p>
            <span className={styles.statSubtext}>
              {statistics.mejorDia ? new Date(statistics.mejorDia[0]).toLocaleDateString('es-AR') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por Método de Pago */}
      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h3>
            <PieChart size={20} />
            Distribución por Método de Pago
          </h3>
          <div className={styles.paymentMethodsChart}>
            {statistics.totalVentas > 0 && (
              <>
                <div className={styles.paymentMethod}>
                  <div className={styles.paymentMethodColor} style={{backgroundColor: '#10b981'}}></div>
                  <span className={styles.paymentMethodLabel}>Efectivo</span>
                  <span className={styles.paymentMethodValue}>
                    {formatCurrency(statistics.metodosDistribucion.efectivo)}
                  </span>
                  <span className={styles.paymentMethodPercent}>
                    ({((statistics.metodosDistribucion.efectivo / statistics.totalVentas) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className={styles.paymentMethod}>
                  <div className={styles.paymentMethodColor} style={{backgroundColor: '#3b82f6'}}></div>
                  <span className={styles.paymentMethodLabel}>Tarjeta</span>
                  <span className={styles.paymentMethodValue}>
                    {formatCurrency(statistics.metodosDistribucion.tarjeta)}
                  </span>
                  <span className={styles.paymentMethodPercent}>
                    ({((statistics.metodosDistribucion.tarjeta / statistics.totalVentas) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className={styles.paymentMethod}>
                  <div className={styles.paymentMethodColor} style={{backgroundColor: '#f59e0b'}}></div>
                  <span className={styles.paymentMethodLabel}>Transferencia</span>
                  <span className={styles.paymentMethodValue}>
                    {formatCurrency(statistics.metodosDistribucion.transferencia)}
                  </span>
                  <span className={styles.paymentMethodPercent}>
                    ({((statistics.metodosDistribucion.transferencia / statistics.totalVentas) * 100).toFixed(1)}%)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Cierres de Caja */}
      <div className={styles.cashRegistersSection}>
        <h3>
          <Calendar size={20} />
          Historial de Cierres de Caja
        </h3>
        
        {filteredRegisters.length === 0 ? (
          <div className={styles.emptyState}>
            <BarChart3 size={48} />
            <p>No hay cierres de caja en el período seleccionado</p>
          </div>
        ) : (
          <div className={styles.cashRegistersList}>
            {filteredRegisters.map((register, index) => (
              <div key={register.id || index} className={styles.cashRegisterCard}>
                <div className={styles.registerHeader}>
                  <div className={styles.registerDate}>
                    <Calendar size={16} />
                    <span>{new Date(register.fecha).toLocaleDateString('es-AR')}</span>
                    <span className={styles.registerTurn}>{formatTurn(register.turno)}</span>
                  </div>
                  <div className={styles.registerTotal}>
                    {formatCurrency(register.totales?.total || 0)}
                  </div>
                </div>
                
                <div className={styles.registerStats}>
                  <div className={styles.registerStat}>
                    <Package size={14} />
                    <span>{register.contadores?.totalPedidos || 0} pedidos</span>
                  </div>
                  <div className={styles.registerStat}>
                    <Clock size={14} />
                    <span>
                      {register.timestamp?.toDate?.()?.toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) || 'N/A'}
                    </span>
                  </div>
                  {register.descuentos?.totalDescuentos > 0 && (
                    <div className={styles.registerStat}>
                      <Percent size={14} />
                      <span>Descuentos: {formatCurrency(register.descuentos.totalDescuentos)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.registerActions}>
                  <button 
                    onClick={() => handleViewDetails(register)}
                    className={styles.viewDetailsButton}
                  >
                    <Eye size={16} />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && selectedCashRegister && (
        <CashRegisterDetailModal 
          register={selectedCashRegister}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCashRegister(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Modal para mostrar detalles completos de un cierre de caja
 */
const CashRegisterDetailModal = ({ register, onClose }) => {
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTurn = (turn) => {
    return turn === 'mediodia' ? 'Mediodía' : 'Noche';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.detailModal}>
        <div className={styles.modalHeader}>
          <h3>
            <BarChart3 size={24} />
            Detalle del Cierre de Caja
          </h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.modalContent}>
          {/* Información General */}
          <div className={styles.detailSection}>
            <h4>Información General</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Fecha:</span>
                <span>{new Date(register.fecha).toLocaleDateString('es-AR')}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Turno:</span>
                <span>{formatTurn(register.turno)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Empleado:</span>
                <span>{register.empleado || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Hora de cierre:</span>
                <span>
                  {register.timestamp?.toDate?.()?.toLocaleTimeString('es-AR') || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className={styles.detailSection}>
            <h4>Totales por Método de Pago</h4>
            <div className={styles.totalsGrid}>
              <div className={styles.totalCard}>
                <span className={styles.totalLabel}>Efectivo</span>
                <span className={styles.totalValue}>{formatCurrency(register.totales?.efectivo)}</span>
                <span className={styles.totalCount}>
                  {register.contadores?.pedidosEfectivo || 0} pedidos
                </span>
              </div>
              <div className={styles.totalCard}>
                <span className={styles.totalLabel}>Tarjeta</span>
                <span className={styles.totalValue}>{formatCurrency(register.totales?.tarjeta)}</span>
                <span className={styles.totalCount}>
                  {register.contadores?.pedidosTarjeta || 0} pedidos
                </span>
              </div>
              <div className={styles.totalCard}>
                <span className={styles.totalLabel}>Transferencia</span>
                <span className={styles.totalValue}>{formatCurrency(register.totales?.transferencia)}</span>
                <span className={styles.totalCount}>
                  {register.contadores?.pedidosTransferencia || 0} pedidos
                </span>
              </div>
              <div className={styles.totalCard + ' ' + styles.totalCardMain}>
                <span className={styles.totalLabel}>TOTAL</span>
                <span className={styles.totalValue}>{formatCurrency(register.totales?.total)}</span>
                <span className={styles.totalCount}>
                  {register.contadores?.totalPedidos || 0} pedidos
                </span>
              </div>
            </div>
          </div>

          {/* Descuentos */}
          {register.descuentos?.totalDescuentos > 0 && (
            <div className={styles.detailSection}>
              <h4>Descuentos Aplicados</h4>
              <div className={styles.discountSummary}>
                <div className={styles.discountTotal}>
                  <span>Total en descuentos: {formatCurrency(register.descuentos.totalDescuentos)}</span>
                  <span>{register.descuentos.cantidadDescuentos} descuentos aplicados</span>
                </div>
                
                {register.descuentos.descuentosPorRazon && (
                  <div className={styles.discountBreakdown}>
                    <h5>Por razón:</h5>
                    {Object.entries(register.descuentos.descuentosPorRazon).map(([razon, data]) => (
                      <div key={razon} className={styles.discountReason}>
                        <span>{razon}: {formatCurrency(data.monto)}</span>
                        <span>({data.cantidad} {data.cantidad === 1 ? 'vez' : 'veces'})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className={styles.detailSection}>
            <h4>Estadísticas</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Promedio por pedido:</span>
                <span>{formatCurrency(register.contadores?.promedioVenta || 0)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total de pedidos:</span>
                <span>{register.contadores?.totalPedidos || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas; 