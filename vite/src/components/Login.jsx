import { useState } from 'react';

// TU PALETA DE COLORES
const visxColors = {
  bg: '#ecf4f3',
  strokeLight: '#68b0ab',
  strokeDark: '#006a71',
  orange: '#ff7e67',
  base: '#c00000',
  complemento: '#1ec908'
};
const Regla = ({ cumplida, texto }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px',
    color: cumplida ? '#2d6a4f' : '#999',
    fontWeight: cumplida ? '700' : '400',
    transition: 'all 0.2s'
  }}>
    <span style={{
      width: '6px', height: '6px', borderRadius: '50%',
      background: cumplida ? '#4ade80' : '#ccc'
    }} />
    {texto}
  </div>
);

export default function Login({ onLoginExitoso }) {
  // Estados para Login
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados para Recuperación
  const [vistaActual, setVistaActual] = useState('login');
  const [recuperarEmail, setRecuperarEmail] = useState('');
  const [tokenIngresado, setTokenIngresado] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [verNuevaPass, setVerNuevaPass] = useState(false);

  const validacionesReset = {
    minChar: nuevaPassword.length >= 8,
    mayus: /[A-Z]/.test(nuevaPassword),
    minus: /[a-z]/.test(nuevaPassword),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(nuevaPassword)
  };
  const resetPasswordValida = Object.values(validacionesReset).every(Boolean);
  // --- FUNCIÓN 1: LOGIN NORMAL ---
  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('usuario_id', data.usuario.id);
        onLoginExitoso(data.usuario.rol);
      } else {
        setError(data.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // --- FUNCIÓN 2: SOLICITAR TOKEN (SMTP) ---
  const solicitarRecuperacion = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: recuperarEmail })
      });

      if (res.ok) {
        setMensajeExito('Si la cuenta existe, enviamos un código a tu correo.');
        setTimeout(() => {
          setMensajeExito('');
          setVistaActual('cambiar_pass');
        }, 3000);
      } else {
        setError('Ocurrió un error al procesar la solicitud.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  // --- FUNCIÓN 3: CAMBIAR CONTRASEÑA ---
  const actualizarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenIngresado, nuevaPassword })
      });

      if (res.ok) {
        setMensajeExito('¡Contraseña actualizada con éxito!');
        setTimeout(() => {
          setMensajeExito('');
          setVistaActual('login');
          setPassword('');
          setTokenIngresado('');
          setNuevaPassword('');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Token inválido o expirado.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

 

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: visxColors.bg }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300" style={{ border: `1px solid ${visxColors.strokeLight}` }}>

        {/* Cabecera unificada */}
        <div className="px-8 py-10 text-center" style={{ backgroundColor: visxColors.strokeDark }}>
          <h1 className="text-3xl font-black text-white tracking-tight">ControlMerma</h1>
          <p className="mt-2 text-sm" style={{ color: visxColors.bg, opacity: 0.8 }}>
            {vistaActual === 'login' ? 'Control e Inteligencia de Inventario' : 'Recuperación de Acceso'}
          </p>
        </div>

        <div className="p-8">
          {/* Mensajes Globales de Error / Éxito */}
          {error && (
            <div className="text-sm p-3 rounded-lg mb-6 text-center" style={{ backgroundColor: '#fee2e2', border: `1px solid ${visxColors.base}`, color: visxColors.base }}>
              {error}
            </div>
          )}
          {mensajeExito && (
            <div className="text-sm p-3 rounded-lg mb-6 text-center" style={{ backgroundColor: '#d1fae5', border: `1px solid ${visxColors.strokeLight}`, color: visxColors.strokeDark }}>
              {mensajeExito}
            </div>
          )}

          {/* --- VISTA: LOGIN --- */}
          {vistaActual === 'login' && (
            <>
              <h2 className="text-xl font-bold mb-6 text-center" style={{ color: visxColors.strokeDark }}>Iniciar Sesión</h2>
              <form onSubmit={manejarLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: visxColors.strokeDark }}>Nombre de Usuario</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. jperez"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full rounded-xl p-3 outline-none transition-all"
                    style={{ border: `1px solid ${visxColors.strokeLight}`, backgroundColor: visxColors.bg, color: visxColors.strokeDark }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: visxColors.strokeDark }}>Contraseña</label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl p-3 pr-12 outline-none transition-all"
                      style={{ border: `1px solid ${visxColors.strokeLight}`, backgroundColor: visxColors.bg, color: visxColors.strokeDark }}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium transition-colors"
                      style={{ color: visxColors.strokeLight }}
                    >
                      {mostrarPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setError(''); setVistaActual('pedir_token'); }}
                    className="text-sm font-medium transition-colors hover:underline"
                    style={{ color: visxColors.strokeDark }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-md ${cargando ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: visxColors.strokeDark }}
                >
                  {cargando ? 'Verificando...' : 'Entrar al Sistema'}
                </button>
              </form>
            </>
          )}

          {/* --- VISTA: SOLICITAR CÓDIGO --- */}
          {vistaActual === 'pedir_token' && (
            <form onSubmit={solicitarRecuperacion} className="space-y-5 animate-fade-in">
              <p className="text-sm text-center mb-4" style={{ color: visxColors.strokeDark }}>
                Ingresa tu usuario o correo electrónico. Te enviaremos un código de seguridad para restablecer tu contraseña.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: visxColors.strokeDark }}>Usuario / Correo</label>
                <input
                  required
                  type="text"
                  value={recuperarEmail}
                  onChange={(e) => setRecuperarEmail(e.target.value)}
                  className="w-full rounded-xl p-3 outline-none transition-all"
                  style={{ border: `1px solid ${visxColors.strokeLight}`, backgroundColor: visxColors.bg, color: visxColors.strokeDark }}
                />
              </div>

              <button
                type="submit" disabled={cargando}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:opacity-90"
                style={{ backgroundColor: visxColors.strokeDark }}
              >
                {cargando ? 'Enviando...' : 'Enviar Código'}
              </button>

              <button
                type="button" onClick={() => { setError(''); setVistaActual('login'); }}
                className="w-full text-sm font-medium transition-colors mt-2 hover:underline"
                style={{ color: visxColors.strokeLight }}
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* --- VISTA: INGRESAR CÓDIGO Y NUEVA CLAVE --- */}
          {vistaActual === 'cambiar_pass' && (
            <form onSubmit={actualizarPassword} className="space-y-5 animate-fade-in">
              <p className="text-sm text-center mb-4" style={{ color: visxColors.strokeDark }}>
                Revisa tu bandeja de entrada e ingresa el código de 6 dígitos que te enviamos.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: visxColors.strokeDark }}>Código de Seguridad</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. 123456"
                  value={tokenIngresado}
                  onChange={(e) => setTokenIngresado(e.target.value)}
                  className="w-full rounded-xl p-3 text-center text-xl font-mono tracking-widest outline-none transition-all"
                  style={{ border: `1px solid ${visxColors.strokeLight}`, backgroundColor: visxColors.bg, color: visxColors.strokeDark }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: visxColors.strokeDark }}>
                  Nueva Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    type={verNuevaPass ? "text" : "password"}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="w-full rounded-xl p-3 outline-none transition-all"
                    style={{
                      border: `1px solid ${nuevaPassword.length === 0 ? visxColors.strokeLight : resetPasswordValida ? visxColors.strokeLight : '#ffb3b3'}`,
                      backgroundColor: visxColors.bg,
                      color: visxColors.strokeDark,
                      paddingRight: '48px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerNuevaPass(!verNuevaPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium"
                    style={{ color: visxColors.strokeLight }}
                  >
                    {verNuevaPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {/* Reglas — solo aparecen si hay algo escrito */}
                {nuevaPassword.length > 0 && (
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <Regla cumplida={validacionesReset.minChar} texto="8+ caracteres" />
                    <Regla cumplida={validacionesReset.mayus} texto="Una Mayúscula" />
                    <Regla cumplida={validacionesReset.minus} texto="Una Minúscula" />
                    <Regla cumplida={validacionesReset.especial} texto="Carácter (!@#$)" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando || !resetPasswordValida}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
                style={{
                  backgroundColor: resetPasswordValida ? visxColors.strokeDark : '#ccc',
                  cursor: resetPasswordValida ? 'pointer' : 'not-allowed'
                }}
              >
                {cargando ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}