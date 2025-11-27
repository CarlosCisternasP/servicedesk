const { Pool } = require('pg');
const sgMail = require('@sendgrid/mail');

// Configurar SendGrid con tu API Key
sgMail.setApiKey('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');

// Configuración de conexión a Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Snm3hiBt7PJO@ep-restless-breeze-aekn5pt7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Función para enviar email
async function enviarEmail(datosContacto) {
    const msg = {
        to: 'info@servicedesk.cl', // Email donde recibirás las notificaciones
        from: 'notificaciones@servicedesk.cl', // Email verificado en SendGrid
        subject: `Nuevo Contacto ServiceDesk - ${datosContacto.companyName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #1e293b; }
                    .value { color: #64748b; }
                    .footer { background: #1e293b; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎯 Nuevo Contacto ServiceDesk</h2>
                        <p>Se ha recibido un nuevo formulario de contacto</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <span class="label">Empresa:</span>
                            <span class="value">${datosContacto.companyName}</span>
                        </div>
                        <div class="field">
                            <span class="label">RUT:</span>
                            <span class="value">${datosContacto.companyRut}</span>
                        </div>
                        <div class="field">
                            <span class="label">Cantidad de Empleados:</span>
                            <span class="value">${datosContacto.employeeCount}</span>
                        </div>
                        <div class="field">
                            <span class="label">Giro:</span>
                            <span class="value">${datosContacto.industry}</span>
                        </div>
                        <div class="field">
                            <span class="label">Contacto:</span>
                            <span class="value">${datosContacto.contactName}</span>
                        </div>
                        <div class="field">
                            <span class="label">Teléfono:</span>
                            <span class="value">${datosContacto.contactPhone}</span>
                        </div>
                        <div class="field">
                            <span class="label">Email:</span>
                            <span class="value">${datosContacto.contactEmail}</span>
                        </div>
                        <div class="field">
                            <span class="label">Sistema Actual:</span>
                            <span class="value">${datosContacto.currentSystem || 'No especificado'}</span>
                        </div>
                        <div class="field">
                            <span class="label">Necesidades:</span>
                            <div class="value" style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #e2e8f0;">
                                ${datosContacto.needs.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        ${datosContacto.additionalInfo ? `
                        <div class="field">
                            <span class="label">Información Adicional:</span>
                            <div class="value" style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #e2e8f0;">
                                ${datosContacto.additionalInfo.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>ServiceDesk • Soluciones de Integración y Soporte para Empresas</p>
                        <p>📧 info@servicedesk.cl • 📞 +56 2 1234 5678</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log('✅ Email enviado exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error enviando email:', error.response?.body || error.message);
        return false;
    }
}

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

        // 1. Primero guardar en la base de datos
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
        const contactoId = result.rows[0].id;

        console.log('✅ Contacto guardado en BD. ID:', contactoId);

        // 2. Enviar email (no esperamos a que termine para responder al usuario)
        const datosContacto = {
            companyName,
            companyRut,
            employeeCount,
            industry,
            contactName,
            contactPhone,
            contactEmail,
            currentSystem: currentSystem || 'No especificado',
            needs,
            additionalInfo: additionalInfo || ''
        };

        // Enviar email en segundo plano
        enviarEmail(datosContacto).then(success => {
            if (success) {
                console.log('✅ Notificación por email enviada');
            } else {
                console.log('⚠️ Email no pudo ser enviado, pero contacto fue guardado');
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Contacto guardado exitosamente. Te contactaremos dentro de 24 horas.',
                id: contactoId
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
