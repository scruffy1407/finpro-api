import { z as validate } from "zod";

export const jobSchema = validate.object({
	job_title: validate.string().min(1, "Job Title is required"),
	preSelectionTestId: validate.number().optional().nullable(),
	categoryId: validate.number(),
	selection_test_active: validate.boolean().optional(),
	salary_show: validate.boolean(),
	salary_min: validate.number().min(0, "Salary Min must be 0 or greater"),
	salary_max: validate
		.number()
		.min(0, "Salary Max must be 0 or greater")
		.optional()
		.nullable(),
	job_description: validate.string().min(1, "Job Description is required"),
	job_experience_min: validate
		.number()
		.min(0, "Job Experience Min must be 0 or greater"),
	job_experience_max: validate
		.number()
		.min(0, "Job Experience Max must be 0 or greater")
		.optional()
		.nullable(),
	expired_date: validate.date().refine((date) => date > new Date(), {
		message: "Expiration date must be in the future",
	}),
	status: validate.boolean(),
	job_type: validate
		.enum(["fulltime", "freelance", "internship"])
		.default("fulltime"),

	job_space: validate
		.enum(["remoteworking", "onoffice", "hybrid"])
		.default("onoffice"),
});
