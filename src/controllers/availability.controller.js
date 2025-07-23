const availabilityService = require('../services/availability.service');

// A helper to wrap async functions for cleaner error handling
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const getAll = asyncHandler(async (req, res, next) => {
    const data = await availabilityService.getAll();
    res.status(200).json(data);
});

const getBySpecialty = asyncHandler(async (req, res, next) => {
    const { specialtyId } = req.params;
    const data = await availabilityService.getBySpecialty(specialtyId);
    res.status(200).json(data);
});

const getByDentist = asyncHandler(async (req, res, next) => {
    const { dentistId } = req.params;
    const data = await availabilityService.getByDentist(dentistId);
    res.status(200).json(data);
});

const getById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const data = await availabilityService.getById(id);
    res.status(200).json(data);
});

const create = asyncHandler(async (req, res, next) => {
    const result = await availabilityService.create(req.body);
    res.status(201).json(result);
});

const update = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await availabilityService.update(id, req.body);
    res.status(200).json(result);
});

const deactivate = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await availabilityService.deactivate(id);
    res.status(200).json(result);
});

module.exports = {
    getAll,
    getBySpecialty,
    getByDentist,
    getById,
    create,
    update,
    deactivate
};
