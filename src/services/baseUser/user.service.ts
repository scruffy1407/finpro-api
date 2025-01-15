import { PrismaClient, RoleType } from "@prisma/client";
import cloudinary from "../../config/cloudinary";
import fs from "fs";
import path from "path";

export class UserService {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async validateJobHunter(user_id: number, jobHunterId?: number) {
		try {
			const user = await this.prisma.baseUsers.findUnique({
				where: {
					user_id: user_id,
				},
				include: {
					jobHunter: true,
				},
			});
			if (!user) {
				return {
					success: false,
					message: "Cannot find user",
					data: null,
				};
			}
			if (jobHunterId) {
				if (user?.jobHunter[0].job_hunter_id !== jobHunterId) {
					return {
						success: false,
						message:
							"User are not authorized to create/edit working experience",
						data: null,
					};
				}
			}

			return {
				success: true,
				message: "User available",
				data: user,
			};
		} catch (e) {
			return {
				success: false,
				message: "Something went wrong",
				data: null,
			};
		}
	}

	async uploadImage(userRole: RoleType, image: string) {
		try {
			const uploadImage = await cloudinary.uploader.upload(image, {
				folder: userRole === RoleType.company ? "Company" : "Job Hunter",
			});
			return {
				success: true,
				data: uploadImage.secure_url,
			};
		} catch (e) {
			return {
				success: false,
				message: "Failed to upload image",
			};
		}
	}

	async uploadBadge(userRole: RoleType, badge: string) {
		try {
			let uploadResult;

			// Check if badge is a file path or Base64 string
			if (fs.existsSync(badge)) {
				// Handle local file path
				uploadResult = await cloudinary.uploader.upload(badge, {
					folder: userRole === RoleType.developer ? "developer" : "company",
				});
			} else {
				// Assume it's a Base64 string
				uploadResult = await cloudinary.uploader.upload(
					`data:image/png;base64,${badge}`,
					{
						folder: userRole === RoleType.developer ? "developer" : "company",
					}
				);
			}

			return {
				success: true,
				data: uploadResult.secure_url,
			};
		} catch (e) {
			console.error("Cloudinary Upload Error:", e);
			return {
				success: false,
				message: "Failed to upload image",
			};
		}
	}
}
