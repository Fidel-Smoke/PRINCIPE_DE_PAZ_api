const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');



const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password:"",
    database:"principe_paz",
})

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Conectado a la base de datos");
    }
})



app.post('/registro', (req, res) => {
    const user_name = req.body.user_name;
    const user_email = req.body.user_email;
    const user_password = req.body.user_password;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com)$/;

    db.query("SELECT * FROM usuarios WHERE user_email = ?", [user_email], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        else if (result.length > 0) {
            return res.status(400).send("El usuario ya existe");
        }



        else if (user_password.length < 8) {
            return res.status(400).send('La contraseña debe tener al menos 8 caracteres');
        }
        else if (user_name.length < 3) {
            return res.status(400).send('El nombre debe tener al menos 3 caracteres');
        }
        else if (user_email.length < 5) {
            return res.status(400).send('El email debe tener al menos 5 caracteres');
        }
        else if (!emailRegex.test(user_email)) {
            return res.status(400).send('El email debe ser válido y pertenecer a gmail.com, hotmail.com o outlook.com');
        }
        else {
            const hashpassword = bcrypt.hashSync(user_password, 10);
            const q = "INSERT INTO usuarios (user_name, user_email, user_password) VALUES (?,?,?)";
            const values = [
                user_name,
                user_email,
                hashpassword
            ];
            db.query(q, values, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.status(200).send("Usuario creado con éxito");
            });
        }
    });
});


app.listen(8080, () => {
    console.log(`conexion exitosa:)`);
});