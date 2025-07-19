# 📚 Resumen de Rutas del Backend para el Frontend

## 1. Convención General
- **Todas las rutas principales usan nombres en singular** (ejemplo: `/api/appointment`, no `/api/appointments`).
- Las rutas están agrupadas por tipo de recurso y separadas en públicas y protegidas.
- Los endpoints de administración y edición requieren autenticación y, en algunos casos, rol de admin.

---

## 2. Rutas de cada recurso

### **Autenticación (`/api/auth`)**
- `POST /api/auth/registro` — Registro de usuario (con reCAPTCHA)
- `POST /api/auth/login` — Login (con reCAPTCHA)
- `POST /api/auth/activar` — Activar cuenta
- `POST /api/auth/reenviar-activacion` — Reenviar código de activación
- `POST /api/auth/solicitar-reset` — Solicitar código de recuperación
- `POST /api/auth/reenviar-reset` — Reenviar código de recuperación
- `POST /api/auth/cambiar-password-reset` — Cambiar contraseña por código
- `POST /api/auth/verificar-reset` — Verificar código de recuperación
- `POST /api/auth/logout` — Cerrar sesión
- `POST /api/auth/token` — Renovar access token con refresh token

---

### **Citas (`/api/appointment`)**
- `POST /api/appointment/guest` — Crear cita como invitado (pública)
- `GET /api/appointment/confirm/:id` — Confirmar cita por email (pública)
- `POST /api/appointment/patient` — Crear cita como usuario autenticado
- `GET /api/appointment/my` — Obtener citas del usuario autenticado (con filtros y paginación)
- `GET /api/appointment/stats` — Estadísticas de citas (solo admin)
- `GET /api/appointment/` — Todas las citas (solo admin)
- `GET /api/appointment/:id` — Obtener cita específica (admin o dueño)
- `PATCH /api/appointment/:id/status` — Actualizar estado de cita (admin o dueño)

---

### **Especialidades (`/api/especialidad`)**
- `GET /api/especialidad/` — Todas las especialidades (pública)
- `GET /api/especialidad/:id` — Especialidad por ID (pública)
- `POST /api/especialidad/` — Crear especialidad (admin)
- `PUT /api/especialidad/:id` — Editar especialidad (admin)
- `DELETE /api/especialidad/:id` — Eliminar especialidad (admin)

---

### **Tipos de Servicio (`/api/service-type`)**
- `GET /api/service-type/` — Todos los tipos de servicio (pública)
- `GET /api/service-type/especialidad/:especialidad_id` — Por especialidad (pública)
- `GET /api/service-type/:id` — Tipo de servicio por ID (pública)
- `POST /api/service-type/` — Crear tipo de servicio (admin)
- `PUT /api/service-type/:id` — Editar tipo de servicio (admin)
- `DELETE /api/service-type/:id` — Eliminar tipo de servicio (admin)

---

### **Disponibilidad (`/api/disponibilidad`)**
- `GET /api/disponibilidad/` — Todas las disponibilidades (pública)
- `GET /api/disponibilidad/especialidad/:especialidad_id` — Por especialidad (pública)
- `GET /api/disponibilidad/dentist/:dentist_id` — Por odontólogo (pública)
- `GET /api/disponibilidad/:id` — Por ID (pública)
- `POST /api/disponibilidad/` — Crear disponibilidad (admin/dentist)
- `PUT /api/disponibilidad/:id` — Editar disponibilidad (admin/dentist)
- `DELETE /api/disponibilidad/:id` — Eliminar disponibilidad (admin/dentist)

---

### **Paciente Invitado (`/api/guest-patient`)**
- `POST /api/guest-patient/` — Crear paciente invitado (pública)
- `GET /api/guest-patient/:id` — Obtener paciente invitado (autenticado)
- `PUT /api/guest-patient/:id` — Editar paciente invitado (autenticado)
- `DELETE /api/guest-patient/:id` — Eliminar paciente invitado (autenticado)

---

### **Usuario (`/api/user`)**
- `GET /api/user/perfil` — Obtener perfil (autenticado)
- `POST /api/user/cambiar-password` — Cambiar contraseña (autenticado)
- `PATCH /api/user/perfil` — Editar perfil (autenticado)
- (También disponibles en inglés: `/profile`, `/change-password`)

---

### **Contacto (`/api/contact`)**
- `POST /api/contact/send-message` — Enviar mensaje de contacto (pública, con rate limit y validación)

---

### **Administrador (`/api/admin`)**
- `GET /api/admin/dentists` — Listar odontólogos
- `GET /api/admin/dentist/:id` — Obtener odontólogo por ID
- `GET /api/admin/users` — Listar usuarios
- `GET /api/admin/users/:id` — Obtener usuario por ID

---

## 🟢 Notas para el frontend
- **Todas las rutas principales son en singular** (ejemplo: `/api/appointment`, no `/api/appointments`).
- **Asegúrate de actualizar las rutas en los servicios del frontend** para que coincidan exactamente con las del backend.
- **Las rutas protegidas requieren el token JWT** en el header `Authorization`.
- **Las rutas de admin requieren autenticación y rol de admin**. 