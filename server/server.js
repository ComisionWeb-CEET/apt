require("dotenv").config();

// const rateLimit = require('express-rate-limit')
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mysql = require('mysql2/promise')
const path = require('path')
const cors = require('cors')
// const { RateLimiterMemory } = require('rate-limiter-flexible');

const jwt = require('jsonwebtoken')

const app = express()

const pool = require('../database/connection');

// const rateLimiter = new RateLimiterMemory({
//     points: isDev ? 100 : 5, // 5 points
//     duration: 60, // per minute
// });

// const limiter = rateLimit({
// 	windowMs: 1 * 60 * 1000, // 1 minute
// 	limit: 10, // Limit each IP to 100 requests per `window` (here, per 1 minute)
// 	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// 	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
//   message: { error: 'Too many requests, please try again later.' },
// })

// app.use(limiter)

// middlewares
const allowedOrigins = [
  'http://localhost:5173',  // Development
  'https://sf230pr9-5173.uks1.devtunnels.ms', // Development
  'https://pideturno.ceet.org.es',      // Production
  'https://www.pideturno.ceet.org.es'   // Production with www
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const server = http.createServer(app);

const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Añade esta línea para forzar solo polling
  transports: ['polling'] 
});

let asamblea = {
  tema: '',
  turnoAbierto: true,
};

let temporizador = null;
let tiempoRestante = 0;

// io.use(async (socket, next) => {
//   try {
//     await rateLimiter.consume(socket.handshake.address);
//     next();
//   } catch (error) {
//     console.log("Conexión rechazada por spam:", socket.handshake.address);
//     next(new Error('Rate limit exceeded'));
//   }
// });

io.on("connection", async (socket) => {

  console.log("Client connected (yay!)", socket.id);

  const update = async () => {
    const connection = await pool.getConnection();

    try {
      const [turnosDB] = await connection.query("SELECT * FROM turnos WHERE (activo = true AND ejecutado = false) OR (ejecutado = true AND hablando = true) ORDER BY prioridad DESC, tiempo_peticion ASC;");
      const [historialDB] = await connection.query("SELECT * FROM historial ORDER BY hora_fin DESC;");
      const [temaDB] = await connection.query("SELECT * FROM tema WHERE activo = true;");
      const [[{ minutos }]] = await connection.query("SELECT minutos FROM asamblea WHERE activo = true");
      
      let tema = "Sin tema seleccionado";
      let archivo = "";
      let hayArchivo = false;
      let turnoAbierto = true;

      const turnos = turnosDB.map(item => ({
        id: item.id,
        nombre: item.nombre,
        delegacion: item.delegacion,
        intervencion: item.intervencion,
        prioridad: item.prioridad,
        minutos: item.minutos,
        icono: item.icono,
        solicitud: item.solicitud,
        hablando: item.hablando,
        ejecutado: item.ejecutado,
      }))

      if (temaDB && temaDB.length > 0){
        tema = temaDB[0].tema;
        archivo = temaDB[0].archivo || ""; 
        hayArchivo = temaDB[0].hayArchivo || (archivo !== "");
        turnoAbierto = temaDB[0].abierto;
      }

      io.emit('estadoActualizado', {
        ...asamblea,
        turnos: turnos,
        historial: historialDB,
        tema: tema,
        archivo: archivo,
        hayArchivo: hayArchivo,
        turnoAbierto: turnoAbierto,
        minutos: minutos
      })

      io.emit('tiempo', tiempoRestante);
      
    } 
    catch (error) {console.error("Error:", error)} 
    finally {if (connection) connection.release()}

  }; 

  socket.on('pedirUpdate', async () => {
    await update();
  });

  socket.on('exportarHistorial', async () => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(
        "SELECT nombre, delegacion, tema, intervencion, minutos, tiempo_peticion FROM turnos WHERE ejecutado = 1 ORDER BY tiempo_peticion ASC"
      );
      
      socket.emit('recibirExportacion', rows);
    } catch (error) {
      console.error("Error al exportar historial:", error);
    } finally {
      if (connection) connection.release();
    }
  });

  socket.on('actualizarTema', async (datos) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query("UPDATE tema SET activo = false");

      let [check] = await connection.query("SELECT COUNT(*) AS existe FROM tema WHERE tema = ?", [datos.tema])

      if (Number(check[0].existe) === 0){
        await connection.query(
          "INSERT INTO tema (tema, archivo, activo) VALUES (?, ?, ?)",
          [datos.tema, datos.archivo, true]
        );
      } else {
        await connection.query("UPDATE tema SET activo = true WHERE tema = ?", [datos.tema])
      }
      
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}
    
    await update();

  });

  socket.on('cerrarTurno', async () => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query("UPDATE tema SET abierto = false WHERE activo = true")
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}
    
    await update();

  });

  socket.on('abrirTurno', async () => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query("UPDATE tema SET abierto = true WHERE activo = true")
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}
    
    await update();

  });

  socket.on('agregarTurno', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query(
        "INSERT INTO turnos (nombre, delegacion, tema, intervencion, prioridad, minutos, solicitud, hablando) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [datos.nombre, datos.delegacion, datos.tema, datos.intervencion, datos.prioridad, datos.minutos, datos.solicitud, datos.hablando]
      );
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}
    
  });

  socket.on('pedirTurno', async (datos) => {

    let connection;
    
    try {
      connection = await pool.getConnection();
      await connection.query(
        "INSERT INTO turnos (nombre, delegacion, intervencion, prioridad, minutos, icono, solicitud, hablando) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [datos.nombre, datos.delegacion, datos.intervencion, datos.prioridad, datos.minutos, datos.icono, datos.solicitud, datos.hablando]
      );
      await update();
    }

    catch (error){console.error(error)}
    finally {if (connection) connection.release();}

  })

  socket.on('cortarTurno', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query(
        "UPDATE turnos SET activo = false WHERE id = ? AND nombre = ? AND delegacion = ?",
        [datos.id, datos.nombre, datos.delegacion]
      );
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}

  })

  socket.on('darPalabra', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query("UPDATE turnos SET hablando = false WHERE hablando = true");
      await connection.query(
        "UPDATE turnos SET hablando = true, ejecutado = true WHERE id = ?", [datos]);
      
      const [rows] = await connection.query("SELECT minutos FROM turnos WHERE id = ?", [datos]);

      if (rows.length > 0 && rows[0].minutos) {
      tiempoRestante = rows[0].minutos * 60; 

      if (temporizador) clearInterval(temporizador);

      io.emit('tiempo', tiempoRestante);

      temporizador = setInterval(() => {
        tiempoRestante--;
        io.emit('tiempo', tiempoRestante);

        if (tiempoRestante <= 0) {
          clearInterval(temporizador);
          io.emit('tiempo', 0);
        }
      }, 1000);
    }
      
        await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}

  })

  socket.on('cambiarTiempo', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query(
        "UPDATE asamblea SET minutos = ? WHERE activo = true", [datos.minutos]);
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}

  })

  socket.on('terminarTurno', async () => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query(
        "UPDATE turnos SET hablando = false, activo = false WHERE hablando = true");
      
      if (temporizador) {
        clearInterval(temporizador);
        tiempoRestante = 0;
        io.emit('tiempo', 0);
      }
      
        await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}

  })

  socket.on('eliminarTurno', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.query(
        "UPDATE turnos SET activo = false WHERE id = ?", [datos]);
      await update();
    } 

    catch (error){console.error(error);} 
    finally {if (connection) connection.release();}

  })

  socket.on('loginAdmin', async (datos) => {

    let connection;

    try {
      connection = await pool.getConnection();
      const [sql] = await connection.query("SELECT * FROM usuarios WHERE usuario = ?", [datos.usuario])

      if (sql.length === 0 || datos.password !== sql[0].password){
        io.emit('resLogin', false);
        return;
      }

      const userData = {
        nombre: sql[0].nombre,
        delegacion: sql[0].delegacion,
        admin: sql[0].admin,
      }

      const token = jwt.sign(userData, process.env.JWT_KEY, {expiresIn: '8h'});
      
      socket.emit('resLogin', {userData: userData, token: token})

    } 

    catch (error){
      console.error(error);
      io.emit('resLogin', false)
    } 
    finally {if (connection) connection.release();}

  });

  socket.on('loginPublic', async (datos) => {

    // De alguna manera, tenemos que limitar las veces que una IP o una MAC cree más de un perfil (2 x si se equivoca) para evitar que se llene de.

    let connection;

    try {
      connection = await pool.getConnection();
      
      await connection.query("INSERT INTO usuarios (nombre, delegacion, admin) VALUES (?, ?, ?)", [datos.nombre, datos.delegacion, datos.admin])

      const userData = {
        nombre: datos.nombre,
        delegacion: datos.delegacion,
        admin: false,
      }

      const token = jwt.sign(userData, process.env.JWT_KEY, {expiresIn: '12h'});
      
      socket.emit('resLogin', {userData: userData, token: token})

    } 

    catch (error){
      console.error(error);
      io.emit('resLogin', false)
    } 
    finally {if (connection) connection.release();}

  });

  socket.on('verificacion', (token) => {
    try {
      const decodedUser = jwt.verify(token, process.env.JWT_KEY);
      socket.emit('resVerificacion', decodedUser);
    } 
    catch (error){socket.emit('resVerificacion', false)}
  });

  update();

});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
  console.log(`http://localhost:${PORT}`);
})