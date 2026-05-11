const express = require('express');
const cors = require('cors');

// Importamos los archivos de rutas
const mermasRoutes = require('./src/mermas');
const productosRoutes = require('./src/productos');
const categoriasRoutes = require('./src/categorias');
const usuariosRoutes = require('./src/usuarios');
const authRoutes = require('./src/auth');
const bitacoraRoutes = require('./src/bitacora');


const app = express();

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'https://controlmerma.onrender.com' // Tu URL de frontend en Render
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o apps móviles) 
        // o si el origen está en la lista blanca
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());


// REGISTRO DE RUTAS
// ==========================================
// Asociamos las rutas base a sus respectivos archivos
app.use('/api/mermas', mermasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/bitacora', bitacoraRoutes);

// Nota: He cambiado la ruta base para el login a /api/auth
app.use('/api/auth', authRoutes); 

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});