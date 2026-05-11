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

// Middlewares globales
// Lista de orígenes permitidos
app.use(cors({
    origin: 'http://localhost:5173', // puerto donde corre el react
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