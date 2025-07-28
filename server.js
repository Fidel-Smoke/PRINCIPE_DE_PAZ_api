const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();

const PORT = process.env.DB_PORT || 8080;

// Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(bodyParser.json());

// Conexión a PostgreSQL
const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'principe_paz',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

db.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL'))
    .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

// Lógica de cálculo de valores
function calcularValores(curso, meses_pagados_raw, es_docente, descuento_pension = 0, carnet = true, agenda = true, seguro = true) {
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

    const CARNET = 21000;
    const AGENDA = 42000;
    const SEGURO = 31000;

    let grado = "TR";
    if (typeof curso === "string") {
        const match = curso.match(/^\d{3,4}$/);
        if (match) {
            grado = curso.length === 3 ? curso.charAt(0) : curso.substring(0, 2);
        }
    }

    const costos = COSTOS_2025[grado] || { matricula: 0, pension: 0 };
    let pension = es_docente ? Math.floor(costos.pension / 2) : costos.pension;

    if (descuento_pension && !isNaN(descuento_pension) && descuento_pension > 0) {
        pension = Math.floor(pension * (1 - (descuento_pension / 100)));
    }

    let meses = [];
    if (typeof meses_pagados_raw === 'string') {
        try {
            meses = JSON.parse(meses_pagados_raw);
        } catch {
            meses = [];
        }
    } else if (Array.isArray(meses_pagados_raw)) {
        meses = meses_pagados_raw;
    }

    meses = meses.filter(m => typeof m === 'string' && m.trim() !== "");

    const total_pagado = costos.matricula + (pension * meses.length)
        + (carnet ? CARNET : 0)
        + (agenda ? AGENDA : 0)
        + (seguro ? SEGURO : 0);

    const valor_esperado = costos.matricula + (pension * 10) + CARNET + AGENDA + (seguro ? SEGURO : 0);

    return {
        valor_matricula: costos.matricula,
        valor_pension: pension,
        valor_carne: carnet ? CARNET : 0,
        valor_agenda: agenda ? AGENDA : 0,
        valor_seguro: seguro ? SEGURO : 0,
        total_pagado,
        valor_esperado,
        deuda: valor_esperado - total_pagado
    };
}

// Rutas
app.get('/', (req, res) => {
    try {
        res.send("✅ API COLEGIO PRÍNCIPE DE PAZ FUNCIONANDO");
    } catch (err) {
        console.error("Error en ruta /:", err);
        res.status(500).send("Error en API");
    }
});

app.get('/traerEstudiante', (req, res) => {
    const { curso } = req.query;
    let sql = 'SELECT * FROM estudiantes';
    const params = curso ? [curso] : [];
    if (curso) sql += ' WHERE curso = $1';

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result.rows);
    });
});


app.post('/crearEstudiante', (req, res) => {
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false,
        descuento_pension = 0,
        carnet = true,
        agenda = true,
        seguro = true,
        recibo_caja = null
    } = req.body;

    db.query('SELECT * FROM estudiantes WHERE documento_estudiante = $1', [documento_estudiante], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.rows.length > 0) return res.status(400).send('Ya existe un estudiante con ese número de documento');

        const meses = Array.isArray(meses_pagados)
            ? meses_pagados
            : typeof meses_pagados === 'string'
                ? JSON.parse(meses_pagados)
                : [];

        const valores = calcularValores(curso, meses, es_docente, descuento_pension, carnet, agenda, seguro);

        const query = `
            INSERT INTO estudiantes (
                nombre_estudiante, documento_estudiante, curso,
                nombre_acudiente, documento_acudiente,
                valor_matricula, valor_pension, valor_carne,
                valor_agenda, valor_seguro,
                total_pagado, valor_esperado, deuda,
                meses_pagados, observaciones, referencia_pago, recibo_caja,
                es_docente, descuento_pension, carnet, agenda, seguro
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22
            )
        `;

        db.query(query, [
            nombre_estudiante, documento_estudiante, curso,
            nombre_acudiente, documento_acudiente,
            valores.valor_matricula, valores.valor_pension, valores.valor_carne,
            valores.valor_agenda, valores.valor_seguro,
            valores.total_pagado, valores.valor_esperado, valores.deuda,
            JSON.stringify(meses), observaciones, referencia_pago, recibo_caja,
            es_docente, descuento_pension, carnet, agenda, seguro
        ], (err) => {
            if (err) return res.status(500).send(err);
            res.sendStatus(201);
        });
    });
});


app.put('/actualizarEstudiante/:id', (req, res) => {
    const { id } = req.params;
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false,
        descuento_pension = 0,
        carnet = true,
        agenda = true,
        seguro = true,
        recibo_caja = null
    } = req.body;

    db.query('SELECT * FROM estudiantes WHERE documento_estudiante = $1 AND id != $2', [documento_estudiante, id], (err, result) => {
        if (err) return res.status(500).send(err);

        const meses = Array.isArray(meses_pagados)
            ? meses_pagados
            : typeof meses_pagados === 'string'
                ? JSON.parse(meses_pagados)
                : [];

        const valores = calcularValores(curso, meses, es_docente, descuento_pension, carnet, agenda, seguro);

        const query = `
            UPDATE estudiantes SET
                nombre_estudiante = $1, documento_estudiante = $2, curso = $3,
                nombre_acudiente = $4, documento_acudiente = $5,
                valor_matricula = $6, valor_pension = $7, valor_carne = $8,
                valor_agenda = $9, valor_seguro = $10,
                total_pagado = $11, valor_esperado = $12, deuda = $13,
                meses_pagados = $14, observaciones = $15, referencia_pago = $16, recibo_caja = $17, es_docente = $18,
                descuento_pension = $19, carnet = $20, agenda = $21, seguro = $22
            WHERE id = $23
        `;

        db.query(query, [
            nombre_estudiante, documento_estudiante, curso,
            nombre_acudiente, documento_acudiente,
            valores.valor_matricula, valores.valor_pension, valores.valor_carne,
            valores.valor_agenda, valores.valor_seguro,
            valores.total_pagado, valores.valor_esperado, valores.deuda,
            JSON.stringify(meses), observaciones, referencia_pago, recibo_caja, es_docente,
            descuento_pension, carnet, agenda, seguro,
            id
        ], (err) => {
            if (err) return res.status(500).send(err);
            res.sendStatus(200);
        });
    });
});

app.delete('/eliminarEstudiante/:id', (req, res) => {
    db.query('DELETE FROM estudiantes WHERE id = $1', [req.params.id], err => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200);
    });
});

app.get('/', (req, res) => {
    res.send("Api de master barber :)");
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

