// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Snm3hiBt7PJO@ep-restless-breeze-aekn5pt7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
    } else {
        console.log('✅ Conectado a la base de datos Neon');
        release();
    }
});

// Ruta para manejar el formulario de contacto
app.post('/api/contact', async (req, res) => {
    try {
        const {
            companyName,
            companyRut,
            employeeCount,
            industry,
            contactName,
            contactPhone,
            contactEmail,
            currentSystem,
            needs,
            additionalInfo
        } = req.body;

        // Validar campos requeridos
        if (!companyName || !companyRut || !employeeCount || !industry || !contactName || !contactPhone || !contactEmail || !needs) {
            return res.status(400).json({ 
                error: 'Todos los campos obligatorios deben ser completados' 
            });
        }

        // Insertar en la base de datos
        const query = `
            INSERT INTO tabla_contacto (
                nombre_empresa, rut_empresa, cantidad_empleados, giro_empresa,
                nombre_contacto, telefono_contacto, email_contacto, sistema_actual,
                necesidades, informacion_adicional
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;

        const values = [
            companyName,
            companyRut,
            employeeCount,
            industry,
            contactName,
            contactPhone,
            contactEmail,
            currentSystem,
            needs,
            additionalInfo
        ];

        const result = await pool.query(query, values);

        console.log('✅ Contacto guardado en la base de datos. ID:', result.rows[0].id);

        res.status(200).json({ 
            success: true, 
            message: 'Contacto guardado exitosamente',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ Error al guardar contacto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al guardar el contacto' 
        });
    }
});

// Ruta para obtener todos los contactos (útil para verificar)
app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tabla_contacto ORDER BY fecha_creacion DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        res.status(500).json({ error: 'Error al obtener contactos' });
    }
});

// Servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
