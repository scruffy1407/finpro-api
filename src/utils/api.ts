import axios from "axios";

axios.defaults.baseURL = "https://kodepos.vercel.app";

export async function getLocationDetail(province: string, city: string) {
  console.log("tes");

  try {
    const responseLocation = await axios.get(`/search/?q=${province} ${city}`);
    console.log(responseLocation);
    if (responseLocation.status === 200) {
      console.log("execute");
      return {
        success: true,
        latitude: responseLocation.data[0].latitude,
        longitude: responseLocation.data[0].longitude,
        message: "Success get location data",
      };
    } else {
      console.log("execute false");
      return {
        success: false,
        latitude: 0,
        longitude: 0,
        message: "Failed to get location data",
      };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === "ECONNREFUSED") {
      // Handle network error (e.g., no internet connection)
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
