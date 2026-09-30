export default function Hero() {
    return (
        <>
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge"><span className="badge-dot"></span>Banca 100% digital y segura</div>
                    <h1 className="hero-title">
                        Tu dinero,<br />
                        <span className="italic">inteligente</span><br />
                        y <span className="gold">libre</span>
                    </h1>
                    <p className="hero-desc">
                        MiPlata es la plataforma financiera que pone <strong>el control en tus manos</strong>.
                        Gestiona cuentas, transfiere al instante y crece con nosotros.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary" id="hero-btn-register">Abrir mi cuenta</button>
                        <button className="btn-outline" id="hero-btn-login">Iniciar sesión</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="bank-card">
                        <div className="card-chip"></div>
                        <div className="card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;3456</div>
                        <div className="card-footer">
                            <div>
                                <div className="card-holder-label">Titular</div>
                                <div className="card-holder-name">Nombre del cliente</div>
                            </div>
                            <div>
                                <div className="card-brand-name">Mi<span>Plata</span></div>
                                <div className="card-brand-sub">Banca Digital</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    )
}
