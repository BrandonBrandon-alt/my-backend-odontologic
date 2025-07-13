const Joi = require('joi');

const dentistsDto = Joi.object({
    id: Joi.number().integer().required(),
    id_number: Joi.string().required(),
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    role: Joi.string().valid('dentist').required(),
    status: Joi.string().valid('active', 'locked', 'inactive').required(),
});

module.exports = dentistsDto;
