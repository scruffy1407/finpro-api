import axios from "axios";

axios.defaults.baseURL = "https://kodepos.vercel.app";

export async function getLocationDetail(province: string, city: string) {
  try {
    const responseLocation = await axios.get(`/search/q=${province}${city}`);
    console.log(responseLocation);
    if (responseLocation.status === 200 && responseLocation.data.length > 0) {
      return {
        success: true,
        latitude: responseLocation.data[0].latitude,
        longitude: responseLocation.data[0].longitude,
      };
    } else {
      return {
        success: false,
        latitude: 0,
        longitude: 0,
      };
    }
  } catch (e) {
    return {
      success: false,
      latitude: 0,
      longitude: 0,
      message: "Failed to get data",
    };
  }
}
