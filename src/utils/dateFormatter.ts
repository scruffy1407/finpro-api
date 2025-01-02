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
