import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Paleta de colores para mantener el diseño limpio
const visxColors = {
  bg: '#ecf4f3',
  strokeLight: '#68b0ab',
  strokeDark: '#006a71',
  orange: '#ff7e67'
};

export default function FormularioMerma() {
  const [producto, setProducto] = useState('');
  const [inicial, setInicial] = useState('');
  const [final, setFinal] = useState('');
  const [causa, setCausa] = useState('');

  const [listaProductos, setListaProductos] = useState([]);
  
  // NUEVO: Estado para guardar el historial del operador
  const [misMermas, setMisMermas] = useState([]);

  // Función para cargar el historial del usuario logueado
  // Función para cargar el historial del usuario logueado


// 1. Función separada SOLO para actualizar la tabla después de guardar un registro
  const actualizarHistorial = async () => {
    const idUsuarioLogueado = localStorage.getItem('usuario_id');
    if (!idUsuarioLogueado) return; 

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mermas?id_usuario=${idUsuarioLogueado}`);
      if (res.ok) setMisMermas(await res.json());
    } catch (error) {
      console.error("Error al recargar historial:", error);
    }
  };

  // 2. useEffect LIMPIO: Todo se ejecuta aquí adentro al abrir la pantalla
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      // A. Cargar lista de licores para el selector
      try {
        const resProd = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/activos`);
        if (resProd.ok) setListaProductos(await resProd.json());
      } catch (error) {
        console.error("Error cargando productos:", error);
      }

      // B. Cargar el historial del usuario logueado
      const idUsuario = localStorage.getItem('usuario_id');
      if (idUsuario) {
        try {
          const resMermas = await fetch(`${import.meta.env.VITE_API_URL}/api/mermas?id_usuario=${idUsuario}`);
          if (resMermas.ok) setMisMermas(await resMermas.json());
        } catch (error) {
          console.error("Error cargando historial inicial:", error);
        }
      }
    };

    cargarDatosIniciales();
  }, []); // <-- Corchetes totalmente vacíos, cero advertencias del editor

  const mermaCalculada = (inicial && final) ? (parseFloat(inicial) - parseFloat(final)) : 0;

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (mermaCalculada < 0) {
      toast.warning('Inventario Atípico', {
        description: `Se detectó un excedente de ${Math.abs(mermaCalculada).toFixed(2)} unidades. ¿Revisaste bien el conteo físico?`,
        duration: 6000,
      });
    }

    if (mermaCalculada > 0 && causa.trim() === '') {
      toast.error("Por favor, ingresa una descripción de la causa de la merma.");
      return;
    }

    const idUsuarioLogueado = localStorage.getItem('usuario_id');

    if (!idUsuarioLogueado) {
      toast.error("Error: No has iniciado sesión o tu sesión expiró.");
      return;
    }

    const datosParaBackend = {
      id_producto: parseInt(producto),
      id_usuario: parseInt(idUsuarioLogueado),
      inicial: parseFloat(inicial),
      final: parseFloat(final),
      merma: mermaCalculada,
      causa: causa || "Sin pérdida"
    };

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/api/mermas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend)
      });

      if (respuesta.ok) {
        toast.success("¡Transacción registrada correctamente!");
        setProducto('');
        setInicial('');
        setFinal('');
        setCausa('');
        
        // ¡MAGIA! Recargamos el historial instantáneamente para que el usuario vea su registro

        actualizarHistorial();
      } else {
        const errorData = await respuesta.json();
        toast.error(` Error al guardar: ${errorData.error || 'Problema en el servidor'}`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      toast.error(" No se pudo conectar con el backend. ¿Está encendido Node.js?");
    }
  };

  return (
    // Contenedor principal ampliado (max-w-5xl) para el diseño a dos columnas
    <div className="max-w-5xl w-full mx-auto my-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* =========================================
            COLUMNA IZQUIERDA: EL FORMULARIO
            ========================================= */}
        <div style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: visxColors.strokeDark, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: visxColors.orange }} />
            Control de Inventario
          </h2>

          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: visxColors.strokeDark, marginBottom: '8px' }}>Producto</label>
              <select 
                required 
                value={producto} 
                onChange={(e) => setProducto(e.target.value)}
                style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '8px', padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }}
              >
                <option value="" disabled>Selecciona un licor...</option>
                {listaProductos.length === 0 ? (
                  <option disabled>Cargando productos...</option>
                ) : (
                  listaProductos.map((prod) => (
                    <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: visxColors.strokeDark, marginBottom: '8px' }}>Inicial (L)</label>
                <input 
                  type="number" step="0.01" required min="0" 
                  value={inicial} onChange={(e) => setInicial(e.target.value)} placeholder="Ej. 200"
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '8px', padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: visxColors.strokeDark, marginBottom: '8px' }}>Final (L)</label>
                <input 
                  type="number" step="0.01" required min="0" 
                  value={final} onChange={(e) => setFinal(e.target.value)} placeholder="Ej. 195"
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '8px', padding: '10px 14px', outline: 'none', background: '#fcfcfc', color: visxColors.strokeDark }} 
                />
              </div>
            </div>

            {mermaCalculada > 0 && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: visxColors.strokeDark, marginBottom: '8px' }}>Causa de la pérdida <span style={{ color: visxColors.orange }}>*</span></label>
                <textarea 
                  required rows="2" 
                  value={causa} onChange={(e) => setCausa(e.target.value)} placeholder="Ej. Botella rota en bodega, degustación, etc."
                  style={{ width: '100%', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '8px', padding: '10px 14px', outline: 'none', background: '#fff', color: visxColors.strokeDark, resize: 'none' }} 
                />
              </div>
            )}

            <div style={{ padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: mermaCalculada > 0 ? '#fff5f3' : visxColors.bg, border: `1px solid ${mermaCalculada > 0 ? '#ffd2ca' : visxColors.strokeLight}` }}>
              <span style={{ fontWeight: 600, color: visxColors.strokeDark }}>Merma Calculada:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: mermaCalculada > 0 ? visxColors.orange : visxColors.strokeDark }}>
                {mermaCalculada > 0 ? mermaCalculada.toFixed(2) : '0.00'} L
              </span>
            </div>

            <button type="submit" style={{ width: '100%', background: visxColors.strokeDark, color: 'white', fontWeight: 600, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '16px', transition: 'background 0.2s' }}>
              Registrar Transacción
            </button>
          </form>
        </div>

        {/* =========================================
            COLUMNA DERECHA: HISTORIAL DEL USUARIO
            ========================================= */}
        <div style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px', overflow: 'hidden' }}>
          
          {/* Cabecera del historial */}
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${visxColors.strokeLight}`, background: visxColors.bg }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: visxColors.strokeDark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tus Últimos Registros
            </h3>
            <p style={{ fontSize: '12px', color: visxColors.strokeLight, marginTop: '4px' }}>Auditoría de tu turno actual.</p>
          </div>

          {/* Lista scrolleable */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {misMermas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: visxColors.strokeLight, fontStyle: 'italic', fontSize: '14px' }}>
                Aún no has registrado ninguna transacción hoy.
              </div>
            ) : (
              <div className="space-y-4">
                {misMermas.map((registro) => (
                  <div key={registro.id} style={{ border: `1px solid #f0f0f0`, borderRadius: '12px', padding: '16px', background: '#fcfcfc', transition: 'all 0.2s hover:shadow-sm' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: visxColors.strokeLight }}>
                          {new Date(registro.fecha_registro).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} • {new Date(registro.fecha_registro).toLocaleDateString('es-GT')}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: visxColors.strokeDark, marginTop: '2px' }}>
                          {registro.producto?.nombre || 'Producto Desconocido'}
                        </h4>
                      </div>
                      
                      {/* Píldora de Merma */}
                      <div style={{ background: parseFloat(registro.merma_calculada) > 0 ? '#fff5f3' : visxColors.bg, color: parseFloat(registro.merma_calculada) > 0 ? visxColors.orange : visxColors.strokeDark, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, border: `1px solid ${parseFloat(registro.merma_calculada) > 0 ? '#ffd2ca' : visxColors.strokeLight}` }}>
                        {parseFloat(registro.merma_calculada) > 0 ? `-${registro.merma_calculada} L` : '0.00 L'}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: visxColors.strokeLight, display: 'flex', gap: '12px' }}>
                      <span><strong style={{ color: visxColors.strokeDark }}>Inicial:</strong> {registro.inventario_inicial}</span>
                      <span><strong style={{ color: visxColors.strokeDark }}>Final:</strong> {registro.inventario_final}</span>
                    </div>

                    {parseFloat(registro.merma_calculada) > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px dashed ${visxColors.strokeLight}`, fontSize: '13px', fontStyle: 'italic', color: visxColors.strokeLight }}>
                        "{registro.causa}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}