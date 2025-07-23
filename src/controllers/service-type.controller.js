const serviceTypeService = require("../services/service-type.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAll = asyncHandler(async (req, res, next) => {
  const data = await serviceTypeService.getAll();
  res.status(200).json(data);
});

const getBySpecialty = asyncHandler(async (req, res, next) => {
  const { specialtyId } = req.params;
  const data = await serviceTypeService.getBySpecialty(specialtyId);
  res.status(200).json(data);
});

const getById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = await serviceTypeService.getById(id);
  res.status(200).json(data);
});

const create = asyncHandler(async (req, res, next) => {
  const result = await serviceTypeService.create(req.body);
  res.status(201).json(result);
});

const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await serviceTypeService.update(id, req.body);
  res.status(200).json(result);
});

const deactivate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await serviceTypeService.deactivate(id);
  res.status(200).json(result);
});

module.exports = {
  getAll,
  getBySpecialty,
  getById,
  create,
  update,
  deactivate,
};
