import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const visxColors = {
  bg: '#ecf4f3',
  strokeLight: '#68b0ab',
  strokeDark: '#006a71',
  orange: '#ff7e67'
};

const Regla = ({ cumplida, texto }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: cumplida ? '#2d6a4f' : '#999', // Verde si cumple, gris si no
    fontWeight: cumplida ? '700' : '400',
    transition: 'all 0.2s'
  }}>
    <span style={{
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: cumplida ? '#4ade80' : '#ccc'
    }} />
    {texto}
  </div>
);



// Paleta cálida para el gráfico de Anillo
const donutColors = [visxColors.strokeDark, visxColors.orange, visxColors.strokeLight, '#b59a85', '#8c7662'];

/* ─── TOOLTIPS PERSONALIZADOS ─── */
const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div style={{
      background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 4,
      color: visxColors.strokeDark, fontSize: '12px', padding: '10px 14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold' }}>{data.name}</h3>
      <p style={{ margin: 0, color: visxColors.strokeLight }}>
        Pérdida: <span style={{ color: visxColors.orange, fontWeight: 'bold' }}>{parseFloat(data.value).toFixed(2)} L</span>
      </p>
    </div>
  );
};

const VisxStyleTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 2,
      color: visxColors.strokeDark, fontSize: '12px', lineHeight: '1em',
      padding: '10px 14px', fontWeight: 400, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold' }}>{label}</h3>
      <p style={{ margin: 0, color: visxColors.strokeLight }}>
        Pérdida registrada: <span style={{ color: visxColors.orange, fontWeight: 'bold' }}>{parseFloat(payload[0].value).toFixed(2)} L</span>
      </p>
    </div>
  );
};

export default function DashboardAdmin() {
  // Dentro de DashboardAdmin

  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [bitacora, setBitacora] = useState([]);
  // Calculamos las validaciones en tiempo real
  const validaciones = {
    minChar: password.length >= 8,
    mayus: /[A-Z]/.test(password),
    minus: /[a-z]/.test(password),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const passwordValida = Object.values(validaciones).every(Boolean);
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');

  const [historialMermas, setHistorialMermas] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [productoEditando, setProductoEditando] = useState(null);
  // --- FUNCIÓN PARA EXPORTAR A EXCEL ---
  const exportarAExcel = () => {
    // 1. Preparamos la información limpia
    const datosParaExcel = historialMermas.map(fila => ({
      'Fecha y Hora': new Date(fila.fecha_registro).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }),
      'Operador': fila.usuario?.nombre_completo || 'N/A',
      'Producto (Licor)': fila.producto?.nombre || 'Desconocido',
      'Pérdida (Litros)': parseFloat(fila.merma_calculada),
      'Causa Registrada': fila.causa
    }));

    // 2. Convertimos el JSON a una hoja de Excel
    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);

    // 3. ¡EL TOQUE MÁGICO! Le damos ancho a las columnas para que no se vea revuelto
    hoja['!cols'] = [
      { wch: 20 }, // Ancho columna A: Fecha y Hora
      { wch: 30 }, // Ancho columna B: Operador
      { wch: 25 }, // Ancho columna C: Producto
      { wch: 18 }, // Ancho columna D: Pérdida
      { wch: 50 }  // Ancho columna E: Causa (Súper ancha para que quepa el texto)
    ];

    // 4. Armamos el archivo y lo descargamos
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte_Mermas");

    const nombreArchivo = `Reporte_Mermas_${new Date().toLocaleDateString('es-GT').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  };


  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resMermas = await fetch(`${import.meta.env.VITE_API_URL}/api/mermas`);
        const resCategorias = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
        const resProductos = await fetch(`${import.meta.env.VITE_API_URL}/api/productos`);
        const resBitacora = await fetch(`${import.meta.env.VITE_API_URL}/api/bitacora`);
        if (resBitacora.ok) setBitacora(await resBitacora.json());

        if (resMermas.ok) {
          const data = await resMermas.json();
          setHistorialMermas(Array.isArray(data) ? data : []);
        }
        if (resCategorias.ok) setListaCategorias(await resCategorias.json());
        if (resProductos.ok) setListaProductos(await resProductos.json());

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
      const resUsuarios = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`);
      if (resUsuarios.ok) setListaUsuarios(await resUsuarios.json());
    };
    cargarDatos();
  }, [pestanaActiva]);

  // ==========================================
  // LÓGICA DE NEGOCIO Y ETL
  // ==========================================

  const historialCronologico = [...historialMermas].sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro));
  const historialReciente = [...historialMermas].sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

  const totalMermas = historialMermas.reduce((acc, curr) => acc + parseFloat(curr.merma_calculada || 0), 0);

  const mermasPorProductoObj = historialMermas.reduce((acc, curr) => {
    const nombre = curr.producto?.nombre || 'Desconocido';
    acc[nombre] = (acc[nombre] || 0) + parseFloat(curr.merma_calculada || 0);
    return acc;
  }, {});

  const productoMasAfectado = Object.keys(mermasPorProductoObj).length > 0
    ? Object.keys(mermasPorProductoObj).reduce((a, b) => mermasPorProductoObj[a] > mermasPorProductoObj[b] ? a : b)
    : 'N/A';

  const mermasDiariasObj = historialCronologico.reduce((acc, curr) => {
    const fecha = new Date(curr.fecha_registro).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
    acc[fecha] = (acc[fecha] || 0) + parseFloat(curr.merma_calculada || 0);
    return acc;
  }, {});
  const datosDiarios = Object.keys(mermasDiariasObj).map(f => ({ fecha: f, litros: mermasDiariasObj[f] })).slice(-7);

  const mermasSemanalesObj = historialCronologico.reduce((acc, curr) => {
    const d = new Date(curr.fecha_registro);
    const inicioAnio = new Date(d.getFullYear(), 0, 1);
    const semana = Math.ceil((((d - inicioAnio) / 86400000) + inicioAnio.getDay() + 1) / 7);
    const label = `Sem ${semana}`;
    acc[label] = (acc[label] || 0) + parseFloat(curr.merma_calculada || 0);
    return acc;
  }, {});
  const datosSemanales = Object.keys(mermasSemanalesObj).map(s => ({ semana: s, litros: mermasSemanalesObj[s] }));

  const mermasMensualesObj = historialCronologico.reduce((acc, curr) => {
    const mes = new Date(curr.fecha_registro).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    acc[mesCapitalizado] = (acc[mesCapitalizado] || 0) + parseFloat(curr.merma_calculada || 0);
    return acc;
  }, {});
  const datosMensuales = Object.keys(mermasMensualesObj).map(m => ({ mes: m, litros: mermasMensualesObj[m] }));

  const datosTopProductos = Object.keys(mermasPorProductoObj)
    .map(key => ({ producto: key, merma: mermasPorProductoObj[key] }))
    .sort((a, b) => b.merma - a.merma)
    .slice(0, 5);


  // --- FUNCIONES PARA GUARDADO REAL EN NODE.JS ---
  // --- FUNCIONES PARA GUARDADO REAL EN NODE.JS ---
  const crearCategoria = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: e.target.nombreCat.value })
    });
    if (res.ok) {
      const nuevaCat = await res.json(); // <-- Lo extraemos primero
      setListaCategorias(prev => [...prev, nuevaCat]); // <-- Lo guardamos después
      toast.success('¡Categoria creada exitosamente!')
      e.target.reset();
    }
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias/${id}`, { method: 'DELETE' });
    if (res.ok) { setListaCategorias(prev => prev.filter(cat => cat.id !== id)); }
  };

  const actualizarCategoria = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias/${categoriaEditando.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: e.target.nombreCat.value })
    });
    if (res.ok) {
      const catActualizada = await res.json(); // <-- Lo extraemos primero
      setListaCategorias(prev => prev.map(c => c.id === categoriaEditando.id ? catActualizada : c));
      setCategoriaEditando(null);
      e.target.reset();
    }
  };

  const manejarSubmitProducto = async (e) => {
    e.preventDefault();
    const datosFormulario = { nombre: e.target.nombreProd.value, id_categoria: parseInt(e.target.categoriaProd.value) };

    if (productoEditando) {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${productoEditando.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosFormulario)
      });
      if (res.ok) {
        const prodActualizado = await res.json(); // <-- Lo extraemos primero
        setListaProductos(prev => prev.map(p => p.id === productoEditando.id ? prodActualizado : p));
        setProductoEditando(null);
        e.target.reset();
      }
    } else {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosFormulario)
      });
      if (res.ok) {
        const nuevoProd = await res.json(); // <-- Lo extraemos primero
        setListaProductos(prev => [...prev, nuevoProd]);
        e.target.reset();
      }
    }
  };

  const alternarEstadoProducto = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}/estado`, {
        method: 'PATCH'
      });

      if (res.ok) {
        const prodActualizado = await res.json();

        // El mensaje cambia dinámicamente según el nuevo estado
        if (prodActualizado.activo) {
          toast.success('¡Producto activado!', {
            description: `${prodActualizado.nombre} ahora es visible en el formulario.`
          });
        } else {
          toast.success('Producto oculto', {
            description: `${prodActualizado.nombre} ya no aparecerá en la lista de mermas.`
          });
        }

        setListaProductos(prev =>
          prev.map(p => p.id === prodActualizado.id ? prodActualizado : p)
        );
      } else {
        toast.error('No se pudo cambiar el estado');
      }
    } catch (err) {
      toast.error('Error de red', {
        description: 'No se pudo conectar con el servidor. Revisa tu internet.'
      });
      console.error("Detalle del error:", err);
    }
  };
  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto permanentemente? Esta acción no se puede deshacer.')) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Producto eliminado.');
      setListaProductos(prev => prev.filter(p => p.id !== id));
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  };


  const crearUsuario = async (e) => {
    e.preventDefault();

    if (!passwordValida) {
      toast.error('Seguridad insuficiente', {
        description: 'Por favor, cumple con todos los requisitos de la contraseña.',
        duration: 4000,
      });
      return;
    }

    const formData = {
      nombre_completo: e.target.nombreUsuario.value,
      correo: e.target.correo.value,
      usuario: e.target.username.value,
      password: password, // Usamos el estado
      rol: e.target.rol.value
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Usuario creado exitosamente')
        setListaUsuarios(prev => [...prev, data]);
        e.target.reset();
        setPassword(''); // Limpiamos el estado
      } else {
        const msg = data.errores ? data.errores.map(err => `• ${err.msg}`).join('\n') : (data.error || 'Error');
        toast.error(' Error:\n' + msg);
      }
    } catch (error) {
      console.error("Error detallado:", error); // <-- Al usarlo aquí, el error desaparece
      toast.error('Error de conexión');
    }
  };
  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${id}`, { method: 'DELETE' });

    if (res.ok) {
      toast.success('Usuario eliminado correctamente.')
      setListaUsuarios(prev => prev.filter(u => u.id !== id));
    } else {
      const data = await res.json(); // ← lee el mensaje del backend
      toast.error(` ${data.error}`);    // ← muestra el motivo real
    }
  };

  const actualizarUsuario = async (e) => {
    e.preventDefault();
    if (!passwordValida && password.length > 0) {
      toast.error('⚠️ La contraseña no cumple los requisitos.');
      return;
    }
    const formData = {
      nombre_completo: e.target.nombreUsuario.value,
      correo: e.target.correo.value,
      usuario: e.target.username.value,
      rol: e.target.rol.value,
      ...(password.length > 0 && { password })
    };
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${usuarioEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setListaUsuarios(prev => prev.map(u =>
        u.id === usuarioEditando.id ? { ...u, ...formData } : u
      ));
      setUsuarioEditando(null);
      setPassword('');
      e.target.reset();
      toast.success(' Usuario actualizado');
    }
  };

  const iniciarEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setPassword(''); // Limpiar contraseña al editar
  };

  const tabs = ['dashboard', 'catalogo', 'usuarios', 'bitacora'];
  const activeIndex = tabs.indexOf(pestanaActiva);

  if (cargando) return <div style={{ color: visxColors.strokeDark, textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Cargando base de datos...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-4 pb-10">

      {/* --- NAVEGACIÓN INTERNA --- */}


      <div style={{
        display: 'flex',
        background: 'white',
        padding: '8px',
        borderRadius: '12px',
        border: `1px solid ${visxColors.strokeLight}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* La barrita deslizante */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: `calc(8px + ${activeIndex} * (100% - 16px) / 4)`,
          width: `calc((100% - 16px) / 4)`,
          height: '3px',
          background: visxColors.strokeDark,
          borderRadius: '2px',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />

        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setPestanaActiva(tab)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: pestanaActiva === tab ? 700 : 500,
              textTransform: 'capitalize',
              transition: 'color 0.2s',
              backgroundColor: 'transparent',
              color: pestanaActiva === tab ? visxColors.strokeDark : visxColors.strokeLight,
              border: 'none',
              cursor: 'pointer',
            }}
          >

            {tab === 'dashboard' ? 'Panel de Gráficas'
              : tab === 'catalogo' ? 'Gestión de Catálogo'
                : tab === 'usuarios' ? 'Gestión de Usuarios'
                  : 'Bitácora'}
          </button>
        ))}
      </div>

      {/* =========================================
          VISTA 1: DASHBOARD
          ========================================= */}
      {pestanaActiva === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderLeft: `4px solid ${visxColors.orange}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ color: visxColors.strokeLight, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pérdida Total Acumulada</h3>
              <p style={{ fontSize: '28px', fontWeight: 900, color: visxColors.orange, marginTop: 8 }}>{totalMermas.toFixed(2)} L</p>
            </div>
            <div style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderLeft: `4px solid ${visxColors.strokeDark}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ color: visxColors.strokeLight, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eventos Registrados</h3>
              <p style={{ fontSize: '28px', fontWeight: 900, color: visxColors.strokeDark, marginTop: 8 }}>{historialMermas.length}</p>
            </div>
            <div style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderLeft: `4px solid ${visxColors.strokeDark}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ color: visxColors.strokeLight, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foco Rojo (Licor)</h3>
              <p style={{ fontSize: '22px', fontWeight: 900, color: visxColors.strokeDark, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={productoMasAfectado}>{productoMasAfectado}</p>
            </div>
          </div>

          {/* Gráficas 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Gráfica DIARIA */}
            <div style={{ background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: visxColors.orange }} />
                <span style={{ fontSize: 12, color: visxColors.strokeDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tendencia Diaria</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosDiarios}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={visxColors.strokeLight} opacity={0.4} />
                    <XAxis dataKey="fecha" axisLine={{ stroke: visxColors.strokeDark, opacity: 0.3 }} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} dx={-10} />
                    <RechartsTooltip cursor={{ stroke: visxColors.strokeLight, strokeWidth: 1, strokeDasharray: '3 3' }} content={<VisxStyleTooltip />} />
                    <Line type="monotone" dataKey="litros" stroke={visxColors.strokeDark} strokeWidth={3} dot={{ r: 4, fill: visxColors.bg, strokeWidth: 2, stroke: visxColors.orange }} activeDot={{ r: 6, fill: visxColors.orange, stroke: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Gráfica SEMANAL */}
            <div style={{ background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: visxColors.orange }} />
                <span style={{ fontSize: 12, color: visxColors.strokeDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Acumulado Semanal</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosSemanales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSemana" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={visxColors.strokeLight} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={visxColors.strokeLight} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={visxColors.strokeLight} opacity={0.4} />
                    <XAxis dataKey="semana" axisLine={{ stroke: visxColors.strokeDark, opacity: 0.3 }} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} />
                    <RechartsTooltip content={<VisxStyleTooltip />} cursor={{ stroke: visxColors.strokeLight, strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="litros" stroke={visxColors.strokeDark} strokeWidth={3} fillOpacity={1} fill="url(#colorSemana)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Gráfica MENSUAL */}
            <div style={{ background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: visxColors.orange }} />
                <span style={{ fontSize: 12, color: visxColors.strokeDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Auditoría Mensual</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosMensuales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={visxColors.strokeLight} opacity={0.4} />
                    <XAxis dataKey="mes" axisLine={{ stroke: visxColors.strokeDark, opacity: 0.3 }} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }} />
                    <RechartsTooltip cursor={{ fill: visxColors.strokeLight, opacity: 0.15 }} content={<VisxStyleTooltip />} />
                    <Bar dataKey="litros" fill={visxColors.strokeDark} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Gráfica TOP PRODUCTOS */}
            <div style={{ background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: visxColors.orange }} />
                <span style={{ fontSize: 12, color: visxColors.strokeDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Licores Mayor Pérdida (Top 5)</span>
              </div>
              <div style={{ width: '100%', flex: 1, minHeight: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie data={datosTopProductos} dataKey="merma" nameKey="producto" cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={3} stroke="none">
                      {datosTopProductos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<DonutTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span style={{ color: visxColors.strokeDark, fontSize: 11, fontWeight: 600 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${visxColors.strokeLight}`, overflow: 'hidden', marginTop: 32 }}>
            <div style={{ padding: '16px 24px', background: visxColors.bg, borderBottom: `1px solid ${visxColors.strokeLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: visxColors.strokeDark, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Últimos Registros del Sistema</h2>
              <button
                onClick={exportarAExcel}
                style={{
                  background: visxColors.strokeDark, // Color verde oficial de Excel
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Descargar Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'white', borderBottom: `2px solid ${visxColors.strokeLight}`, color: visxColors.strokeLight, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Operador</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Producto</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Pérdida (L)</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historialReciente.slice(0, 15).map((fila) => (
                    <tr key={fila.id} style={{ borderBottom: `1px solid #f0f0f0`, fontSize: 14 }}>
                      <td style={{ padding: '16px 24px', color: visxColors.strokeLight }}>{new Date(fila.fecha_registro).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: visxColors.strokeLight }}>{fila.usuario?.nombre_completo || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: visxColors.strokeDark }}>{fila.producto?.nombre}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 800, color: parseFloat(fila.merma_calculada) > 0 ? visxColors.orange : visxColors.strokeDark, textAlign: 'right' }}>-{fila.merma_calculada}</td>
                      <td style={{ padding: '16px 24px', color: visxColors.strokeLight, fontStyle: 'italic', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fila.causa}>
                        "{fila.causa}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          VISTA 2: CATÁLOGO
          ========================================= */}
      {pestanaActiva === 'catalogo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">

          <div style={{ background: 'white', padding: 32, borderRadius: 16, border: `1px solid ${visxColors.strokeLight}` }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: visxColors.strokeDark, marginBottom: 24 }}>
              {productoEditando ? 'Editar Producto' : 'Agregar Licor'}
            </h2>
            <form onSubmit={manejarSubmitProducto} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Nombre</label>
                <input name="nombreProd" required type="text" defaultValue={productoEditando ? productoEditando.nombre : ''} key={`prod-${productoEditando?.id}`}
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Categoría</label>
                <select name="categoriaProd" required defaultValue={productoEditando ? productoEditando.id_categoria : ''} key={`cat-${productoEditando?.id}`}
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }}>
                  <option value="">Selecciona...</option>
                  {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ flex: 1, background: visxColors.strokeDark, color: 'white', fontWeight: 600, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  Guardar
                </button>
                {productoEditando && (
                  <button type="button" onClick={() => setProductoEditando(null)} style={{ padding: '0 20px', background: visxColors.bg, color: visxColors.strokeDark, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' }}>Cancelar</button>
                )}
              </div>
            </form>

            <div style={{ marginTop: 32, borderTop: `1px solid ${visxColors.strokeLight}`, paddingTop: 24 }}>
              <ul style={{ border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, overflow: 'hidden', maxHeight: 380, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
                {listaProductos.map(prod => (
                  <li key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid #f0f0f0`, opacity: prod.activo ? 1 : 0.5 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: prod.activo ? visxColors.strokeDark : visxColors.strokeLight, textDecoration: prod.activo ? 'none' : 'line-through' }}>{prod.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setProductoEditando(prod)} style={{ background: 'none', border: 'none', color: visxColors.strokeDark, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => alternarEstadoProducto(prod.id)} style={{ background: 'none', border: 'none', color: prod.activo ? visxColors.orange : visxColors.strokeDark, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{prod.activo ? 'Ocultar' : 'Activar'}</button>
                      <button onClick={() => eliminarProducto(prod.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: 'white', padding: 32, borderRadius: 16, border: `1px solid ${visxColors.strokeLight}`, height: 'fit-content' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: visxColors.strokeDark, marginBottom: 24 }}>
              {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={categoriaEditando ? actualizarCategoria : crearCategoria} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Nombre</label>
                <input name="nombreCat" required type="text" defaultValue={categoriaEditando?.nombre || ''} key={categoriaEditando?.id || 'nueva'}
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ flex: 1, background: visxColors.strokeDark, color: 'white', fontWeight: 600, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Guardar</button>
                {categoriaEditando && (
                  <button type="button" onClick={() => setCategoriaEditando(null)} style={{ padding: '0 20px', background: visxColors.bg, color: visxColors.strokeDark, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' }}>Cancelar</button>
                )}
              </div>
            </form>

            <div style={{ marginTop: 32, borderTop: `1px solid ${visxColors.strokeLight}`, paddingTop: 24 }}>
              <ul style={{ border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, overflow: 'hidden', listStyle: 'none', padding: 0, margin: 0 }}>
                {listaCategorias.map(cat => (
                  <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid #f0f0f0` }}>
                    <span style={{ fontWeight: 600, color: visxColors.strokeDark }}>{cat.nombre}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setCategoriaEditando(cat)} style={{ background: 'none', border: 'none', color: visxColors.strokeDark, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => eliminarCategoria(cat.id)} style={{ background: 'none', border: 'none', color: visxColors.orange, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}


      {/* =========================================
         VISTA 3: USUARIOS
         ========================================= */}
      {pestanaActiva === 'usuarios' && (
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', padding: 32, borderRadius: 16, border: `1px solid ${visxColors.strokeLight}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: visxColors.strokeDark, marginBottom: 24 }}>
            {usuarioEditando ? 'Editar Usuario' : 'Crear Cuenta de Usuario'}
          </h2>

          <form onSubmit={usuarioEditando ? actualizarUsuario : crearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Nombre Completo</label>
              <input
                name="nombreUsuario" required type="text"
                defaultValue={usuarioEditando?.nombre_completo || ''}
                key={`nombre-${usuarioEditando?.id}`}
                style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Correo Electrónico</label>
              <input
                name="correo" required type="email" placeholder="ejemplo@correo.com"
                defaultValue={usuarioEditando?.correo || ''}
                key={`correo-${usuarioEditando?.id}`}
                style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Nombre de Usuario</label>
                <input
                  name="username" required type="text"
                  defaultValue={usuarioEditando?.usuario || ''}
                  key={`user-${usuarioEditando?.id}`}
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>Rol en el Sistema</label>
                <select
                  name="rol" required
                  defaultValue={usuarioEditando?.rol || 'normal'}
                  key={`rol-${usuarioEditando?.id}`}
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark, boxSizing: 'border-box' }}
                >
                  <option value="normal">Operativo (Bodega)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: visxColors.strokeDark, marginBottom: 8 }}>
                Contraseña {usuarioEditando && <span style={{ fontWeight: 400, color: visxColors.strokeLight, fontSize: 12 }}>(dejar vacío para no cambiar)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  required={!usuarioEditando}
                  type={verPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    border: `1px solid ${password.length === 0 ? visxColors.strokeLight : passwordValida ? visxColors.strokeLight : '#ffb3b3'}`,
                    borderRadius: 8,
                    padding: '10px 40px 10px 14px',
                    outline: 'none',
                    background: '#fcfcfc',
                    color: visxColors.strokeDark,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: visxColors.strokeLight,
                    display: 'flex', alignItems: 'center', padding: '4px', fontSize: '16px'
                  }}
                >
                  {verPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Reglas solo visibles si hay algo escrito, o si es creación nueva */}
              {(!usuarioEditando || password.length > 0) && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <Regla cumplida={validaciones.minChar} texto="8+ caracteres" />
                  <Regla cumplida={validaciones.mayus} texto="Una Mayúscula" />
                  <Regla cumplida={validaciones.minus} texto="Una Minúscula" />
                  <Regla cumplida={validaciones.especial} texto="Carácter (!@#$)" />
                </div>
              )}
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={usuarioEditando ? (password.length > 0 && !passwordValida) : !passwordValida}
              style={{
                width: '100%',
                background: (usuarioEditando ? (password.length > 0 && !passwordValida) : !passwordValida) ? '#ccc' : visxColors.strokeDark,
                color: 'white', fontWeight: 600, padding: '12px', borderRadius: 8,
                border: 'none', marginTop: 8, transition: 'all 0.3s ease',
                cursor: (usuarioEditando ? (password.length > 0 && !passwordValida) : !passwordValida) ? 'not-allowed' : 'pointer'
              }}
            >
              {usuarioEditando ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>

            {/* Botón Cancelar (solo en modo edición) */}
            {usuarioEditando && (
              <button
                type="button"
                onClick={() => { setUsuarioEditando(null); setPassword(''); }}
                style={{
                  width: '100%', background: visxColors.bg, color: visxColors.strokeDark,
                  fontWeight: 600, padding: '12px', borderRadius: 8,
                  border: `1px solid ${visxColors.strokeLight}`, cursor: 'pointer'
                }}
              >
                Cancelar Edición
              </button>
            )}
          </form>

          {/* ── LISTA DE USUARIOS ── */}
          <div style={{ marginTop: 32, borderTop: `1px solid ${visxColors.strokeLight}`, paddingTop: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: visxColors.strokeDark, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, margin: '0 0 16px 0' }}>
              Usuarios Registrados
            </h3>
            <ul style={{ border: `1px solid ${visxColors.strokeLight}`, borderRadius: 8, overflow: 'hidden', maxHeight: 380, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
              {listaUsuarios.map(u => (
                <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: visxColors.strokeDark, display: 'block', fontSize: 14 }}>
                      {u.nombre_completo}
                    </span>
                    <span style={{ fontSize: 12, color: visxColors.strokeLight }}>
                      @{u.usuario} · <span style={{ textTransform: 'capitalize' }}>{u.rol}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => iniciarEdicion(u)}
                      style={{ background: 'none', border: 'none', color: visxColors.strokeDark, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarUsuario(u.id)}
                      style={{ background: 'none', border: 'none', color: visxColors.orange, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

      {pestanaActiva === 'bitacora' && (
        <div className="space-y-4 animate-fade-in">

          {/* Cabecera */}
          <div style={{
            background: 'white', borderRadius: 16,
            border: `1px solid ${visxColors.strokeLight}`, overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px', background: visxColors.bg,
              borderBottom: `1px solid ${visxColors.strokeLight}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{
                  fontSize: 14, fontWeight: 800, color: visxColors.strokeDark,
                  textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0
                }}>
                  Bitácora del Sistema
                </h2>
                <p style={{ fontSize: 12, color: visxColors.strokeLight, margin: '4px 0 0 0' }}>
                  Últimas 200 acciones registradas
                </p>
              </div>
              <span style={{
                background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}`,
                borderRadius: 20, padding: '4px 12px',
                fontSize: 12, fontWeight: 700, color: visxColors.strokeDark
              }}>
                {bitacora.length} registros
              </span>
            </div>

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: 'white', borderBottom: `2px solid ${visxColors.strokeLight}`,
                    color: visxColors.strokeLight, fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Fecha y Hora</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Usuario</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Acción</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Tabla</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacora.map((reg) => {
                    // Color según acción
                    const colorAccion = {
                      'CREAR': { bg: '#d1fae5', color: '#065f46' },
                      'ACTUALIZAR': { bg: '#dbeafe', color: '#1e40af' },
                      'ELIMINAR': { bg: '#fee2e2', color: '#991b1b' },
                      'LOGIN': { bg: '#fef9c3', color: '#713f12' },
                      'TOGGLE_ESTADO': { bg: '#ede9fe', color: '#4c1d95' },
                    }[reg.accion] || { bg: '#f3f4f6', color: '#374151' };

                    return (
                      <tr key={reg.id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                        <td style={{ padding: '14px 20px', color: visxColors.strokeLight, whiteSpace: 'nowrap' }}>
                          {new Date(reg.fecha_hora).toLocaleString('es-GT', {
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontWeight: 600, color: visxColors.strokeDark, display: 'block' }}>
                            {reg.usuario?.nombre_completo || 'Sistema'}
                          </span>
                          <span style={{ fontSize: 11, color: visxColors.strokeLight }}>
                            @{reg.usuario?.usuario || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            background: colorAccion.bg, color: colorAccion.color,
                            fontWeight: 700, fontSize: 11, padding: '3px 10px',
                            borderRadius: 20, letterSpacing: '0.05em'
                          }}>
                            {reg.accion}
                          </span>
                        </td>
                        <td style={{
                          padding: '14px 20px', fontWeight: 600,
                          color: visxColors.strokeDark, textTransform: 'lowercase'
                        }}>
                          {reg.tabla_afectada}
                        </td>
                        <td style={{
                          padding: '14px 20px', color: visxColors.strokeLight,
                          fontSize: 12, fontStyle: 'italic', maxWidth: 260,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                          title={reg.detalles ? JSON.stringify(reg.detalles) : '—'}>
                          {reg.detalles ? JSON.stringify(reg.detalles) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}