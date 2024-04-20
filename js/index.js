//dependecias necesarias para el servidor
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');
const { error } = require("console");
const app = express();
dotenv.config();


// servicio de archivos estaticos 
app.use(express.static(path.join(__dirname, 'public' )));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));


//redireccion a la raiz del proyecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'./public/index.html'));
});


// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//configuracion inicial 
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

//Configuracion del puerto
const port = process.env.PORT || 3000;

//conexion a la bd
const connectionString = process.env.EXTERNAL_POSTGRESQL_RENDER;
const pool = new Pool({
  connectionString
});

//EMPIEZA CRUD
//☺
// Creación de las tablas en la base de datos al iniciar el servidor

async function crearTablas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS libros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(255)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL
      )
    `);

    console.log("Tablas creadas correctamente");
  } catch (error) {
    console.error("Error al crear las tablas:", error);
  }
}

// Llamada a la función de creación de tablas al iniciar el servidor
crearTablas();

// Rutas y controladores para CRUD de usuarios

app.post("/libros", crearLibros);
app.get("/libros", obtenerLibros);
app.get("/libros/:id", obtenerLibrosPorId);
app.put("/libros/:id", actualizarLibro);
app.delete("/libros/:id", eliminarLibros); 
 
//♥
//Funcion para crear un libro
async function crearLibros(req, res) {
  try {
    const pool = new Pool({
      connectionString,
    });
    const { titulo, autor, descripcion, categoria } = req.body;
    if (!titulo || !autor || !descripcion || !categoria) {
      return res.status(400).send("Missing required fields");
    }

    const client = await pool.connect();
    const checkEmail = await client.query(
      "SELECT * FROM libros WHERE titulo = $1",
      [titulo]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).send("id already exists");
    }

    const result = await client.query(
      `INSERT INTO libros (titulo, autor, descripcion, categoria) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ titulo, autor, descripcion, categoria] 
    );
    const newUser = result.rows[0];
    // Redirigir al usuario a la página de perfil
    res.json({ "response": "ok", ms: "Credenciales inválidas", data: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering book");
  }
}

//♥
//funcion para obtener los libros
async function obtenerLibros(req, res) {
  try {
    const result = await pool.query("SELECT * FROM libros");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).send("Error al obtener libros");
  }
}
//♥
//funcion para obtener libros por id
async function obtenerLibrosPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM libros WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Libro no encontrado");
    }
  } catch (error) {
    console.error("Error al obtener libro por id:", error);
    res.status(500).send("Error al obtener libro por id");
  }
}
//♥
//funcion para actualizar los Libros
async function actualizarLibro(req, res) {
  try {
    const { id } = req.params;
    const { titulo } = req.body;


    const result = await pool.query(
      "UPDATE libros SET   titulo = $1  WHERE id = $2 RETURNING *",
      [titulo, id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Libro no encontrado");
    }
  } catch (error) {
    console.error("Error al actualizar libro:", error);
    res.status(500).send("Error al actualizar libro");
  }
}
//♥
//funcion para eliminar libro
async function eliminarLibros(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM libros WHERE id = $1", [id]);
    if (result.rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).send("Libro no encontrado");
    }
  } catch (error) {
    console.error("Error al eliminar Libro:", error);
    res.status(500).send("Error al eliminar Libro");
  }
}

// CRUD PARA LA TABLA USUARIOS

// Rutas y controladores para CRUD de usuarios

app.post("/usuarios", crearUsuario);
app.get("/usuarios", obtenerUsuarios);
app.get("/usuarios/:id", obtenerUsuariosPorId);
app.put("/usuarios/:id", actualizarUsuarios);
app.delete("/usuarios/:id", eliminarUsuarios); 
 
//♥
//Funcion para crear un usuario
async function crearUsuario(req, res) {
  try {
    const pool = new Pool({
      connectionString,
    });
    const { usuario, email, contrasena } = req.body;
    if (!usuario || !email || !contrasena) {
      return res.status(400).send("Missing required fields");
    }

    const client = await pool.connect();
    const checkEmail = await client.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).send("Email already exists");
    }

    const result = await client.query(
      `INSERT INTO usuarios (usuario, email, contrasena) 
       VALUES ($1, $2, $3) RETURNING *`,
      [ usuario, email, contrasena] 
    );
    const newUser = result.rows[0];
    // Redirigir al usuario a la página de perfil
    res.json({ "response": "ok", ms: "Credenciales inválidas", data: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener Usuario");
  }
}

//♥
//funcion para obtener los usuarios
async function obtenerUsuarios(req, res) {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener Usuarios:", error);
    res.status(500).send("Error al obtener Usuario");
  }
}
//♥
//funcion para obtener usuarios por id
async function obtenerUsuariosPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al obtener usuario por id:", error);
    res.status(500).send("Error al obtener Usuario por id");
  }
}
//♥
//funcion para actualizar los usuarios
async function actualizarUsuarios(req, res) {
  try {
    const { id } = req.params;
    const { usuario } = req.body;


    const result = await pool.query(
      "UPDATE usuarios SET  usuario = $1  WHERE id = $2 RETURNING *",
      [usuario, id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al actualizar Usuario:", error);
    res.status(500).send("Error al actualizar Usuario");
  }
}
//♥
//funcion para eliminar usuario
async function eliminarUsuarios(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    if (result.rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al eliminar Usuario:", error);
    res.status(500).send("Error al eliminar Usuario");
  }
}
//ruta para iniciar sesion
app.post("/login", iniciarSesion);

async function iniciarSesion(req, res) {
  try {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).send("Correo y contraseña son requeridos");
    }

    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 AND contrasena = $2",
      [email, contrasena]
    );

    if (result.rows.length === 0) {
      return res.status(401).send("Credenciales inválidas");
    }

    // Si las credenciales son válidas, redirige al usuario al perfil.html
    res.json({"response": "ok"});

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).send("Error al iniciar sesión");
  }
}
// Configuración del puerto y arranque del servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});