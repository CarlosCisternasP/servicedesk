const { Pool } = require('pg');

// Configuración de conexión a Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Snm3hiBt7PJO@ep-restless-breeze-aekn5pt7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Manejar preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        
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
        } = data;

        // Validar campos requeridos
        if (!companyName || !companyRut || !employeeCount || !industry || !contactName || !contactPhone || !contactEmail || !needs) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Todos los campos obligatorios deben ser completados' })
            };
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
            currentSystem || null,
            needs,
            additionalInfo || null
        ];

        const result = await pool.query(query, values);

        console.log('✅ Contacto guardado en BD. ID:', result.rows[0].id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Contacto guardado exitosamente',
                id: result.rows[0].id
            })
        };

    } catch (error) {
        console.error('❌ Error al guardar contacto:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno del servidor al guardar el contacto',
                details: error.message 
            })
        };
    }
};
