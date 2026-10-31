export default function BankCard() {
  return (
    <>
      {/* <!-- Servicios destacados --> */}
      <section className="features" id="servicios">
        <div className="products-header">
          <h2 className="products-heading">Elige el producto que <em className="heading-em">transforma</em> tu vida</h2>
          <p className="products-subheading">Desde el ahorro cotidiano hasta crédito premium, MiPlata tiene la cuenta perfecta para cada etapa de tu vida financiera.</p>
        </div>
        <div className="products-grid">
          {/* <!-- Cuenta de Ahorros --> */}
          <div className="product-card">
            <div className="pc-icon pc-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <span className="pc-badge pc-badge--green">Cuenta de Ahorros</span>
            <h3 className="pc-title">Ahorra con propósito y rendimiento</h3>
            <p className="pc-desc">Abre tu cuenta en minutos. Sin cuota de manejo, con rendimientos reales y acceso 24/7.</p>
            <ul className="pc-list">
              <li className="pc-item pc-item--green">1.5% mensual garantizado</li>
              <li className="pc-item pc-item--green">Sin cuota de manejo</li>
              <li className="pc-item pc-item--green">Acceso 24/7</li>
            </ul>
          </div>

          {/* <!-- Cuenta Corriente --> */}
          <div className="product-card product-card--featured">
            <div className="pc-icon pc-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
            </div>
            <span className="pc-badge pc-badge--blue">Cuenta Corriente</span>
            <h3 className="pc-title">Poder financiero para tus finanzas diarias</h3>
            <p className="pc-desc">La cuenta diseñada para el día a día con sobregiro incluido y transferencias sin comisiones.</p>
            <ul className="pc-list">
              <li className="pc-item pc-item--blue">Sobregiro del 20% incluido</li>
              <li className="pc-item pc-item--blue">Transferencias sin límite</li>
              <li className="pc-item pc-item--blue">Sin comisiones ocultas</li>
            </ul>
          </div>

          {/* <!-- Tarjeta de Crédito --> */}
          <div className="product-card">
            <div className="pc-icon pc-icon--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <span className="pc-badge pc-badge--gold">Tarjeta de Crédito</span>
            <h3 className="pc-title">Crédito inteligente sin sorpresas</h3>
            <p className="pc-desc">Cupo de $4.000.000, cuotas flexibles y tasa transparente calculada al instante.</p>
            <ul className="pc-list">
              <li className="pc-item pc-item--gold">Cupo de $4.000.000</li>
              <li className="pc-item pc-item--gold">Hasta 12 cuotas</li>
              <li className="pc-item pc-item--gold">Cuota calculada al instante</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
