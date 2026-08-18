// /src/utils/stringFormatters.ts
import type { Address } from "@/core/types/user";

export const camelToCap = (input: string): string => {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2") // insert space before capital letters
    .replace(/^./, str => str.toUpperCase()) // capitalize the first letter
    .replace(/\b\w/g, str => str.toUpperCase()); // capitalize each word
}

export const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export const formatAddress = (address: Address): string => {
  const parts = [
    address.street,
    address.floor ? `Floor ${address.floor}` : "",
    address.room,
    address.building,
    address.road,
    address.subDistrict,
    address.district,
    `${address.province || ""} ${address.postalCode || ""}`,
    address.country,
    address.lat,
    address.lon
  ];

  return parts.filter(Boolean).join(", ");
}

export const isEnglish = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }
  // Remove numbers, spaces, and common punctuation
  const cleanText = text.replace(/[0-9\s.,!?;:'"()-]/g, "");
  if (cleanText.length === 0) {
    return true; // Only numbers and punctuation, assume English
  }
  // Check if the text contains mostly Latin characters (A-Z, a-z)
  const englishCharacters = cleanText.match(/[A-Za-z]/g);
  const englishRatio = englishCharacters ? englishCharacters.length / cleanText.length : 0;
  // Consider it English if 80% or more characters are Latin
  return englishRatio >= 0.8;
};

export const isValidJsonString = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  }
  catch {
    return false;
  }
}
