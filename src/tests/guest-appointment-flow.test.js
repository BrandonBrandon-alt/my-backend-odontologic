const request = require('supertest');
const app = require('../app');
const { Appointment, GuestPatient, Disponibilidad, ServiceType, User, Especialidad } = require('../models/index');

describe('Flujo Completo - Cita como Invitado', () => {
    let testGuestPatient;
    let testDisponibilidad;
    let testServiceType;
    let testEspecialidad;
    let testDentist;
    let testAppointment;

    beforeAll(async () => {
        // Limpiar la base de datos antes de los tests
        await Appointment.destroy({ where: {} });
        await GuestPatient.destroy({ where: {} });
        await Disponibilidad.destroy({ where: {} });
        await ServiceType.destroy({ where: {} });
        await User.destroy({ where: { role: 'dentist' } });
        await Especialidad.destroy({ where: {} });

        // Crear datos de prueba
        testDentist = await User.create({
            name: 'Dr. García',
            email: 'dr.garcia@example.com',
            password: 'password123',
            role: 'dentist',
            is_active: true
        });

        testEspecialidad = await Especialidad.create({
            name: 'Odontología General',
            description: 'Tratamientos generales de odontología',
            is_active: true
        });

        testServiceType = await ServiceType.create({
            name: 'Limpieza Dental',
            description: 'Limpieza profesional de dientes',
            especialidad_id: testEspecialidad.id,
            duration: 60,
            price: 50.00,
            is_active: true
        });

        testDisponibilidad = await Disponibilidad.create({
            dentist_id: testDentist.id,
            especialidad_id: testEspecialidad.id,
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '10:00:00',
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

    describe('Paso 1: Crear Paciente Invitado', () => {
        it('debería crear un paciente invitado exitosamente', async () => {
            const patientData = {
                name: 'Juan Pérez',
                phone: '1234567890',
                email: 'juan@example.com'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(201);

            expect(response.body.message).toBe('Paciente invitado creado exitosamente');
            expect(response.body.patient.name).toBe(patientData.name);
            expect(response.body.patient.phone).toBe(patientData.phone);
            expect(response.body.patient.email).toBe(patientData.email);
            expect(response.body.patient.is_active).toBe(true);

            testGuestPatient = response.body.patient;
        });

        it('debería rechazar crear paciente con datos inválidos', async () => {
            const invalidData = {
                name: 'A', // Muy corto
                phone: '123', // Muy corto
                email: 'invalid-email' // Email inválido
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toBe('Datos de entrada inválidos');
            expect(response.body.details).toContain('El nombre debe tener al menos 2 caracteres');
            expect(response.body.details).toContain('El teléfono debe tener al menos 7 caracteres');
            expect(response.body.details).toContain('El email debe tener un formato válido');
        });

        it('debería rechazar crear paciente sin nombre', async () => {
            const invalidData = {
                phone: '1234567890'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toBe('Datos de entrada inválidos');
            expect(response.body.details).toContain('El nombre es obligatorio');
        });
    });

    describe('Paso 2: Crear Cita como Invitado', () => {
        it('debería crear una cita como invitado exitosamente', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                especialidad_id: testEspecialidad.id,
                service_type_id: testServiceType.id,
                disponibilidad_id: testDisponibilidad.id,
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

        it('debería rechazar crear cita con datos inválidos', async () => {
            const invalidData = {
                guest_patient_id: 'invalid', // Debe ser número
                especialidad_id: -1, // Debe ser positivo
                service_type_id: 0, // Debe ser positivo
                disponibilidad_id: 'abc' // Debe ser número
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toBe('Datos de entrada inválidos');
            expect(response.body.details).toContain('El ID del paciente debe ser un número');
            expect(response.body.details).toContain('El ID de la especialidad debe ser positivo');
            expect(response.body.details).toContain('El ID del tipo de servicio debe ser positivo');
            expect(response.body.details).toContain('El ID de disponibilidad debe ser un número');
        });

        it('debería rechazar crear cita sin paciente invitado', async () => {
            const invalidData = {
                especialidad_id: testEspecialidad.id,
                service_type_id: testServiceType.id,
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toBe('Datos de entrada inválidos');
            expect(response.body.details).toContain('El ID del paciente es obligatorio');
        });

        it('debería rechazar crear cita con paciente inexistente', async () => {
            const appointmentData = {
                guest_patient_id: 99999,
                especialidad_id: testEspecialidad.id,
                service_type_id: testServiceType.id,
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Paciente invitado no encontrado');
        });

        it('debería rechazar crear cita con especialidad inexistente', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                especialidad_id: 99999,
                service_type_id: testServiceType.id,
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Especialidad no encontrada');
        });

        it('debería rechazar crear cita con tipo de servicio que no corresponde a la especialidad', async () => {
            // Crear otra especialidad
            const otraEspecialidad = await Especialidad.create({
                name: 'Ortodoncia',
                description: 'Alineación dental',
                is_active: true
            });

            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                especialidad_id: otraEspecialidad.id,
                service_type_id: testServiceType.id, // Este pertenece a Odontología General
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(404);

            expect(response.body.error).toBe('Tipo de servicio no encontrado o no corresponde a la especialidad seleccionada');
        });

        it('debería rechazar crear cita en disponibilidad ya reservada', async () => {
            const appointmentData = {
                guest_patient_id: testGuestPatient.id,
                especialidad_id: testEspecialidad.id,
                service_type_id: testServiceType.id,
                disponibilidad_id: testDisponibilidad.id
            };

            const response = await request(app)
                .post('/api/appointments/guest')
                .send(appointmentData)
                .expect(400);

            expect(response.body.error).toBe('Esta disponibilidad ya está reservada');
        });
    });

    describe('Flujo Completo - Validación de Integridad', () => {
        it('debería mantener la integridad de los datos en todo el flujo', async () => {
            // Verificar que el paciente invitado existe
            const patientResponse = await request(app)
                .get(`/api/guest-patients/${testGuestPatient.id}`)
                .set('Authorization', 'Bearer test-token')
                .expect(200);

            expect(patientResponse.body.patient.id).toBe(testGuestPatient.id);
            expect(patientResponse.body.patient.name).toBe('Juan Pérez');

            // Verificar que la cita existe y tiene los datos correctos
            const appointmentResponse = await request(app)
                .get(`/api/appointments/${testAppointment.id}`)
                .set('Authorization', 'Bearer test-token')
                .expect(200);

            expect(appointmentResponse.body.appointment.id).toBe(testAppointment.id);
            expect(appointmentResponse.body.appointment.guest_patient_id).toBe(testGuestPatient.id);
            expect(appointmentResponse.body.appointment.status).toBe('pending');
        });
    });
}); 