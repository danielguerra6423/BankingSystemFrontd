// Campo de contraseña que se puede mostrar u ocultar. El estado lo maneja quien lo usa
// (visible), así un mismo ojo puede controlar varios campos, por ejemplo la contraseña
// y su confirmación. Sin onToggle el campo no muestra ojo y sigue al otro campo.
export default function PasswordInput({ visible, onToggle, className = 'form-control', ...inputProps }) {
  return (
    <div className="password-field">
      <input {...inputProps} className={`${className} ${onToggle ? 'has-toggle' : ''}`} type={visible ? 'text' : 'password'} />
      {onToggle && (
        <button
          className="password-toggle"
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={inputProps.id}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <line x1="3" y1="3" x2="21" y2="21" />}
          </svg>
        </button>
      )}
    </div>
  )
}
