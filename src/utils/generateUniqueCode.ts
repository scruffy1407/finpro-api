import { randomBytes } from "crypto";

export function generateTransactionCode(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Get last two digits of the year
  const month = ("0" + (now.getMonth() + 1)).slice(-2); // Pad month with leading zero
  const day = ("0" + now.getDate()).slice(-2); // Pad day with leading zero

  // Generate a random 5-character alphanumeric string
  const randomId = randomBytes(5).toString("hex").slice(0, 5);

  return `TRN-${year}${randomId}${month}${day}`;
}
