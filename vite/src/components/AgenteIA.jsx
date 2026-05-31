import { useState } from 'react';

// Tu paleta oficial
const visxColors = {
  bg: '#ecf4f3',
  strokeLight: '#68b0ab',
  strokeDark: '#006a71',
  orange: '#ff7e67'
};

export default function AgenteIA() {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultarIA = async (e) => {
    e.preventDefault();
    if (!pregunta.trim()) return;

    setCargando(true);
    setRespuesta('Analizando la base de datos de LiquorFlow...');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    try {
      const res = await fetch(`${API_URL}/api/chat/preguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRespuesta(data.respuesta);
      } else {
        setRespuesta(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error detallado", error);
      setRespuesta('❌ Error de conexión. Verifica que el backend esté corriendo.');
    } finally {
      setCargando(false);
      setPregunta('');
    }
  };

  return (
    <div 
      className="p-6 rounded-2xl mt-8 animate-fade-in shadow-sm"
      style={{ background: 'white', border: `1px solid ${visxColors.strokeLight}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 
          className="font-bold text-sm uppercase tracking-wide"
          style={{ color: visxColors.strokeDark }}
        >
          Agente de Inteligencia de Negocios (IA)
        </h3>
      </div>
      
      {/* Caja de respuesta */}
      <div 
        className="p-5 rounded-xl min-h-[120px] mb-4"
        style={{ background: visxColors.bg, border: `1px solid ${visxColors.strokeLight}` }}
      >
        {respuesta ? (
          <p 
            className="whitespace-pre-wrap text-sm leading-relaxed font-medium"
            style={{ color: visxColors.strokeDark }}
          >
            {respuesta}
          </p>
        ) : (
          <p 
            className="italic text-sm font-medium"
            style={{ color: visxColors.strokeLight }}
          >
            Hazme una pregunta sobre el inventario, mermas o rendimiento de los productos...
          </p>
        )}
      </div>

      {/* Formulario de pregunta */}
      <form onSubmit={consultarIA} className="flex gap-3">
        <input 
          type="text" 
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Ej. ¿Qué licor tuvo la mayor pérdida registrada y por qué causa?" 
          className="flex-1 rounded-lg p-3 outline-none transition-colors text-sm font-medium"
          style={{ 
            background: 'white', 
            border: `1px solid ${visxColors.strokeLight}`,
            color: visxColors.strokeDark
          }}
          disabled={cargando}
        />
        <button 
          type="submit" 
          disabled={cargando || !pregunta.trim()} 
          className="text-white px-6 py-3 rounded-lg font-bold transition-opacity disabled:opacity-50 text-sm shadow-sm"
          style={{ background: visxColors.orange }}
        >
          {cargando ? 'Procesando...' : 'Preguntar'}
        </button>
      </form>
    </div>
  );
}