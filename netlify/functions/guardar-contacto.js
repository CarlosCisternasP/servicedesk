const { Pool } = require('pg');
const sgMail = require('@sendgrid/mail');

// Configurar SendGrid con variable de entorno
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configuración de conexión a Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Snm3hiBt7PJO@ep-restless-breeze-aekn5pt7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Función para enviar email
async function enviarEmail(datosContacto) {
    // Verificar que la API Key esté configurada
    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SENDGRID_API_KEY no configurada');
        return false;
    }

    const msg = {
        to: 'carlos.cisternas.p@gmail.com', // Email donde recibirás las notificaciones
        from: 'carlos.cisternas.p@gmail.com', // TU EMAIL VERIFICADO
        subject: `🎯 Nuevo Contacto ServiceDesk - ${datosContacto.companyName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 25px; text-align: center; }
                    .content { padding: 25px; background: #f8fafc; }
                    .field { margin-bottom: 18px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #3b82f6; }
                    .label { font-weight: bold; color: #1e293b; display: block; margin-bottom: 5px; font-size: 14px; }
                    .value { color: #64748b; font-size: 15px; }
                    .footer { background: #1e293b; color: white; padding: 20px; text-align: center; }
                    .urgent { background: #fef3c7; border-left-color: #f59e0b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🎯 NUEVO CONTACTO SERVICEDESK</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Formulario de contacto completado</p>
                    </div>
                    
                    <div class="content">
                        <div class="field urgent">
                            <span class="label">📋 EMPRESA</span>
                            <span class="value" style="font-size: 16px; color: #1e293b;">${datosContacto.companyName}</span>
                        </div>
                        
                        <div class="field">
                            <span class="label">📊 INFORMACIÓN EMPRESA</span>
                            <div class="value">
                                <strong>RUT:</strong> ${datosContacto.companyRut}<br>
                                <strong>Empleados:</strong> ${datosContacto.employeeCount}<br>
                                <strong>Giro:</strong> ${datosContacto.industry}
                            </div>
                        </div>
                        
                        <div class="field">
                            <span class="label">👤 CONTACTO</span>
                            <div class="value">
                                <strong>Nombre:</strong> ${datosContacto.contactName}<br>
                                <strong>Teléfono:</strong> ${datosContacto.contactPhone}<br>
                                <strong>Email:</strong> ${datosContacto.contactEmail}
                            </div>
                        </div>
                        
                        <div class="field">
                            <span class="label">💻 SISTEMA ACTUAL</span>
                            <span class="value">${datosContacto.currentSystem || 'No especificado'}</span>
                        </div>
                        
                        <div class="field" style="background: #f0f9ff;">
                            <span class="label">🎯 NECESIDADES ESPECÍFICAS</span>
                            <div class="value" style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                ${datosContacto.needs.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        
                        ${datosContacto.additionalInfo ? `
                        <div class="field">
                            <span class="label">📝 INFORMACIÓN ADICIONAL</span>
                            <div class="value" style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                ${datosContacto.additionalInfo.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="field" style="text-align: center; background: #dcfce7; border-left-color: #10b981;">
                            <span class="label">⏰ ACCIÓN REQUERIDA</span>
                            <span class="value" style="color: #065f46; font-weight: bold;">
                                Contactar dentro de las próximas 24 horas
                            </span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; font-size: 14px;">
                            <strong>ServiceDesk</strong> • Soluciones de Integración y Soporte para Empresas<br>
                            📧 carlos.cisternas.p@gmail.com • 📞 +56 2 1234 5678
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                            Este email fue generado automáticamente desde el formulario de contacto
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log('✅ Email enviado exitosamente a:', msg.to);
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

        console.log('📝 Procesando nuevo contacto:', companyName);

        // 1. Guardar en la base de datos
        const query = `
            INSERT INTO tabla_contacto (
                nombre_empresa, rut_empresa, cantidad_empleados, giro_empresa,
                nombre_contacto, telefono_contacto, email_contacto, sistema_actual,
                necesidades, informacion_adicional
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, fecha_creacion
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
        const fechaCreacion = result.rows[0].fecha_creacion;

        console.log('✅ Contacto guardado en BD. ID:', contactoId, 'Fecha:', fechaCreacion);

        // 2. Preparar datos para email
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
            additionalInfo: additionalInfo || '',
            fecha: new Date().toLocaleString('es-CL')
        };

        // 3. Enviar email (en segundo plano)
        enviarEmail(datosContacto)
            .then(success => {
                if (success) {
                    console.log('✅ Notificación por email enviada correctamente');
                } else {
                    console.log('⚠️ Email no pudo ser enviado, pero el contacto fue guardado en BD');
                }
            })
            .catch(emailError => {
                console.error('❌ Error en el proceso de email:', emailError);
            });

        // Responder inmediatamente al usuario
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: '¡Gracias por contactarnos! Hemos recibido tu información y te contactaremos dentro de 24 horas.',
                id: contactoId,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error al procesar contacto:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno del servidor al procesar tu solicitud',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Por favor, intenta nuevamente más tarde.'
            })
        };
    }
};
