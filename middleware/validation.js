const Joi = require('joi');

// Issue validation schema
const issueSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  category: Joi.string().valid(
    'Pothole',
    'Broken Streetlight',
    'Garbage Dumping',
    'Waterlogging',
    'Broken Road',
    'Traffic Signal Issue',
    'Illegal Parking',
    'Noise Pollution',
    'Water Leakage',
    'Other'
  ).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(200).optional()
  }).required(),
  severity: Joi.number().integer().min(1).max(5).required(),
  userId: Joi.string().required()
});

// User validation schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  displayName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('citizen', 'admin', 'volunteer').default('citizen')
});

// Update issue validation schema
const updateIssueSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  category: Joi.string().valid(
    'Pothole',
    'Broken Streetlight',
    'Garbage Dumping',
    'Waterlogging',
    'Broken Road',
    'Traffic Signal Issue',
    'Illegal Parking',
    'Noise Pollution',
    'Water Leakage',
    'Other'
  ).optional(),
  severity: Joi.number().integer().min(1).max(5).optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved').optional()
});

// Validation middleware
const validateIssue = (req, res, next) => {
  const { error } = issueSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateUpdateIssue = (req, res, next) => {
  const { error } = updateIssueSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Query validation schemas
const querySchema = Joi.object({
  category: Joi.string().optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved').optional(),
  severity: Joi.number().integer().min(1).max(5).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  page: Joi.number().integer().min(1).default(1),
  sortBy: Joi.string().valid('timestamp', 'upvotes', 'severity').default('timestamp'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const validateQuery = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: error.details.map(detail => detail.message)
    });
  }
  req.query = value;
  next();
};

module.exports = {
  validateIssue,
  validateUser,
  validateUpdateIssue,
  validateQuery,
  issueSchema,
  userSchema,
  updateIssueSchema,
  querySchema
};
