export function formatDate(dateString: Date) {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`; // Output: "15 Jan 2024"
}

export function formatTime24Hour(dateString: Date) {
  const date = new Date(dateString);

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`; // Output: "10:30"
}

export function convertToDate(timeString: string, baseDate: string) {
  // Split the time string into hours and minutes
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create a new Date object with the base date
  const date = new Date(baseDate);

  // Set the hours and minutes
  date.setHours(hours, minutes, 0, 0); // Set seconds and milliseconds to 0

  return date;
}
