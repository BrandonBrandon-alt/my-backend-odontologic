# Funcionalidad de Confirmación de Citas por Email

## Descripción

Se ha implementado una nueva funcionalidad que permite a los pacientes confirmar sus citas médicas directamente desde el correo electrónico de confirmación, sin necesidad de iniciar sesión en el sistema.

## Características

### 1. Botón de Confirmación en el Email
- El correo de confirmación de cita ahora incluye un botón verde "✅ Confirmar Mi Cita"
- El botón es un hipervínculo que lleva a una URL segura de confirmación
- Se incluye también un enlace de texto como respaldo en caso de que el botón no funcione

### 2. URL de Confirmación Segura
- Cada cita tiene una URL única de confirmación
- La URL incluye un token de seguridad y el email del paciente
- Formato: `/api/appointments/confirm/{appointmentId}?token={token}&email={email}`

### 3. Página de Confirmación Exitosa
- Al confirmar la cita, se muestra una página HTML con:
  - Mensaje de confirmación exitosa
  - Detalles de la cita confirmada
  - Diseño consistente con la marca Odontologic
  - Información de que se enviará un correo de confirmación

### 4. Validaciones de Seguridad
- Verificación del token de confirmación
- Validación de que el email coincida con el paciente de la cita
- Verificación de que la cita esté en estado "pending"
- Solo se puede confirmar una vez

## Archivos Modificados/Creados

### Nuevos Archivos
- `src/utils/confirmation-token.js` - Manejo de tokens de confirmación

### Archivos Modificados
- `src/utils/mailer.js` - Agregado botón de confirmación al email
- `src/controllers/appointment-controller.js` - Nuevo método `confirmAppointmentByEmail`
- `src/routers/appointment-router.js` - Nueva ruta pública `/confirm/:id`

## Configuración Requerida

### Variable de Entorno
Agregar al archivo `.env`:
```
BASE_URL=http://localhost:3000
```

En producción, cambiar por la URL real de tu aplicación:
```
BASE_URL=https://tu-dominio.com
```

## Flujo de Funcionamiento

1. **Creación de Cita**: Cuando se crea una cita, se envía un correo de confirmación
2. **Email con Botón**: El correo incluye un botón verde "Confirmar Mi Cita"
3. **Clic en Botón**: El paciente hace clic en el botón
4. **Validación**: El sistema valida el token y el email
5. **Confirmación**: Se actualiza el estado de la cita a "confirmed"
6. **Página de Éxito**: Se muestra una página de confirmación exitosa
7. **Email de Confirmación**: Se envía un correo adicional confirmando la acción

## Endpoints

### Confirmar Cita por Email
```
GET /api/appointments/confirm/:id?token={token}&email={email}
```

**Parámetros:**
- `id`: ID de la cita
- `token`: Token de confirmación
- `email`: Email del paciente

**Respuesta:**
- HTML con página de confirmación exitosa
- Código 200 si todo es exitoso
- Códigos de error apropiados si hay problemas

## Consideraciones de Seguridad

### Tokens de Confirmación
- Los tokens se generan usando SHA-256
- Incluyen el ID de la cita, email del paciente y timestamp
- Se pueden implementar tokens con expiración en el futuro

### Validaciones
- Verificación de que el email coincida con el paciente
- Validación del estado de la cita
- Verificación del token de seguridad

## Mejoras Futuras

1. **Tokens con Expiración**: Implementar tokens que expiren después de un tiempo
2. **Base de Datos de Tokens**: Almacenar tokens en base de datos para mejor control
3. **Cancelación por Email**: Agregar funcionalidad para cancelar citas por email
4. **Reprogramación**: Permitir reprogramar citas desde el email
5. **Notificaciones Push**: Integrar notificaciones push para recordatorios

## Pruebas

Para probar la funcionalidad:

1. Crear una cita como paciente invitado
2. Revisar el correo de confirmación recibido
3. Hacer clic en el botón "Confirmar Mi Cita"
4. Verificar que se muestre la página de confirmación exitosa
5. Verificar que el estado de la cita cambie a "confirmed" en la base de datos
6. Verificar que se envíe un correo adicional de confirmación

## Notas Técnicas

- La funcionalidad funciona tanto para pacientes invitados como registrados
- El diseño del email es responsive y compatible con la mayoría de clientes de correo
- La página de confirmación exitosa es completamente autónoma (no requiere CSS externo)
- Los errores se manejan de forma elegante con mensajes apropiados 