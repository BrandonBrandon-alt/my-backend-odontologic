# 🌱 Seeders - Sistema Odontológico

Los seeders son scripts que poblan la base de datos con datos de prueba para desarrollo y testing.

## 📋 Contenido de los Seeders

### 1. **Especialidades** (`01-specialty.seeder.js`)
- 10 especialidades odontológicas completas
- Incluye descripciones detalladas
- Especialidades: Odontología General, Ortodoncia, Endodoncia, etc.

### 2. **Tipos de Servicio** (`02-service-type.seeder.js`)
- Servicios específicos por cada especialidad
- Precios base realistas
- Duración estimada de cada servicio
- Total: ~40 tipos de servicio

### 3. **Usuarios** (`03-user.seeder.js`)
- **1 Administrador**: Acceso completo al sistema
- **9 Dentistas**: Uno por cada especialidad
- **4 Pacientes**: Usuarios de prueba
- Contraseñas encriptadas con bcrypt

### 4. **Disponibilidades** (`04-availability.seeder.js`)
- Horarios para los próximos 30 días
- Lunes a Viernes: 8:00-12:00 y 14:00-18:00
- Fines de semana: 9:00-12:00 y 14:00-16:00 (limitado)
- Variabilidad realista en disponibilidad

### 5. **Pacientes Invitados** (`06-guest-patient.seeder.js`)
- 10 pacientes no registrados
- Para probar el flujo de citas de invitados

### 6. **Citas** (`05-appointment.seeder.js`)
- Citas de ejemplo con diferentes estados
- Mezcla de usuarios registrados e invitados
- Notas realistas de consulta

## 🚀 Cómo Usar los Seeders

### Opción 1: Scripts NPM (Recomendado)
```bash
# Ejecutar todos los seeders
npm run seed

# Reiniciar BD y ejecutar seeders
npm run seed:reset

# Alternativas directas
npm run db:seed
npm run db:reset
```

### Opción 2: Ejecución Directa
```bash
# Desde la raíz del proyecto
node src/scripts/run-seeders.js

# Con reset completo
node src/scripts/run-seeders.js --reset

# Seeder individual
node src/seeders/index.js
```

### Opción 3: Seeders Individuales
```bash
# Ejecutar un seeder específico
node -e "require('./src/seeders/01-specialty.seeder').run()"
```

## ⚠️ Advertencias Importantes

### Reset de Base de Datos
- `--reset` **ELIMINA TODOS LOS DATOS** existentes
- Usa solo en desarrollo, nunca en producción
- Siempre haz backup antes de usar reset

### Orden de Ejecución
Los seeders deben ejecutarse en orden debido a las dependencias:
1. Especialidades
2. Tipos de Servicio (depende de especialidades)
3. Usuarios
4. Disponibilidades (depende de usuarios/dentistas)
5. Pacientes Invitados
6. Citas (depende de todo lo anterior)

## 🔑 Credenciales de Prueba

### Administrador
- **Email**: `admin@clinica.com`
- **Password**: `admin123`
- **Rol**: Administrador completo

### Dentistas
- **Email**: `carlos.rodriguez@clinica.com`
- **Password**: `dentist123`
- **Especialidad**: Odontología General

*Otros dentistas siguen el patrón: `nombre.apellido@clinica.com`*

### Pacientes
- **Email**: `juan.perez@email.com`
- **Password**: `user123`
- **Rol**: Usuario/Paciente

## 🛠️ Personalización

### Agregar Nuevos Datos
1. Edita el seeder correspondiente
2. Agrega los nuevos elementos al array de datos
3. Ejecuta el seeder

### Crear Nuevo Seeder
1. Crea archivo en `/src/seeders/`
2. Sigue el patrón de numeración: `07-nuevo.seeder.js`
3. Agrega la referencia en `index.js`

### Modificar Datos Existentes
1. Edita el seeder correspondiente
2. Usa `--reset` para aplicar cambios
3. O elimina registros manualmente y ejecuta seeder

## 🔍 Verificación

Después de ejecutar los seeders, verifica:

```sql
-- Contar registros creados
SELECT 'specialties' as table_name, COUNT(*) as count FROM specialties
UNION ALL
SELECT 'service_types', COUNT(*) FROM service_types
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'availabilities', COUNT(*) FROM availabilities
UNION ALL
SELECT 'guest_patients', COUNT(*) FROM guest_patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;
```

## 🐛 Solución de Problemas

### Error: "No se encontraron especialidades"
- Ejecuta primero el seeder de especialidades
- O usa `npm run seed:reset` para ejecutar todo en orden

### Error: "Ya existen X registros"
- Los seeders detectan datos existentes y los saltan
- Usa `--reset` si quieres recrear todo

### Error de Conexión a BD
- Verifica que la base de datos esté corriendo
- Revisa las variables de entorno
- Confirma las credenciales de conexión

### Rendimiento Lento
- Los seeders crean muchos registros
- Es normal que tome algunos segundos
- Considera reducir el número de disponibilidades para testing

## 📊 Estadísticas Típicas

Después de ejecutar todos los seeders:
- **10** especialidades
- **~40** tipos de servicio
- **14** usuarios (1 admin + 9 dentistas + 4 pacientes)
- **~2000** disponibilidades (30 días × 9 dentistas × 8 slots promedio)
- **10** pacientes invitados
- **~35** citas de ejemplo

Total: **~2100** registros aproximadamente
