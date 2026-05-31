import { useState } from 'react';

export default function AgenteIA() {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultarIA = async (e) => {
    e.preventDefault();
    if (!pregunta.trim()) return;

    setCargando(true);
    setRespuesta('Analizando la base de datos de Licores de Guatemala...');
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
      console.error("Error detallado", error)
    } finally {
      setCargando(false);
      setPregunta(''); // Limpiamos el input
    }
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-[#1e1e1e] mt-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="font-bold text-[#e8e8e8] text-lg">Agente de Inteligencia de Negocios (IA)</h3>
      </div>
      
      {/* Caja de respuesta */}
      <div className="bg-[#080808] p-5 rounded-xl border border-[#1e1e1e] min-h-[120px] mb-4">
        {respuesta ? (
          <p className="text-[#e8e8e8] whitespace-pre-wrap text-sm leading-relaxed">{respuesta}</p>
        ) : (
          <p className="text-[#444] italic text-sm">
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
          className="flex-1 bg-[#161616] border border-[#252525] rounded-lg p-3 text-[#e8e8e8] outline-none focus:border-[#8b5cf6] transition-colors text-sm"
          disabled={cargando}
        />
        <button 
          type="submit" 
          disabled={cargando || !pregunta.trim()} 
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
        >
          {cargando ? 'Procesando...' : 'Preguntar'}
        </button>
      </form>
    </div>
  );
}