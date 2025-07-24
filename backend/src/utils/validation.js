const Joi = require("joi");

const registerCompanySchema = Joi.object({
  companyName: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  businessLicense: Joi.string().max(255).optional(),
  companySize: Joi.string().valid("1-10", "11-50", "51-200", "200+").required(),
  adminName: Joi.string().min(2).max(255).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const userInviteSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid("employee", "company_admin").default("employee"),
});

const destinationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  country: Joi.string().min(2).max(100).required(),
  region: Joi.string().min(2).max(100).required(),
  overview: Joi.string().max(2000).optional(),
  bestTimeToVisit: Joi.string().max(1000).optional(),
  visaRules: Joi.string().max(1000).optional(),
});

const quizSchema = Joi.object({
  destinationId: Joi.number().integer().positive().optional(),
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().max(1000).optional(),
  difficulty: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("intermediate"),
  passingScore: Joi.number().integer().min(0).max(100).default(70),
  timeLimit: Joi.number().integer().min(60).max(3600).default(600),
  questions: Joi.array()
    .items(
      Joi.object({
        questionText: Joi.string().min(10).max(1000).required(),
        questionType: Joi.string()
          .valid("multiple_choice", "true_false", "scenario")
          .required(),
        options: Joi.array().items(Joi.string()).min(2).max(6).required(),
        correctAnswer: Joi.alternatives()
          .try(Joi.number().integer().min(0), Joi.boolean())
          .required(),
        explanation: Joi.string().max(500).optional(),
        points: Joi.number().integer().min(1).max(10).default(1),
      })
    )
    .min(1)
    .required(),
});

const submissionSchema = Joi.object({
  destinationId: Joi.number().integer().positive().required(),
  submissionType: Joi.string()
    .valid("new_destination", "update_existing", "new_content")
    .required(),
  fieldName: Joi.string().max(100).optional(),
  oldContent: Joi.string().max(5000).optional(),
  newContent: Joi.string().max(5000).required(),
  notes: Joi.string().max(1000).optional(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    next();
  };
};

// Validation functions for backward compatibility
const registerValidation = (data) => registerCompanySchema.validate(data);
const loginValidation = (data) => loginSchema.validate(data);

module.exports = {
  validate,
  registerCompanySchema,
  loginSchema,
  userInviteSchema,
  destinationSchema,
  quizSchema,
  submissionSchema,
  registerValidation,
  loginValidation,
};
