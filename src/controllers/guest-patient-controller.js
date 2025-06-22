const { GuestPatient } = require('../models/index');
const { Op } = require('sequelize');

// Crear un nuevo paciente invitado
const createGuestPatient = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        // Validaciones básicas
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Nombre y teléfono son obligatorios' 
            });
        }

        // Verificar si ya existe un paciente con ese email (si se proporciona)
        if (email) {
            const existingPatient = await GuestPatient.findOne({
                where: { email, is_active: true }
            });
            if (existingPatient) {
                return res.status(400).json({ 
                    error: 'Ya existe un paciente con ese email' 
                });
            }
        }

        // Crear el paciente invitado
        const guestPatient = await GuestPatient.create({
            name,
            phone,
            email: email || null,
            is_active: true
        });

        res.status(201).json({
            message: 'Paciente invitado creado exitosamente',
            patient: guestPatient
        });

    } catch (err) {
        console.error('Error al crear paciente invitado:', err);
        res.status(500).json({ 
            error: 'Error al crear paciente invitado', 
            details: err.message 
        });
    }
};

// Obtener todos los pacientes invitados (activos)
const getAllGuestPatients = async (req, res) => {
    try {
        const patients = await GuestPatient.findAll({
            where: { is_active: true },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            patients,
            count: patients.length
        });

    } catch (err) {
        console.error('Error al obtener pacientes invitados:', err);
        res.status(500).json({ 
            error: 'Error al obtener pacientes invitados', 
            details: err.message 
        });
    }
};

// Obtener un paciente invitado por ID
const getGuestPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await GuestPatient.findOne({
            where: { id, is_active: true }
        });

        if (!patient) {
            return res.status(404).json({ 
                error: 'Paciente invitado no encontrado' 
            });
        }

        res.json({ patient });

    } catch (err) {
        console.error('Error al obtener paciente invitado:', err);
        res.status(500).json({ 
            error: 'Error al obtener paciente invitado', 
            details: err.message 
        });
    }
};

// Buscar pacientes invitados por nombre o email
const searchGuestPatients = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                error: 'La búsqueda debe tener al menos 2 caracteres' 
            });
        }

        const patients = await GuestPatient.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { name: { [Op.iLike]: `%${query}%` } },
                    { email: { [Op.iLike]: `%${query}%` } }
                ]
            },
            order: [['name', 'ASC']],
            limit: 10
        });

        res.json({
            patients,
            count: patients.length
        });

    } catch (err) {
        console.error('Error al buscar pacientes invitados:', err);
        res.status(500).json({ 
            error: 'Error al buscar pacientes invitados', 
            details: err.message 
        });
    }
};

// Actualizar un paciente invitado
const updateGuestPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email } = req.body;

        const patient = await GuestPatient.findOne({
            where: { id, is_active: true }
        });

        if (!patient) {
            return res.status(404).json({ 
                error: 'Paciente invitado no encontrado' 
            });
        }

        // Verificar si el email ya existe en otro paciente
        if (email && email !== patient.email) {
            const existingPatient = await GuestPatient.findOne({
                where: { 
                    email, 
                    is_active: true,
                    id: { [Op.ne]: id }
                }
            });
            if (existingPatient) {
                return res.status(400).json({ 
                    error: 'Ya existe otro paciente con ese email' 
                });
            }
        }

        // Actualizar el paciente
        await patient.update({
            name: name || patient.name,
            phone: phone || patient.phone,
            email: email !== undefined ? email : patient.email
        });

        res.json({
            message: 'Paciente invitado actualizado exitosamente',
            patient
        });

    } catch (err) {
        console.error('Error al actualizar paciente invitado:', err);
        res.status(500).json({ 
            error: 'Error al actualizar paciente invitado', 
            details: err.message 
        });
    }
};

// Desactivar un paciente invitado (soft delete)
const deactivateGuestPatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await GuestPatient.findOne({
            where: { id, is_active: true }
        });

        if (!patient) {
            return res.status(404).json({ 
                error: 'Paciente invitado no encontrado' 
            });
        }

        await patient.update({ is_active: false });

        res.json({
            message: 'Paciente invitado desactivado exitosamente'
        });

    } catch (err) {
        console.error('Error al desactivar paciente invitado:', err);
        res.status(500).json({ 
            error: 'Error al desactivar paciente invitado', 
            details: err.message 
        });
    }
};

module.exports = {
    createGuestPatient,
    getAllGuestPatients,
    getGuestPatientById,
    searchGuestPatients,
    updateGuestPatient,
    deactivateGuestPatient
}; 