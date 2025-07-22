// BACKEND FUNCIONAL CORREGIDO
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], credentials: true }));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "principe_paz",
});

db.connect((err) => {
    if (err) console.log(err);
    else console.log("Conectado a la base de datos");
});

// Costos educativos 2025 por grado

function calcularValores(curso, meses_pagados_raw, es_docente) {
    const COSTOS_2025 = {
        "TR": { matricula: 397000, pension: 268000 },
        "1": { matricula: 397000, pension: 290000 },
        "2": { matricula: 397000, pension: 290000 },
        "3": { matricula: 397000, pension: 290000 },
        "4": { matricula: 397000, pension: 290000 },
        "5": { matricula: 397000, pension: 290000 },
        "6": { matricula: 397000, pension: 301000 },
        "7": { matricula: 397000, pension: 301000 },
        "8": { matricula: 354000, pension: 301000 },
        "9": { matricula: 341000, pension: 301000 },
        "10": { matricula: 341000, pension: 301000 },
        "11": { matricula: 339000, pension: 301000 }
    };

    let grado = "TR";
    if (typeof curso === "string") {
        const match = curso.match(/\d+/);
        if (match) grado = match[0].replace(/^100/, '');
    }

    const costos = COSTOS_2025[grado] || { matricula: 0, pension: 0 };
    const pension = es_docente ? Math.floor(costos.pension / 2) : costos.pension;

    let meses = [];
    if (typeof meses_pagados_raw === 'string') {
        try {
            meses = JSON.parse(meses_pagados_raw);
        } catch (e) {
            console.warn("Error al parsear meses:", e);
        }
    }

    const total_pagado = costos.matricula + (pension * meses.length);
    const valor_esperado = costos.matricula + (pension * 10);
    const deuda = valor_esperado - total_pagado;

    return {
        valor_matricula: costos.matricula,
        valor_pension: pension,
        total_pagado,
        valor_esperado,
        deuda
    };
}


// Registro
app.post('/registro', (req, res) => {
    const { user_name, user_email, user_password } = req.body;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com)$/;

    db.query("SELECT * FROM usuarios WHERE user_email = ?", [user_email], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) return res.status(400).send("El usuario ya existe");
        if (user_password.length < 8) return res.status(400).send('La contraseña debe tener al menos 8 caracteres');
        if (user_name.length < 3) return res.status(400).send('El nombre debe tener al menos 3 caracteres');
        if (!emailRegex.test(user_email)) return res.status(400).send('Correo no válido');

        const hashpassword = bcrypt.hashSync(user_password, 10);
        db.query(
            "INSERT INTO usuarios (user_name, user_email, user_password) VALUES (?, ?, ?)",
            [user_name, user_email, hashpassword],
            (err) => {
                if (err) return res.status(500).send(err);
                res.status(200).send("Usuario creado con éxito");
            }
        );
    });
});

// Login
app.post('/login', (req, res) => {
    const { user_email, user_password } = req.body;
    if (!user_email || !user_password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

    db.query("SELECT * FROM usuarios WHERE user_email = ?", [user_email], (err, result) => {
        if (err) return res.status(500).json({ error: "Error del servidor" });
        if (result.length === 0) return res.status(400).json({ error: "El usuario no existe" });

        const usuario = result[0];
        bcrypt.compare(user_password, usuario.user_password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: "Error de autenticación" });
            if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

            const token = jwt.sign({ id: usuario.id_usuario, email: usuario.user_email }, 'miClaveSecreta', { expiresIn: '1h' });
            return res.status(200).json({ message: "Inicio de sesión exitoso", token });
        });
    });
});

// Validar token
app.get('/validarToken', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Token no proporcionado' });

    jwt.verify(token, 'miClaveSecreta', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido' });
        return res.status(200).json({ user: { id: decoded.id, email: decoded.email } });
    });
});

// Traer estudiantes
app.get('/traerEstudiante', (req, res) => {
    db.query('SELECT * FROM estudiantes', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.post('/crearEstudiante', (req, res) => {
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false
    } = req.body;

    // ✅ Verificar si ya existe ese documento
    db.query('SELECT * FROM estudiantes WHERE documento_estudiante = ?', [documento_estudiante], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) {
            return res.status(400).send('Ya existe un estudiante con ese número de documento');
        }

        // Si no existe, continuar con el cálculo e inserción
        const COSTOS_2025 = {
            "TR": { matricula: 397000, pension: 268000 },
            "1": { matricula: 397000, pension: 290000 },
            "2": { matricula: 397000, pension: 290000 },
            "3": { matricula: 397000, pension: 290000 },
            "4": { matricula: 397000, pension: 290000 },
            "5": { matricula: 397000, pension: 290000 },
            "6": { matricula: 397000, pension: 301000 },
            "7": { matricula: 397000, pension: 301000 },
            "8": { matricula: 354000, pension: 301000 },
            "9": { matricula: 341000, pension: 301000 },
            "10": { matricula: 341000, pension: 301000 },
            "11": { matricula: 339000, pension: 301000 }
        };

        const grado = curso.match(/\d+/)?.[0] || "TR";
        const costos = COSTOS_2025[grado] || { matricula: 0, pension: 0 };
        const pensionFinal = es_docente ? Math.floor(costos.pension / 2) : costos.pension;

        const meses = Array.isArray(meses_pagados) ? meses_pagados : JSON.parse(meses_pagados || '[]');
        const total_pagado = costos.matricula + pensionFinal * meses.length;
        const valor_esperado = costos.matricula + pensionFinal * 10;
        const deuda = valor_esperado - total_pagado;

        const query = `
      INSERT INTO estudiantes (
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        valor_matricula, valor_pension, total_pagado,
        valor_esperado, deuda, meses_pagados,
        observaciones, referencia_pago, es_docente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.query(query, [
            nombre_estudiante, documento_estudiante, curso,
            nombre_acudiente, documento_acudiente,
            costos.matricula, pensionFinal, total_pagado,
            valor_esperado, deuda, JSON.stringify(meses),
            observaciones, referencia_pago, es_docente ? 1 : 0
        ], (err) => {
            if (err) return res.status(500).send(err);
            res.status(200).send("Estudiante creado con éxito");
        });
    });
});


app.put('/actualizarEstudiante/:id', (req, res) => {
    const { id } = req.params;
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false
    } = req.body;

    // Verificar si ya existe otro estudiante con ese documento
    db.query(
        'SELECT * FROM estudiantes WHERE documento_estudiante = ? AND id != ?',
        [documento_estudiante, id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            if (result.length > 0) {
                return res.status(400).send('Ya existe otro estudiante con ese número de documento');
            }

            // Si no hay duplicados, continuar actualización
            const COSTOS_2025 = {
                "TR": { matricula: 397000, pension: 268000 },
                "1": { matricula: 397000, pension: 290000 },
                "2": { matricula: 397000, pension: 290000 },
                "3": { matricula: 397000, pension: 290000 },
                "4": { matricula: 397000, pension: 290000 },
                "5": { matricula: 397000, pension: 290000 },
                "6": { matricula: 397000, pension: 301000 },
                "7": { matricula: 397000, pension: 301000 },
                "8": { matricula: 354000, pension: 301000 },
                "9": { matricula: 341000, pension: 301000 },
                "10": { matricula: 341000, pension: 301000 },
                "11": { matricula: 339000, pension: 301000 }
            };

            const grado = curso.match(/\d+/)?.[0] || "TR";
            const costos = COSTOS_2025[grado] || { matricula: 0, pension: 0 };
            const pensionFinal = es_docente ? Math.floor(costos.pension / 2) : costos.pension;

            const meses = Array.isArray(meses_pagados) ? meses_pagados : JSON.parse(meses_pagados || '[]');
            const total_pagado = costos.matricula + pensionFinal * meses.length;
            const valor_esperado = costos.matricula + pensionFinal * 10;
            const deuda = valor_esperado - total_pagado;

            const query = `
        UPDATE estudiantes SET
          nombre_estudiante = ?, documento_estudiante = ?, curso = ?,
          nombre_acudiente = ?, documento_acudiente = ?,
          valor_matricula = ?, valor_pension = ?, total_pagado = ?,
          valor_esperado = ?, deuda = ?, meses_pagados = ?,
          observaciones = ?, referencia_pago = ?, es_docente = ?
        WHERE id = ?
      `;

            db.query(query, [
                nombre_estudiante, documento_estudiante, curso,
                nombre_acudiente, documento_acudiente,
                costos.matricula, pensionFinal, total_pagado,
                valor_esperado, deuda, JSON.stringify(meses),
                observaciones, referencia_pago, es_docente ? 1 : 0,
                id
            ], (err) => {
                if (err) return res.status(500).send(err);
                res.sendStatus(200);
            });
        }
    );
});


app.delete('/eliminarEstudiante/:id', (req, res) => {
    db.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200);
    });
});

// Puerto
app.listen(8080, () => {
    console.log(`Servidor corriendo en http://localhost:8080`);
});