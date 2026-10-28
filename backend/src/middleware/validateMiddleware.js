const { ZodError } = require('zod');

/**
 * Validate request body, query, or params against a Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req[source]);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'root';
          formattedErrors[path] = err.message;
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};

module.exports = validate;
