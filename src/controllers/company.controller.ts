import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { CompanyService } from "../services/company.service";

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  async createJob(req: Request, res: Response): Promise<void> {
    try {
      const {
        job_title,
        preSelectionTestId,
        categoryId,
        selection_test_active,
        salary_show,
        salary_min,
        salary_max,
        job_description,
        job_experience_min,
        job_experience_max,
        expired_date,
        status,
        job_type,
        job_space,
      } = req.body;

      // Extract token from the Authorization header
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        // If no token, respond with a 400 error and exit
        res.status(400).json({ error: "Token is required" });
        return; // Ensure we stop further execution
      }

      const modifiedPreSelectionTestId = selection_test_active
        ? preSelectionTestId
        : null;

      // Prepare the job data for service
      const jobPostData = {
        job_title,
        preSelectionTestId: modifiedPreSelectionTestId,
        selection_test_active,
        categoryId,
        salary_show,
        salary_min,
        salary_max,
        job_description,
        job_experience_min,
        job_experience_max,
        expired_date: new Date(expired_date),
        status,
        job_type,
        job_space,
      };

      // Call the service to create the job post, passing the token as a string
      const jobPost = await this.companyService.createJob(jobPostData, token);

      // Return success response with created job post
      res.status(201).json({ jobPost });
    } catch (error) {
      const err = error as Error;
      console.error("Error creating job post:", error);
      // Return error response with message
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const jobId = parseInt(req.params.jobId); // Extract jobId from URL parameters

      // Validate jobId
      if (isNaN(jobId)) {
        res.status(400).json({ error: "Invalid jobId" });
        return;
      }

      // Call the service to delete the job post
      const result = await this.companyService.deleteJob(jobId);

      // If deletion was successful, return a success message
      if (result.success) {
        res
          .status(200)
          .json({ status: res.statusCode, message: result.message });
      } else {
        // If there were related applications, return an error message
        res.status(400).json({ status: res.statusCode, error: result.message });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error deleting job post:", error);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  async updateJob(req: Request, res: Response): Promise<void> {
    try {
      // Extract jobId from URL parameters
      const jobId = parseInt(req.params.jobId);

      // Validate jobId
      if (isNaN(jobId)) {
        res.status(400).json({ error: "Invalid jobId" });
        return;
      }

      // Extract the job post data from the request body
      const {
        job_title,
        preSelectionTestId,
        categoryId,
        selection_test_active,
        salary_show,
        salary_min,
        salary_max,
        job_description,
        job_experience_min,
        job_experience_max,
        expired_date,
        status,
        job_type,
        job_space,
      } = req.body;

      const modifiedPreSelectionTestId = selection_test_active
        ? preSelectionTestId
        : null;

      // Prepare the job data for service
      const jobPostData = {
        job_title,
        preSelectionTestId: modifiedPreSelectionTestId,
        categoryId,
        selection_test_active,
        salary_show,
        salary_min,
        salary_max,
        job_description,
        job_experience_min,
        job_experience_max,
        expired_date: new Date(expired_date),
        status,
        job_type,
        job_space,
      };

      // Call the service to update the job post
      const updatedJobPost = await this.companyService.updateJob(
        jobId,
        jobPostData,
      );

      // If job post was updated, return it
      if (typeof updatedJobPost !== "string") {
        res.status(200).json({ updatedJobPost });
      } else {
        // If an error message is returned (e.g., job post not found), return the message
        res.status(400).json({ error: updatedJobPost });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error updating job post:", error);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  // Controller method to handle the fetching of the latest job posts
  async jobNewLanding(req: Request, res: Response): Promise<void> {
    try {
      // Call the service method to get the latest job posts
      const latestJobPosts = await this.companyService.jobNewLanding();

      // Send the response back to the client
      if (latestJobPosts.error) {
        res.status(500).json({ error: latestJobPosts.error });
      } else {
        res.status(200).json(latestJobPosts);
      }
    } catch (error) {
      console.error("Error in getNewJobPosts controller:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching job posts." });
    }
  }

  // New method to get job posts with pagination
  // Controller method to handle the job search with pagination
  async getJobPosts(req: Request, res: Response): Promise<void> {
    // Destructure all query parameters, including new ones for filtering and sorting
    const {
      page = 1,
      limit = 15,
      job_title,
      categoryId,
      jobType,
      jobSpace,
      dateRange,
      sortOrder,
      companyCity,
      companyProvince,
    } = req.query;

    try {
      // Call the service method with the appropriate parameters, passing the new ones as well
      const jobPosts = await this.companyService.getJobPosts(
        Number(page), // Page number (default is 1)
        Number(limit), // Limit per page (default is 15)
        job_title as string, // Job title filter (optional)
        categoryId ? Number(categoryId) : undefined, // Category filter (optional)
        jobType as string, // Job type filter (optional)
        jobSpace as string, // Job space filter (optional)
        dateRange as string, // Date range filter (optional)
        sortOrder as "asc" | "desc", // Sort order for alphabetical sorting or date sorting
        companyCity as string,
        companyProvince as string,
      );

      // Return the result to the client
      res.json(jobPosts);
    } catch (err) {
      const error = err as Error;
      // In case of any errors, send a 500 response with the error message
      res
        .status(500)
        .json({ error: "Error fetching job posts: " + error.message });
    }
  }

  // Method to fetch Job Post details by Job ID
  // async getJobPostDetail(req: Request, res: Response): Promise<void> {
  //   const jobId = parseInt(req.params.jobId); // Get jobId from URL params
  //
  //   if (isNaN(jobId)) {
  //     res.status(400).send({ message: "Invalid jobId" });
  //   }
  //
  //   try {
  //     // Call the service method to get job post details
  //     const jobPostDetail = await this.companyService.getJobPostDetail(jobId);
  //
  //     // Check if there was an error or no data
  //     if (jobPostDetail.error || jobPostDetail.message) {
  //       res
  //         .status(404)
  //         .send({ message: jobPostDetail.message || jobPostDetail.error });
  //     } else {
  //       res.status(200).send(jobPostDetail); //  the job post details
  //     }
  //   } catch (error) {
  //     const err = error as Error;
  //     res.status(500).send({
  //       message: "An error occurred while fetching the job post details",
  //       error: err.message,
  //     });
  //   }
  // }
  async getJobPostDetail(req: Request, res: Response): Promise<void> {
    const jobId = parseInt(req.params.jobId);

    if (isNaN(jobId)) {
      res.status(400).send({ message: "Invalid jobId" });
      return; // Important: Return after sending the first response
    }

    try {
      const jobPostDetail = await this.companyService.getJobPostDetail(jobId);

      if (jobPostDetail.error || jobPostDetail.message) {
        res.status(404).send({
          message: jobPostDetail.message || jobPostDetail.error,
        });
        return; // Important: Return after sending the first response
      }

      res.status(200).send(jobPostDetail);
    } catch (error) {
      const err = error as Error;
      res.status(500).send({
        message: "An error occurred while fetching the job post details",
        error: err.message,
      });
    }
  }

  async getCategory(req: Request, res: Response) {
    try {
      const categories = await this.companyService.getCategory();

      if (categories) {
        res
          .status(200)
          .json({ data: categories || "Error fetching Categories" });
      } else {
        res.status(500).json({ message: "No Categories Found" });
      }
    } catch (error) {
      const err = error as Error;
      res
        .status(500)
        .json({ message: "An unexpected error occurred: " + err.message });
    }
  }
  async getDetailCompanyPage(req: Request, res: Response) {
    try {
      const companyId = req.params.companyId;
      const response = await this.companyService.getDetailCompanyPage(
        Number(companyId),
      );
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.companyResponse,
          count: response.count,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: response.message,
        });
      }
    } catch (e) {
      res.status(500).send({
        status: res.statusCode,
        message: e,
      });
    }
  }

  async getCompanyList(req: Request, res: Response) {
    const {
      page = 1,
      limit = 12,
      companyName,
      companyCity,
      companyProvince,
      hasJob = false,
    } = req.query;
    try {
      const response = await this.companyService.getCompanyList(
        companyName as string,
        companyCity as string,
        companyProvince as string,
        Number(limit),
        Number(page),
      );
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
          message: response.message,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: response.message || "No Response",
        });
      }
    } catch (e) {
      res.status(500).send({
        status: res.statusCode,
        message: e,
      });
    }
  }

  //   async getCompanyList(req: Request, res: Response) {
  //     const {
  //       page = 1,
  //       limit = 12,
  //       companyName,
  //       companyCity,
  //       companyProvince,
  //       hasJob = false,
  //     } = req.query;
  //     try {
  //       const response = await this.companyService.getCompanyList(
  //         companyName as string,
  //         companyCity as string,
  //         companyProvince as string,
  //         Number(limit),
  //         Number(page)
  //       );
  //       if (response.success) {
  //         res.status(200).send({
  //           status: res.statusCode,
  //           data: response.data,
  //           message: response.message,
  //         });
  //       } else {
  //         res.status(400).send({
  //           status: res.statusCode,
  //           message: response.message || "No Response",
  //         });
  //       }
  //     } catch (e) {
  //       res.status(500).send({
  //         status: res.statusCode,
  //         message: e,
  //       });
  //     }
  //   }

  async nearestJobs(req: Request, res: Response) {
    const { lat, lang } = req.query;

    try {
      const response = await this.companyService.nearestJobs(
        Number(lat),
        Number(lang),
      );
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: response.message,
        });
      }
    } catch (e: any) {
      res.status(500).send({
        status: res.statusCode,
        message: e.message || "Internal server error",
      });
    }
  }
}
