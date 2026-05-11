import { useState } from 'react';
import './App.css';
import Login from './components/Login'; 
import FormularioMerma from './components/FormularioMerma';
import DashboardAdmin from './components/DashboardAdmin';
import logoEmpresa from './assets/logo.png'; 
// 1. IMPORTAMOS SONNER
import { Toaster } from 'sonner';

const visxColors = {
  bg: '#ecf4f3',
  strokeLight: '#68b0ab',
  strokeDark: '#006a71',
  orange: '#ff7e67',
  base: '#c00000'
};

function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const manejarLogin = () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    setUsuarioActivo(usuario);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('usuario'); 
    localStorage.removeItem('usuario_id'); 
    setUsuarioActivo(null); 
  };

  if (!usuarioActivo) {
    return <Login onLoginExitoso={manejarLogin} />;
  }

  const obtenerIniciales = (nombre) => {
    if (!nombre) return "U";
    const partes = nombre.trim().split(" ");
    if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fcfcfc]">
      

      {/* personalizacion del mensaje*/}
      <Toaster position="top-center" richColors expand={true} />

      <div className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <img 
              src={logoEmpresa} 
              alt="Logo Empresa" 
              className="h-10 w-auto " 
              onError={(e) => e.target.style.display = 'none'} 
            />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: visxColors.strokeDark }}>
              Control<span style={{ color: visxColors.base }}>Merma</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-800 leading-tight">
                {usuarioActivo.nombre_completo}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: visxColors.strokeLight }}>
                {usuarioActivo.rol === 'admin' ? 'Administrador' : 'Operador'}
              </span>
            </div>

            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-sm"
              style={{ backgroundColor: visxColors.strokeLight }}
            >
              {obtenerIniciales(usuarioActivo.nombre_completo)}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-1"></div>

            <button 
              onClick={cerrarSesion}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>

        </div>
      </div>

      <div className="w-full max-w-7xl flex-1 flex flex-col pt-4">
        {usuarioActivo.rol === 'normal' ? (
          <FormularioMerma />
        ) : (
          <DashboardAdmin />
        )}
      </div>

    </div>
  );
}

export default App;