const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "principe_paz",
});

db.connect(err => {
    if (err) console.error("Error al conectar a MySQL:", err);
    else console.log("Conectado a la base de datos");
});

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

    const CARNET = 21000;
    const AGENDA = 42000;
    const SEGURO = 31000;

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
        } catch {
            meses = [];
        }
    } else if (Array.isArray(meses_pagados_raw)) {
        meses = meses_pagados_raw;
    }

    meses = meses.filter(m => typeof m === 'string' && m.trim() !== "");

    const total_pagado = costos.matricula + (pension * meses.length);
    const valor_esperado = costos.matricula + (pension * 10) + CARNET + AGENDA + SEGURO;
    const deuda = valor_esperado - total_pagado;

    return {
        valor_matricula: costos.matricula,
        valor_pension: pension,
        valor_carne: CARNET,
        valor_agenda: AGENDA,
        valor_seguro: SEGURO,
        total_pagado,
        valor_esperado,
        deuda
    };
}

// Traer estudiantes
app.get('/traerEstudiante', (req, res) => {
    db.query('SELECT * FROM estudiantes', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// Crear estudiante
app.post('/crearEstudiante', (req, res) => {
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false
    } = req.body;

    db.query('SELECT * FROM estudiantes WHERE documento_estudiante = ?', [documento_estudiante], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) return res.status(400).send('Ya existe un estudiante con ese número de documento');

        const meses = Array.isArray(meses_pagados)
            ? meses_pagados
            : typeof meses_pagados === 'string'
                ? JSON.parse(meses_pagados)
                : [];

        const valores = calcularValores(curso, meses, es_docente);

        const query = `
            INSERT INTO estudiantes (
                nombre_estudiante, documento_estudiante, curso,
                nombre_acudiente, documento_acudiente,
                valor_matricula, valor_pension, valor_carne,
                valor_agenda, valor_seguro,
                total_pagado, valor_esperado, deuda,
                meses_pagados, observaciones, referencia_pago, es_docente
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            nombre_estudiante, documento_estudiante, curso,
            nombre_acudiente, documento_acudiente,
            valores.valor_matricula, valores.valor_pension, valores.valor_carne,
            valores.valor_agenda, valores.valor_seguro,
            valores.total_pagado, valores.valor_esperado, valores.deuda,
            JSON.stringify(meses), observaciones, referencia_pago, es_docente ? 1 : 0
        ], (err) => {
            if (err) return res.status(500).send(err);
            res.status(200).send("Estudiante creado con éxito");
        });
    });
});

// Actualizar estudiante
app.put('/actualizarEstudiante/:id', (req, res) => {
    const { id } = req.params;
    const {
        nombre_estudiante, documento_estudiante, curso,
        nombre_acudiente, documento_acudiente,
        meses_pagados, observaciones, referencia_pago,
        es_docente = false
    } = req.body;

    db.query('SELECT * FROM estudiantes WHERE documento_estudiante = ? AND id != ?', [documento_estudiante, id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) return res.status(400).send('Ya existe otro estudiante con ese número de documento');

        const meses = Array.isArray(meses_pagados)
            ? meses_pagados
            : typeof meses_pagados === 'string'
                ? JSON.parse(meses_pagados)
                : [];

        const valores = calcularValores(curso, meses, es_docente);

        const query = `
            UPDATE estudiantes SET
                nombre_estudiante = ?, documento_estudiante = ?, curso = ?,
                nombre_acudiente = ?, documento_acudiente = ?,
                valor_matricula = ?, valor_pension = ?, valor_carne = ?,
                valor_agenda = ?, valor_seguro = ?,
                total_pagado = ?, valor_esperado = ?, deuda = ?,
                meses_pagados = ?, observaciones = ?, referencia_pago = ?, es_docente = ?
            WHERE id = ?
        `;

        db.query(query, [
            nombre_estudiante, documento_estudiante, curso,
            nombre_acudiente, documento_acudiente,
            valores.valor_matricula, valores.valor_pension, valores.valor_carne,
            valores.valor_agenda, valores.valor_seguro,
            valores.total_pagado, valores.valor_esperado, valores.deuda,
            JSON.stringify(meses), observaciones, referencia_pago, es_docente ? 1 : 0,
            id
        ], (err) => {
            if (err) return res.status(500).send(err);
            res.sendStatus(200);
        });
    });
});

// Eliminar estudiante
app.delete('/eliminarEstudiante/:id', (req, res) => {
    db.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200);
    });
});

app.listen(8080, () => {
    console.log('Servidor corriendo en http://localhost:8080');
});
