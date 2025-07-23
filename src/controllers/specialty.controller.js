const specialtyService = require("../services/specialty.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAll = asyncHandler(async (req, res, next) => {
  const data = await specialtyService.getAll();
  res.status(200).json(data);
});

const getById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = await specialtyService.getById(id);
  res.status(200).json(data);
});

const create = asyncHandler(async (req, res, next) => {
  const result = await specialtyService.create(req.body);
  res.status(201).json(result);
});

const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await specialtyService.update(id, req.body);
  res.status(200).json(result);
});

const deactivate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await specialtyService.deactivate(id);
  res.status(200).json(result);
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
};
