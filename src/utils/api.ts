import axios from "axios";

axios.defaults.baseURL = "https://kodepos.vercel.app";

export async function getLocationDetail(province: string, city: string) {

  try {
    const responseLocation = await axios.get(`/search/?q=${province} ${city}`);
    if (responseLocation.status === 200) {
      return {
        success: true,
        latitude: responseLocation.data[0].latitude,
        longitude: responseLocation.data[0].longitude,
        message: "Success get location data",
      };
    } else {
      return {
        success: false,
        latitude: 0,
        longitude: 0,
        message: "Failed to get location data",
      };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === "ECONNREFUSED") {
      return {
        success: false,
        message: "Failed to get location data due to network error",
        // ...
      };
    } else {
      // Handle other errors (e.g., from getLocationDetail)
      return {
        success: false,
        message: "Failed to get data",
        // ...
      };
    }
  }
}
