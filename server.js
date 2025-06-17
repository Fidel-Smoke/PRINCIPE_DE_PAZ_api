const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');



const app = express();
app.use(cors());
app.use(bodyParser.json());

app.listen(8080, () => {
    console.log(`conexion exitosa`);
});