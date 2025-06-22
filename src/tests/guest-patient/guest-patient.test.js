const request = require('supertest');
const app = require('../../app');
const { GuestPatient } = require('../../models/index');

describe('GuestPatient API', () => {
    let testPatient;
    let authToken;

    beforeAll(async () => {
        // Limpiar la base de datos antes de los tests
        await GuestPatient.destroy({ where: {} });
        
        // Crear un token de autenticación para tests (simulado)
        authToken = 'test-token';
    });

    afterAll(async () => {
        // Limpiar después de los tests
        await GuestPatient.destroy({ where: {} });
    });

    describe('POST /api/guest-patients', () => {
        it('debería crear un nuevo paciente invitado', async () => {
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

            testPatient = response.body.patient;
        });

        it('debería crear un paciente sin email', async () => {
            const patientData = {
                name: 'María García',
                phone: '0987654321'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(201);

            expect(response.body.patient.email).toBeNull();
        });

        it('debería rechazar crear paciente sin nombre', async () => {
            const patientData = {
                phone: '1234567890'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(400);

            expect(response.body.error).toBe('Nombre y teléfono son obligatorios');
        });

        it('debería rechazar crear paciente sin teléfono', async () => {
            const patientData = {
                name: 'Pedro López'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(400);

            expect(response.body.error).toBe('Nombre y teléfono son obligatorios');
        });

        it('debería rechazar crear paciente con email duplicado', async () => {
            const patientData = {
                name: 'Otro Usuario',
                phone: '5555555555',
                email: 'juan@example.com' // Email ya existente
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(400);

            expect(response.body.error).toBe('Ya existe un paciente con ese email');
        });
    });

    describe('GET /api/guest-patients/search', () => {
        it('debería buscar pacientes por nombre', async () => {
            const response = await request(app)
                .get('/api/guest-patients/search?query=Juan')
                .expect(200);

            expect(response.body.patients.length).toBeGreaterThan(0);
            expect(response.body.patients[0].name).toContain('Juan');
        });

        it('debería buscar pacientes por email', async () => {
            const response = await request(app)
                .get('/api/guest-patients/search?query=juan@example.com')
                .expect(200);

            expect(response.body.patients.length).toBeGreaterThan(0);
            expect(response.body.patients[0].email).toBe('juan@example.com');
        });

        it('debería rechazar búsqueda con menos de 2 caracteres', async () => {
            const response = await request(app)
                .get('/api/guest-patients/search?query=a')
                .expect(400);

            expect(response.body.error).toBe('La búsqueda debe tener al menos 2 caracteres');
        });
    });

    describe('GET /api/guest-patients (protegido)', () => {
        it('debería obtener todos los pacientes activos', async () => {
            const response = await request(app)
                .get('/api/guest-patients')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.patients).toBeInstanceOf(Array);
            expect(response.body.count).toBeGreaterThan(0);
        });

        it('debería rechazar acceso sin token', async () => {
            await request(app)
                .get('/api/guest-patients')
                .expect(401);
        });
    });

    describe('GET /api/guest-patients/:id (protegido)', () => {
        it('debería obtener un paciente por ID', async () => {
            const response = await request(app)
                .get(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.patient.id).toBe(testPatient.id);
            expect(response.body.patient.name).toBe(testPatient.name);
        });

        it('debería devolver 404 para ID inexistente', async () => {
            await request(app)
                .get('/api/guest-patients/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/guest-patients/:id (protegido)', () => {
        it('debería actualizar un paciente', async () => {
            const updateData = {
                name: 'Juan Pérez Actualizado',
                phone: '1111111111'
            };

            const response = await request(app)
                .put(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.message).toBe('Paciente invitado actualizado exitosamente');
            expect(response.body.patient.name).toBe(updateData.name);
            expect(response.body.patient.phone).toBe(updateData.phone);
        });

        it('debería rechazar actualizar con email duplicado', async () => {
            // Crear otro paciente primero
            const otherPatient = await GuestPatient.create({
                name: 'Otro Paciente',
                phone: '2222222222',
                email: 'otro@example.com',
                is_active: true
            });

            const updateData = {
                email: 'juan@example.com' // Email del primer paciente
            };

            const response = await request(app)
                .put(`/api/guest-patients/${otherPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.error).toBe('Ya existe otro paciente con ese email');
        });
    });

    describe('DELETE /api/guest-patients/:id (protegido)', () => {
        it('debería desactivar un paciente', async () => {
            const response = await request(app)
                .delete(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.message).toBe('Paciente invitado desactivado exitosamente');

            // Verificar que el paciente ya no aparece en las búsquedas
            const searchResponse = await request(app)
                .get('/api/guest-patients/search?query=Juan')
                .expect(200);

            expect(searchResponse.body.patients.length).toBe(0);
        });
    });
}); 