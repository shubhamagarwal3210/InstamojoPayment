const Joi = require("joi");



module.exports.billing = Joi.object({
    buyer_name: Joi.string().min(3).required(),
    email: Joi.string().required(),
    phone: Joi.string().min(10).required(),
    amount: Joi.string().min(1).required(),
    purpose: Joi.string().min(3).required(),
});

