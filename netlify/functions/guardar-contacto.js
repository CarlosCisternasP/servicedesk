const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Snm3hiBt7PJO@ep-restless-breeze-aekn5pt7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
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
            currentSystem,
            needs,
            additionalInfo
        ];

        const result = await pool.query(query, values);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Contacto guardado exitosamente',
                id: result.rows[0].id
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor' })
        };
    }
};
