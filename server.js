const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.json({limit: '10kb'}));

// ✅ Solo servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Servir archivos JS/CSS desde /private manualmente si son solicitados (seguro)
app.get('/js/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'private', 'js', req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send('Archivo JS no encontrado');
});

app.get('/css/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'private', 'css', req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send('Archivo CSS no encontrado');
});

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
}
}));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

/* ======== Esquemas de Mongoose ======== */
const JugadorSchema = new mongoose.Schema({ nombre: String });
const JornadaSchema = new mongoose.Schema({
  nombre: String,
  partidos: [{
    equipo1: String,
    equipo2: String,
    comodin: { type: Boolean, default: false }
  }]
});
const ResultadoSchema = new mongoose.Schema({
  jugador: String,
  jornada: String,
  pronosticos: [{
    equipo1: String,     // 🔥 agregar esto
    equipo2: String,     // 🔥 agregar esto
    marcador1: Number,
    marcador2: Number
  }]
});

const ResultadoOficialSchema = new mongoose.Schema({
  jornada: String,
  resultados: [{
    equipo1: String,
    marcador1: Number,
    equipo2: String,
    marcador2: Number,
    comodin: { type: Boolean, default: false }
  }]
});

const EquipoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }
});


const Equipo = mongoose.model('Equipo', EquipoSchema);
const Jugador = mongoose.model('Jugador', JugadorSchema);
const Jornada = mongoose.model('Jornada', JornadaSchema);
const Resultado = mongoose.model('Resultado', ResultadoSchema);
const ResultadoOficial = mongoose.model('ResultadoOficial', ResultadoOficialSchema);

/* ======== Autenticación ======== */
app.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD){
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});
app.post('/logout', (req, res) => req.session.destroy(() => res.json({ success: true })));
app.get('/check-auth', (req, res) => res.json({ authenticated: req.session.authenticated || false }));


// Verificación de archivos esperados

/* ======== Vistas HTML ======== */
[
  '/', '/jugadores', '/jornada', '/ver-jugadores', '/resultados',
  '/ver-resultados', '/ver-jornadas', '/adminmode.html',
  '/ver_resultados_totales_de_jugadores', '/agregar-resultados-oficiales',
  '/generar_reporte', '/llenar_jornada', '/resultados-totales',
  '/ver-resultados-oficiales', '/verResultados', '/verResultados_puntos'
].forEach(route => {
  app.get(route, (req, res) => {
    let nombreArchivo = route === '/' ? 'index.html' : route.replace('/', '');
    if (!nombreArchivo.endsWith('.html')) {
      nombreArchivo += '.html';
    }
    const filePath = path.join(__dirname, 'public', nombreArchivo);  
    res.sendFile(filePath);
  });
});



app.get('/js/ver_resultados_totales_de_jugadores.js', (req, res) => res.sendFile(path.join(__dirname,'public', 'js', 'ver_resultados_totales_de_jugadores.js')));

/* ======== API: Jugadores ======== */
app.get('/api/jugadores', async (req, res) => {
  const jugadores = await Jugador.find({});
  res.json(jugadores.map(j => j.nombre));
});
app.post('/api/jugadores', async (req, res) => {
  const nuevo = new Jugador({ nombre: req.body.nombre });
  await nuevo.save();
  const jugadores = await Jugador.find({});
  res.json(jugadores.map(j => j.nombre));
});
app.delete('/api/jugadores/:nombre', async (req, res) => {
  await Jugador.deleteOne({ nombre: req.params.nombre });
  const jugadores = await Jugador.find({});
  res.json(jugadores.map(j => j.nombre));
});

/* ======== API: Jornadas ======== */
app.get('/api/jornadas', async (req, res) => {
  const jornadas = await Jornada.find({});
  res.json(jornadas.map(j => [j.nombre, j.partidos]));
});
app.get('/api/jornadas/:nombre', async (req, res) => {
  const jornada = await Jornada.findOne({ nombre: req.params.nombre });
  jornada ? res.json(jornada.partidos) : res.status(404).json({ error: 'Jornada no encontrada.' });
});
app.post('/api/jornadas', async (req, res) => {
  const { nombre, partidos } = req.body;
  await Jornada.findOneAndUpdate({ nombre }, { partidos }, { upsert: true });
  const jornadas = await Jornada.find({});
  res.json(jornadas.map(j => [j.nombre, j.partidos]));
});
app.post('/api/jornadas/agregar-partido', async (req, res) => {
  const { jornada, partido } = req.body;
  const doc = await Jornada.findOne({ nombre: jornada });
  if (!doc) return res.status(404).json({ error: 'Jornada no encontrada.' });
  doc.partidos.push(partido);
  await doc.save();
  res.json({ success: true });
});
app.post('/api/jornadas/eliminar-partidos', async (req, res) => {
  const { jornada, indices } = req.body;
  const doc = await Jornada.findOne({ nombre: jornada });
  if (!doc) return res.status(404).json({ error: 'Jornada no encontrada.' });
  indices.sort((a, b) => b - a).forEach(i => doc.partidos.splice(i, 1));
  await doc.save();
  res.json({ success: true });
});
app.post('/api/jornadas/comodin', async (req, res) => {
  const { jornada, partidos } = req.body;
  const doc = await Jornada.findOne({ nombre: jornada });
  if (!doc) return res.status(404).send('Jornada no encontrada');
  doc.partidos = partidos;
  await doc.save();
  res.send('Estado de comodín actualizado');
});

/* ======== API: Resultados ======== */
app.get('/api/resultados', async (req, res) => {
  const r = await Resultado.find({});
  const resultMap = new Map();
  r.forEach(r => resultMap.set(`${r.jugador}_${r.jornada}`, r.pronosticos));
  res.json(Array.from(resultMap.entries()));
});
app.post('/api/resultados', async (req, res) => {
  const { jugador, jornada, pronosticos } = req.body;
  await Resultado.findOneAndUpdate({ jugador, jornada }, { pronosticos }, { upsert: true });
  const all = await Resultado.find({});
  const resultMap = new Map();
  all.forEach(r => resultMap.set(`${r.jugador}_${r.jornada}`, r.pronosticos));
  res.json(Array.from(resultMap.entries()));
});
app.get('/api/resultados/:jugador/:jornada', async (req, res) => {
  const { jugador, jornada } = req.params;
  const r = await Resultado.findOne({ jugador, jornada });
  res.json(r ? r.pronosticos : []);
});

/* ======== API: Resultados Oficiales ======== */
app.get('/api/resultados-oficiales', async (req, res) => {
  const all = await ResultadoOficial.find({});
  const resultMap = new Map();
  all.forEach(r => resultMap.set(r.jornada, r.resultados));
  res.json(Array.from(resultMap.entries()));
});
app.post('/api/resultados-oficiales', async (req, res) => {
  const { jornada, resultados } = req.body;
  await ResultadoOficial.findOneAndUpdate({ jornada }, { resultados }, { upsert: true });
  const all = await ResultadoOficial.find({});
  const resultMap = new Map();
  all.forEach(r => resultMap.set(r.jornada, r.resultados));
  res.json(Array.from(resultMap.entries()));
});
app.get('/api/resultados-oficiales/:jornada', async (req, res) => {
  const jornada = req.params.jornada;
  const jornadaDoc = await Jornada.findOne({ nombre: jornada });
  const oficial = await ResultadoOficial.findOne({ jornada });
  if (!jornadaDoc) return res.status(404).json({ error: 'Jornada no encontrada' });
  const partidos = jornadaDoc.partidos;
  const resultadosExistentes = oficial ? oficial.resultados : [];
  const partidosConResultados = partidos.map(p => {
    const r = resultadosExistentes.find(r => r.equipo1 === p.equipo1 && r.equipo2 === p.equipo2);
    return {
      equipo1: p.equipo1,
      equipo2: p.equipo2,
      marcador1: r?.marcador1 ?? '',
      marcador2: r?.marcador2 ?? '',
      comodin: p.comodin
    };
  });
  res.json({ jornada, partidos: partidosConResultados });
});

// Obtener equipos (todos los documentos Equipo)
app.get('/api/equipos', async (req, res) => {
  try {
    const equipos = await Equipo.find({}, { _id: 0, __v: 0 }).lean();
    // { _id: 0, __v: 0 } para no enviar esos campos
    const nombresEquipos = equipos.map(e => e.nombre);
    res.json(nombresEquipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});

// Actualizar equipos (recibe array completo, sincroniza base de datos)
app.post('/actualizar-equipos', async (req, res) => {
  try {
    const { equipos } = req.body;
    if (!Array.isArray(equipos)) {
      return res.status(400).json({ error: 'Equipos inválidos' });
    }

    // Primero, elimina los equipos que no están en la lista
    await Equipo.deleteMany({ nombre: { $nin: equipos } });

    // Luego, inserta los equipos nuevos que no existan
    for (const nombreEquipo of equipos) {
      await Equipo.updateOne(
        { nombre: nombreEquipo },
        { nombre: nombreEquipo },
        { upsert: true }
      );
    }

    res.json({ message: 'Equipos actualizados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipos' });
  }
});

// NUEVA RUTA para obtener resultados con nombres de equipos
app.get('/api/resultados-con-equipos/:jugador/:jornada', async (req, res) => {
  const { jugador, jornada } = req.params;

  const resultado = await Resultado.findOne({ jugador, jornada });
  const jornadaDoc = await Jornada.findOne({ nombre: jornada });

  if (!resultado || !jornadaDoc) {
    return res.status(404).json({ error: 'Datos no encontrados' });
  }

  const pronosticos = resultado.pronosticos;
  const partidos = jornadaDoc.partidos;

  // Juntar equipos y pronósticos por índice
  const resultadosConEquipos = partidos.map((p, i) => ({
    equipo1: p.equipo1,
    equipo2: p.equipo2,
    marcador1: pronosticos[i]?.marcador1 ?? '',
    marcador2: pronosticos[i]?.marcador2 ?? ''
  }));

  res.json(resultadosConEquipos);
});

/* ======== API: Resultados Totales ======== */

app.get('/api/resultados-totales', async (req, res) => {
  const jugadores = await Jugador.find({});
  const jornadas = await Jornada.find({});
  const resultados = await Resultado.find({});
  const oficiales = await ResultadoOficial.find({});

  const mapRes = new Map();
  resultados.forEach(r => mapRes.set(`${r.jugador}_${r.jornada}`, r.pronosticos));

  const mapOficial = new Map();
  oficiales.forEach(r => mapOficial.set(r.jornada, r.resultados));

  const resultadosTotales = {};

  // ✅ Función auxiliar definida una sola vez
  const resultado = (m1, m2) => m1 > m2 ? 'gano' : m1 < m2 ? 'perdio' : 'empato';

  for (let j of jugadores) {
    let totalPuntos = 0;
    resultadosTotales[j.nombre] = {};

    for (let jornada of jornadas) {
      const key = `${j.nombre}_${jornada.nombre}`;
      const pronosticos = mapRes.get(key) || [];
      const oficialesJornada = mapOficial.get(jornada.nombre) || [];

      let puntosJornada = 0;

      jornada.partidos.forEach((partido, index) => {
        const p = pronosticos[index];
        const o = oficialesJornada[index];
        if (!p || !o) return;

        // ✅ Validar que todos los marcadores sean números válidos
        const valores = [o.marcador1, o.marcador2, p.marcador1, p.marcador2];
        const sonNumerosValidos = valores.every(val => typeof val === 'number' && !isNaN(val));

        if (!sonNumerosValidos) return; // ❌ Ignorar este partido si hay algún marcador inválido

        const esComodin = o.comodin;

        if (o.marcador1 === p.marcador1 && o.marcador2 === p.marcador2) {
          puntosJornada += esComodin ? 7 : 5;
        } else {
          const rOf = resultado(o.marcador1, o.marcador2);
          const rPr = resultado(p.marcador1, p.marcador2);
          if (rOf === rPr) puntosJornada += esComodin ? 4 : 3;
        }

        
//        if (rOf === rPr) puntosJornada += esComodin ? 4 : 3;
//        if (o.marcador1 === p.marcador1 && o.marcador2 === p.marcador2) puntosJornada += esComodin ? 3 : 2;

      });

      resultadosTotales[j.nombre][jornada.nombre] = puntosJornada;
      totalPuntos += puntosJornada;
    }

    resultadosTotales[j.nombre].total = totalPuntos;
  }

  res.json(resultadosTotales);
});


app.get('/generar_reporte', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'generar_reporte.html'));
});

/* ======== Iniciar servidor ======== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
