const { ApiError } = require('./errorHandler');

/**
 * Middleware to validate request data using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      return next();
    }

    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    next(new ApiError('Validation error', 400, errors));
  };
};

module.exports = {
  validate
};
