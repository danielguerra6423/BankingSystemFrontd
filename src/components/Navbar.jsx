import React from 'react';

export default function Navbar({ onNavigateLogin, onNavigateRegister }) {
  return (
    <>
    {/* <!-- NAVBAR (landing / auth) --> */}
<nav className="navbar" id="main-navbar">
  <div className="nav-brand">
    <div className="brand-main">Mi<span>Plata</span></div>
    <div className="brand-sub">Banca Digital</div>
  </div>
  <div className="nav-links">
    <a href="#servicios" id="nav-servicios">Servicios</a>
    <a href="#por-que-miplata" id="nav-por-que">¿Por qué MiPlata?</a>
    <a href="#">Contacto</a>
  </div>
  <div className="nav-actions">
    <button className="btn-nav-login" id="nav-login">Iniciar sesión</button>
    <button className="btn-nav-register" id="nav-register">Abrir cuenta</button>
  </div>
</nav>

{/* <!-- TOPBAR DASHBOARD --> */}
<header className="dash-topbar" id="dash-topbar">
  <div className="dash-topbar__brand">
    <div className="brand-main">Mi<span>Plata</span></div>
    <div className="brand-sub">Banca Digital</div>
  </div>
  <div className="dash-topbar__center">
    <div className="dash-topbar__greeting" id="topbar-greeting">Bienvenido</div>
    <div className="dash-topbar__date" id="topbar-date"></div>
  </div>
  
</header>
{/* <!-- FIN NAVBAR / TOPBAR --> */}

    </>
  );
}