export default function Footer() {
  return (
    <>
      {/* <!-- Contacto --> */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-main" style={{ fontSize: '18px', fontWeight: 700 }}>Mi<span style={{ color: 'var(--green)' }}>Plata</span></div>
            <div className="brand-sub" style={{ fontSize: '8px', letterSpacing: '3px', color: 'var(--w40)', textTransform: 'uppercase', marginTop: '2px' }}>Banca Digital</div>
            <p style={{ marginTop: '12px' }}>La plataforma financiera digital que pone el control en tus manos. Segura, ágil y siempre disponible.</p>
          </div>
          <div className="footer-col">
            <h4>Productos</h4>
            <a href="#">Cuenta de Ahorros</a>
            <a href="#">Cuenta Corriente</a>
            <a href="#">Tarjeta de Crédito</a>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <a href="#">¿Por qué MiPlata?</a>
            <a href="#">Sobre nosotros</a>
            <a href="#">Contacto</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Términos de uso</a>
            <a href="#">Política de privacidad</a>
            <a href="#">Seguridad</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 MiPlata Banca Digital. Todos los derechos reservados.</span>
          <div className="footer-social">
            <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg></a>
            <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
            <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
          </div>
        </div>
      </footer>

    </>
  )
}
