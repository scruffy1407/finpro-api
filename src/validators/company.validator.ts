import { z as validate } from "zod";


export const jobSchema = validate.object({
	job_title: validate.string().min(1, "Job Title is required"),
	preSelectionTestId: validate.number(),
	categoryId: validate.number(),
    selection_test_active : validate.boolean().optional(),
	salary_show: validate.boolean(),
	salary_min: validate.number().positive("Salary Min must be positive"),
	salary_max: validate.number().positive("Salary Min must be positive").optional(),
	job_description: validate.string().min(1, "Job Description is required"),
	job_experience_min: validate.number().positive("Salary Min must be positive"),
	job_experience_max: validate.number().positive("Salary Min must be positive").optional(),
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
