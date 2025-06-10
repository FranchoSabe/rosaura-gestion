import React from 'react';
import { Printer, Download } from 'lucide-react';
import styles from './TableMap.module.css';

// Configuración del mapa de mesas - Layout real de Rosaura
const TABLES_LAYOUT = [
  // Zona superior (alineadas verticalmente - horizontales para 4 personas)
  { id: 12, x: 50, y: 50, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  { id: 13, x: 150, y: 50, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  
  // Zona superior-media (mesas modulares cuadradas para 2 personas)
  { id: 21, x: 60, y: 130, width: 50, height: 50, capacity: 2 }, // cuadrada
  { id: 11, x: 60, y: 200, width: 50, height: 50, capacity: 2 }, // cuadrada
  { id: 24, x: 160, y: 130, width: 50, height: 50, capacity: 2 }, // cuadrada
  { id: 14, x: 220, y: 130, width: 50, height: 50, capacity: 2 }, // cuadrada (a la derecha de 24)
  
  // Zona central (después de la división principal)
  // Columna izquierda: 10, 9, 8 alineadas verticalmente (horizontales)
  { id: 10, x: 50, y: 310, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  { id: 9, x: 50, y: 380, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  { id: 8, x: 50, y: 450, width: 50, height: 50, capacity: 2 }, // cuadrada
  
     // Columna central: 6 vertical y 7 vertical (alineadas con mesa 1)
   { id: 6, x: 150, y: 310, width: 50, height: 80, capacity: 4 }, // rectangular vertical
   { id: 7, x: 150, y: 400, width: 60, height: 90, capacity: 6 }, // rectangular vertical más grande
   
   // Columna derecha: 5, 4, 3 alineadas verticalmente (verticales para 4 personas)
   { id: 5, x: 260, y: 310, width: 50, height: 80, capacity: 4 }, // rectangular vertical
   { id: 4, x: 260, y: 400, width: 50, height: 80, capacity: 4 }, // rectangular vertical
   { id: 3, x: 260, y: 490, width: 50, height: 80, capacity: 4 }, // rectangular vertical
   
   // Zona inferior (alineadas horizontalmente y mesa 1 alineada verticalmente con 6 y 7)
   { id: 1, x: 150, y: 520, width: 50, height: 50, capacity: 2 }, // cuadrada (alineada con 6 y 7)
   { id: 31, x: 210, y: 520, width: 50, height: 50, capacity: 2 }, // cuadrada
   { id: 2, x: 270, y: 520, width: 50, height: 50, capacity: 2 }, // cuadrada (alineada horizontalmente)
];

const TableMap = ({ reservations = [], formatDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.fecha === today);

  // Función para imprimir/exportar
  const handlePrint = () => {
    window.print();
  };

  // Función para exportar como imagen (funcionalidad básica)
  const handleExport = () => {
    // Esta funcionalidad se puede expandir para generar PDFs
    alert('Funcionalidad de exportación - usar Ctrl+P para imprimir');
  };

  // Organizar reservas por turno
  const organizarReservasPorTurno = (reservations) => {
    const mediodia = reservations.filter(r => r.turno === 'mediodia').sort((a, b) => a.horario.localeCompare(b.horario));
    const noche = reservations.filter(r => r.turno === 'noche').sort((a, b) => a.horario.localeCompare(b.horario));
    
    return { mediodia, noche };
  };

  const reservasPorTurno = organizarReservasPorTurno(todayReservations);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Mapa de Mesas - {formatDate(today)}</h2>
          <p className={styles.subtitle}>Layout del salón para gestión de reservas presenciales</p>
        </div>
        <div className={styles.actions}>
          <button onClick={handlePrint} className={styles.actionButton}>
            <Printer size={18} />
            Imprimir
          </button>
          <button onClick={handleExport} className={styles.actionButton}>
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Mapa de Mesas */}
        <div className={styles.mapSection}>
          <h3 className={styles.sectionTitle}>Disposición de Mesas</h3>
          <div className={styles.mapContainer}>
            <svg 
              viewBox="0 0 350 620" 
              className={styles.mapSvg}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fondo del restaurante */}
              <rect x="0" y="0" width="350" height="620" fill="#fafafa" stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Divisiones principales - Paredes */}
              {/* Línea horizontal por encima de mesa 5, desde borde derecho de mesa 5 hasta borde izquierdo de mesa 6 */}
              <line x1="200" y1="300" x2="260" y2="300" stroke="#374151" strokeWidth="2" />
              
              {/* Línea vertical desde base de mesa 1 hasta base de mesa 7 (a la izquierda de ambas) */}
              <line x1="140" y1="520" x2="140" y2="490" stroke="#6b7280" strokeWidth="2" />
              
                             {/* Mesas */}
               {TABLES_LAYOUT.map(table => {
                 return (
                   <g key={table.id}>
                     {/* Mesa */}
                     <rect
                       x={table.x}
                       y={table.y}
                       width={table.width}
                       height={table.height}
                       fill="#ffffff"
                       stroke="#0c4900"
                       strokeWidth="2"
                       rx="8"
                       className={styles.table}
                     />
                     
                     {/* Número de mesa dentro del recuadro */}
                     <text
                       x={table.x + table.width / 2}
                       y={table.y + table.height / 2 + 6}
                       textAnchor="middle"
                       className={styles.tableNumberInside}
                       fontSize="20"
                       fontWeight="bold"
                     >
                       {table.id}
                     </text>
                   </g>
                 );
               })}
              
                             {/* Información del plano */}
               <g>
                 <text x="30" y="585" className={styles.legendTitle} fontSize="12" fontWeight="bold">Plano de mesas - Configuración días con muchas reservas</text>
                 <rect x="50" y="595" width="20" height="15" fill="#ffffff" stroke="#0c4900" strokeWidth="2" rx="3" />
                 <text x="75" y="605" className={styles.legendText} fontSize="10">Mesa individual</text>
                 <line x1="180" y1="603" x2="210" y2="603" stroke="#374151" strokeWidth="2" />
                 <text x="215" y="607" className={styles.legendText} fontSize="10">Divisiones</text>
                 <text x="30" y="620" className={styles.legendText} fontSize="9">Mesas modulares: 11/21, 14/24, 1/31 se pueden unir para días con pocas reservas</text>
               </g>
            </svg>
          </div>
        </div>

        {/* Lista de Reservas del Día */}
        <div className={styles.reservationsSection}>
          <h3 className={styles.sectionTitle}>Reservas del Día</h3>
          
          {todayReservations.length === 0 ? (
            <div className={styles.noReservations}>
              <p>No hay reservas para el día de hoy</p>
            </div>
          ) : (
            <div className={styles.reservationsList}>
              {/* Turno Mediodía */}
              {reservasPorTurno.mediodia.length > 0 && (
                <div className={styles.turnoSection}>
                  <h4 className={styles.turnoTitle}>☀️ Mediodía</h4>
                  <div className={styles.reservationGrid}>
                    {reservasPorTurno.mediodia.map((reserva, index) => (
                      <div key={reserva.id} className={styles.reservationCard}>
                        <div className={styles.reservationTime}>{reserva.horario}</div>
                        <div className={styles.reservationDetails}>
                          <div className={styles.reservationName}>{reserva.cliente.nombre}</div>
                          <div className={styles.reservationInfo}>
                            {reserva.personas} personas • {reserva.reservationId}
                          </div>
                          {reserva.cliente.comentarios && (
                            <div className={styles.reservationComments}>
                              "{reserva.cliente.comentarios}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turno Noche */}
              {reservasPorTurno.noche.length > 0 && (
                <div className={styles.turnoSection}>
                  <h4 className={styles.turnoTitle}>🌙 Noche</h4>
                  <div className={styles.reservationGrid}>
                    {reservasPorTurno.noche.map((reserva, index) => (
                      <div key={reserva.id} className={styles.reservationCard}>
                        <div className={styles.reservationTime}>{reserva.horario}</div>
                        <div className={styles.reservationDetails}>
                          <div className={styles.reservationName}>{reserva.cliente.nombre}</div>
                          <div className={styles.reservationInfo}>
                            {reserva.personas} personas • {reserva.reservationId}
                          </div>
                          {reserva.cliente.comentarios && (
                            <div className={styles.reservationComments}>
                              "{reserva.cliente.comentarios}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Información adicional para impresión */}
      <div className={styles.printInfo}>
        <p>Generado el {new Date().toLocaleString('es-AR')} | Rosaura - Sistema de Reservas</p>
      </div>
    </div>
  );
};

export default TableMap; 