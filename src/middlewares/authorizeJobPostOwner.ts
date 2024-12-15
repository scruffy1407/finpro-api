// import { Request, Response, NextFunction } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export const authorizeJobPostOwner = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Ensure req.user is defined (check authentication)
//     if (!req.user) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }

//     // Extract the jobId from the URL parameters
//     const jobId = parseInt(req.params.jobId);

//     // Validate jobId
//     if (isNaN(jobId)) {
//       return res.status(400).json({ error: 'Invalid jobId' });
//     }

//     // Get the current logged-in user's userId from the authentication token
//     const userId = req.user.user_id;  // Assuming the user object has a user_id

//     // Fetch the user's company based on userId (the user is related to one company)
//     const userCompany = await prisma.company.findUnique({
//       where: {
//         userId: userId,  // Match the logged-in user with the company
//       },
//     });

//     // If no company found for this user, they are not authorized
//     if (!userCompany) {
//       return res.status(403).json({ error: 'User does not belong to any company' });
//     }

//     const companyId = userCompany.company_id;  // Get the company's ID

//     // Fetch the job post details from the database
//     const jobPost = await prisma.jobPost.findUnique({
//       where: {
//         job_id: jobId,
//       },
//     });

//     // If job post doesn't exist
//     if (!jobPost) {
//       return res.status(404).json({ error: 'Job post not found' });
//     }

//     // Check if the logged-in user's companyId matches the jobPost's companyId
//     if (jobPost.companyId !== companyId) {
//       return res.status(403).json({ error: 'You are not authorized to edit this job post' });
//     }

//     // If ownership matches, proceed to the next middleware/controller
//     next();
//   } catch (error) {
//     console.error('Error in authorizeJobPostOwner middleware:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };
