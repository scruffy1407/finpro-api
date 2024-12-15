import axios from "axios";
import * as dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

let ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

async function refreshAccessToken() {
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
    const newAccessToken = response.data.access_token;
    ACCESS_TOKEN = newAccessToken;
    console.log("New Access Token:", newAccessToken);
  } catch (error) {
    console.error("Error refreshing token");
  }
}

cron.schedule("59 * * * *", () => {
  console.log("Refreshing Dropbox Access Token...");
  refreshAccessToken();
});

export { ACCESS_TOKEN };
