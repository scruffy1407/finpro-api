import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

export class DropboxTokenManager {
  private static instance: DropboxTokenManager;
  private accessToken: string = process.env.DROPBOX_ACCESS_TOKEN || "";

  private constructor() {}

  public static getInstance(): DropboxTokenManager {
    if (!DropboxTokenManager.instance) {
      DropboxTokenManager.instance = new DropboxTokenManager();
    }
    return DropboxTokenManager.instance;
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  public async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post(
        "https://api.dropbox.com/oauth2/token",
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: process.env.REFRESH_TOKEN,
            client_id: process.env.APP_KEY,
            client_secret: process.env.APP_SECRET,
          },
        }
      );

      this.accessToken = response.data.access_token;
      console.log("Access token refreshed:", this.accessToken);
    } catch (error : any) {
      console.error("Error refreshing Dropbox token:", error.message);
    }
  }
}

