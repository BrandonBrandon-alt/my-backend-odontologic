# Servicio: Obtener citas del paciente (usuario autenticado)

Este servicio permite a un paciente consultar sus citas con paginación y múltiples filtros desde el frontend.

---

## Endpoint

```
GET /api/appointment/my
```

### Requiere autenticación JWT
Debes enviar el token en el header:
```
Authorization: Bearer <accessToken>
```

---

## Parámetros de consulta (query params)

- `page` (opcional, default: 1): número de página
- `limit` (opcional, default: 10): cantidad de resultados por página
- `status` (opcional): estado de la cita (`pending`, `confirmed`, `cancelled`, `completed`)
- `from` (opcional): fecha inicial (YYYY-MM-DD)
- `to` (opcional): fecha final (YYYY-MM-DD)
- `type` (opcional): tipo de cita (`registered` o `guest`)
- `especialidad_id` (opcional): filtrar por especialidad
- `dentist_id` (opcional): filtrar por odontólogo
- `service_type_id` (opcional): filtrar por tipo de servicio

Puedes combinar los filtros según lo necesites.

---

## Ejemplo de uso en el frontend (React/JS)

```js
import axiosInstance from '../utils/axiosInstance';

export const getMyAppointments = async (params = {}) => {
  const response = await axiosInstance.get('/appointment/my', { params });
  return response.data;
};

// Ejemplo de llamada:
const params = {
  page: 1,
  limit: 5,
  status: 'confirmed',
  especialidad_id: 2,
  dentist_id: 3,
  service_type_id: 4,
  from: '2025-07-01',
  to: '2025-07-31'
};
const data = await getMyAppointments(params);
```

---

## Estructura de la respuesta

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "confirmed",
      "preferred_date": "2025-07-20",
      "preferred_time": "09:00:00",
      "appointment_type": "registered",
      "notes": "Test de cita",
      "disponibilidad": {
        "id": 1,
        "especialidad_id": 2,
        "dentist_id": 3,
        "especialidad": { "id": 2, "name": "Ortodoncia" }
      },
      "service_type_id": 4,
      "serviceType": { "id": 4, "name": "Consulta" }
    }
    // ...más citas
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 5,
    "totalPages": 3
  }
}
```

---

## Notas
- Si no se envían filtros, devuelve todas las citas del usuario autenticado.
- Si no hay resultados, `data` será un array vacío.
- Puedes usar los IDs de especialidad, odontólogo y tipo de servicio obtenidos de otros endpoints para filtrar.
- El endpoint es seguro: solo devuelve las citas del usuario autenticado.

---

## Ejemplo de integración en un servicio del frontend

```js
// services/appointmentService.js
export const appointmentService = {
  getMyAppointments: async (params = {}) => {
    const response = await axiosInstance.get('/appointment/my', { params });
    return response.data;
  }
};
``` 