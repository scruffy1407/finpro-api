import { PrismaClient } from "@prisma/client";
import { Application, ApplicationStatus } from "../models/models";
import { Dropbox } from "dropbox";
import { DropboxTokenManager } from "../utils/dropboxRefreshToken";

export class ApplyJobTest {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	// Method for uploading the resume to Dropbox
	async uploadResumeToDropbox(
		file: Express.Multer.File
	): Promise<string | undefined> {
		try {
			const tokenManager = DropboxTokenManager.getInstance();
			const accessToken = tokenManager.getAccessToken();
			const dbx = new Dropbox({ accessToken });
			const dropboxResponse = await dbx.filesUpload({
				path: `/resumes/${file.originalname}_${Date.now()}`,
				contents: file.buffer,
			});
			const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
				path: dropboxResponse.result.path_display!,
			});

			return sharedLinkResponse.result.url;
		} catch (error) {
			return "Failed to upload Resume File";
		}
	}

	// **New method for editing an application**
	async editApplication(
		applicationId: number,
		expected_salary: string,
		file: Express.Multer.File | undefined,
		accessToken: string
	) {
		try {
			// Retrieve the existing application
			const application = await this.prisma.application.findUnique({
				where: { application_id: applicationId },
				include: { resultPreSelection: true },
			});

			if (!application) {
				return { error: "Application not found." };
			}

			// Check if pre-selection test is passed
			const preSelectionPassed = application.resultPreSelection.some(
				(result) => result.completion_status === "pass"
			);

			if (!preSelectionPassed) {
				return { error: "Pre-selection test not passed." };
			}

			// Check if the application status is 'waitingSubmission' before editing
			if (
				application.application_status !== ApplicationStatus.waitingSubmission
			) {
				return { error: "Application is not in 'waiting submission' state." };
			}

			// Ensure that a new resume file is uploaded
			if (!file) {
				return { error: "Uploading a resume file is mandatory." };
			}

			// Upload the new resume file to Dropbox
			const resumeUrl = await this.uploadResumeToDropbox(file);

			// Update the application with new expected salary and resume
			const updatedApplication = await this.prisma.application.update({
				where: { application_id: applicationId },
				data: {
					expected_salary: expected_salary,
					resume: resumeUrl,
					application_status: ApplicationStatus.ON_REVIEW, // Example: change status after editing
				},
			});

			return { success: true, updatedApplication };
		} catch (error) {
			return { error: "Failed to edit the application, please try again" };
		}
	}
}
