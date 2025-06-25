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

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Paciente invitado creado exitosamente');
            expect(response.body.data.name).toBe(patientData.name);
            expect(response.body.data.phone).toBe(patientData.phone);
            expect(response.body.data.email).toBe(patientData.email);

            testPatient = response.body.data;
        });

        it('debería crear un paciente sin email', async () => {
            const patientData = {
                name: 'María García',
                phone: '9876543210'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBeNull();
        });

        it('debería rechazar crear paciente sin nombre', async () => {
            const patientData = {
                phone: '1234567890'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Datos de entrada inválidos');
            expect(response.body.errors).toBeDefined();
        });

        it('debería rechazar crear paciente sin teléfono', async () => {
            const patientData = {
                name: 'Pedro López'
            };

            const response = await request(app)
                .post('/api/guest-patients')
                .send(patientData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Datos de entrada inválidos');
            expect(response.body.errors).toBeDefined();
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
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Ya existe un paciente con este email');
        });
    });

    describe('GET /api/guest-patients/:id (protegido)', () => {
        it('debería obtener un paciente por ID', async () => {
            const response = await request(app)
                .get(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testPatient.id);
            expect(response.body.data.name).toBe(testPatient.name);
        });

        it('debería devolver 404 para ID inexistente', async () => {
            await request(app)
                .get('/api/guest-patients/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('debería rechazar acceso sin token', async () => {
            await request(app)
                .get(`/api/guest-patients/${testPatient.id}`)
                .expect(401);
        });
    });

    describe('PUT /api/guest-patients/:id (protegido)', () => {
        it('debería actualizar un paciente', async () => {
            const updateData = {
                name: 'Juan Pérez Actualizado',
                phone: '1111111111',
                email: 'juan@example.com' // Mantener el email original
            };

            const response = await request(app)
                .put(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Paciente invitado actualizado exitosamente');
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.phone).toBe(updateData.phone);
            expect(response.body.data.email).toBe(updateData.email);
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
                name: 'Otro Paciente',
                phone: '2222222222',
                email: 'juan@example.com' // Email del primer paciente
            };

            const response = await request(app)
                .put(`/api/guest-patients/${otherPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Ya existe otro paciente con este email');
        });

        it('debería rechazar acceso sin token', async () => {
            const updateData = {
                name: 'Test',
                phone: '1234567890'
            };

            await request(app)
                .put(`/api/guest-patients/${testPatient.id}`)
                .send(updateData)
                .expect(401);
        });
    });

    describe('DELETE /api/guest-patients/:id (protegido)', () => {
        it('debería desactivar un paciente', async () => {
            const response = await request(app)
                .delete(`/api/guest-patients/${testPatient.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Paciente invitado desactivado exitosamente');
        });

        it('debería rechazar acceso sin token', async () => {
            await request(app)
                .delete(`/api/guest-patients/${testPatient.id}`)
                .expect(401);
        });
    });
}); 