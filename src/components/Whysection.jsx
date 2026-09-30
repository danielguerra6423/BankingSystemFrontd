export default function Whysection() {
  return (
    <>
      {/* <!-- ¿Por qué MiPlata? --> */}
      <section className="why-section" id="por-que-miplata">
        <h2 className="section-title">¿Por qué MiPlata?</h2>
        <p className="why-subtitle">Más que un banco, tu aliado financiero digital</p>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
            </div>
            <h3 className="why-title">100% Digital</h3>
            <p className="why-desc">Sin filas, sin papeleos, sin sucursales. Gestiona todas tus finanzas desde tu celular o computador en cualquier momento.</p>
          </div>
          <div className="why-card">
            <div className="why-icon why-icon--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h3 className="why-title">Sin comisiones ocultas</h3>
            <p className="why-desc">Transparencia total en cada operación. Lo que ves es lo que pagas: sin cobros sorpresa ni letras pequeñas.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h3 className="why-title">Seguridad bancaria</h3>
            <p className="why-desc">Autenticación robusta con bloqueo automático ante intentos no autorizados. Tu dinero protegido las 24 horas.</p>
          </div>
          <div className="why-card">
            <div className="why-icon why-icon--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            </div>
            <h3 className="why-title">Rendimientos automáticos</h3>
            <p className="why-desc">Tu cuenta de ahorros crece sola con un rendimiento del 1.5% mensual aplicado automáticamente en cada retiro.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
            </div>
            <h3 className="why-title">Transferencias sin costo</h3>
            <p className="why-desc">Mueve tu dinero entre tus productos o a cualquier usuario del sistema al instante y sin ninguna comisión.</p>
          </div>
          <div className="why-card">
            <div className="why-icon why-icon--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3 className="why-title">Disponible 24/7</h3>
            <p className="why-desc">Tu banco nunca cierra. Accede a tus cuentas, realiza operaciones y consulta tu historial en cualquier momento del día.</p>
          </div>
        </div>
      </section>
    </>
  )
}
