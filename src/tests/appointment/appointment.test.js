const request = require('supertest');
const app = require('../../app');
const { Appointment, GuestPatient, Disponibilidad, ServiceType, User, Especialidad } = require('../../models/index');

describe('Appointment API', () => {
    let testGuestPatient;
    let testDisponibilidad;
    let testServiceType;
    let testAppointment;
    let authToken;

    beforeAll(async () => {
        // Limpiar la base de datos antes de los tests
        await Appointment.destroy({ where: {} });
        await GuestPatient.destroy({ where: {} });
        await Disponibilidad.destroy({ where: {} });
        await ServiceType.destroy({ where: {} });
        
        // Crear un token de autenticación para tests (simulado)
        authToken = 'test-token';

        // Crear datos de prueba
        testGuestPatient = await GuestPatient.create({
            name: 'Juan Pérez',
            phone: '1234567890',
            email: 'juan@example.com',
            is_active: true
        });

        // Crear un dentista de prueba
        const testDentist = await User.create({
            name: 'Dr. García',
            email: 'dr.garcia@example.com',
            password: 'password123',
            role: 'dentist',
            is_active: true
        });

        // Crear una especialidad de prueba
        const testEspecialidad = await Especialidad.create({
            name: 'Odontología General',
            description: 'Tratamientos generales de odontología',
            is_active: true
        });

        // Crear una disponibilidad de prueba
        testDisponibilidad = await Disponibilidad.create({
            dentist_id: testDentist.id,
            especialidad_id: testEspecialidad.id,
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '10:00:00',
            is_active: true
        });

        // Crear un tipo de servicio de prueba
        testServiceType = await ServiceType.create({
            name: 'Limpieza Dental',
            description: 'Limpieza profesional de dientes',
            duration: 60,
            price: 50.00,
            is_active: true
        });
    });

    afterAll(async () => {
        // Limpiar después de los tests
        await Appointment.destroy({ where: {} });
        await GuestPatient.destroy({ where: {} });
        await Disponibilidad.destroy({ where: {} });
        await ServiceType.destroy({ where: {} });
        await User.destroy({ where: { role: 'dentist' } });
        await Especialidad.destroy({ where: {} });
    });

    describe('POST /api/appointments/guest', () => {
        it('debería crear una cita como invitado', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                disponibilidad_id: testDisponibilidad.id,
                service_type_id: testServiceType.id,
                notes: 'Primera visita'
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(201);

            expect(response.body.message).toBe('Cita creada exitosamente');
            expect(response.body.appointment.guest_patient_id).toBe(testGuestPatient.id);
            expect(response.body.appointment.disponibilidad_id).toBe(testDisponibilidad.id);
            expect(response.body.appointment.service_type_id).toBe(testServiceType.id);
            expect(response.body.appointment.status).toBe('pending');
            expect(response.body.appointment.appointment_type).toBe('guest');

            testAppointment = response.body.appointment;
        });

        it('debería rechazar crear cita sin paciente invitado', async () => {
            const appointmentData = {
                disponibilidad_id: testDisponibilidad.id,
                service_type_id: testServiceType.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(400);

            expect(response.body.error).toBe('ID de paciente, disponibilidad y tipo de servicio son obligatorios');
        });

        it('debería rechazar crear cita sin disponibilidad', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                service_type_id: testServiceType.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(400);

            expect(response.body.error).toBe('ID de paciente, disponibilidad y tipo de servicio son obligatorios');
        });

        it('debería rechazar crear cita sin tipo de servicio', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(400);

            expect(response.body.error).toBe('ID de paciente, disponibilidad y tipo de servicio son obligatorios');
        });

        it('debería rechazar crear cita con paciente inexistente', async () => {
            const appointmentData = {
                guest_patient_id: 99999,
                disponibilidad_id: testDisponibilidad.id,
                service_type_id: testServiceType.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Paciente invitado no encontrado');
        });

        it('debería rechazar crear cita con disponibilidad inexistente', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                disponibilidad_id: 99999,
                service_type_id: testServiceType.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Disponibilidad no encontrada');
        });

        it('debería rechazar crear cita con tipo de servicio inexistente', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                disponibilidad_id: testDisponibilidad.id,
                service_type_id: 99999
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Tipo de servicio no encontrado');
        });

        it('debería rechazar crear cita en disponibilidad ya reservada', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                disponibilidad_id: testDisponibilidad.id,
                service_type_id: testServiceType.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(400);

            expect(response.body.error).toBe('Esta disponibilidad ya está reservada');
        });
    });

    describe('GET /api/appointments/:id (protegido)', () => {
        it('debería obtener una cita por ID', async () => {
            const response = await request(app)
                .get(`/api/appointments/${testAppointment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.appointment.id).toBe(testAppointment.id);
            expect(response.body.appointment.guest_patient_id).toBe(testGuestPatient.id);
        });

        it('debería devolver 404 para cita inexistente', async () => {
            await request(app)
                .get('/api/appointments/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('debería rechazar acceso sin token', async () => {
            await request(app)
                .get(`/api/appointments/${testAppointment.id}`)
                .expect(401);
        });
    });

    describe('PATCH /api/appointments/:id/status (protegido - admin)', () => {
        it('debería actualizar el estado de una cita', async () => {
            const response = await request(app)
                .patch(`/api/appointments/${testAppointment.id}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'confirmed' })
                .expect(200);

            expect(response.body.message).toBe('Estado de cita actualizado exitosamente');
            expect(response.body.appointment.status).toBe('confirmed');
        });

        it('debería rechazar estado inválido', async () => {
            const response = await request(app)
                .patch(`/api/appointments/${testAppointment.id}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'invalid_status' })
                .expect(400);

            expect(response.body.error).toContain('Estado inválido');
        });

        it('debería devolver 404 para cita inexistente', async () => {
            await request(app)
                .patch('/api/appointments/99999/status')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'confirmed' })
                .expect(404);
        });
    });
}); 