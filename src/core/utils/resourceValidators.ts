// /src/utils/resourceValidators.ts
/**
 * Validates if a string is a valid image URL or path with options
 * @param input - The URL or path to validate
 * @param options - Validation options
 * @returns true if valid image URL/path, false otherwise
 */
export const isValidImageUrl = (
  input: string, 
  options: {
    allowedExtensions?: string[];
    allowDataUrls?: boolean;
    allowLocalPaths?: boolean;
    allowRelativePaths?: boolean;
  } = {}
): boolean => {
  if (!input || typeof input !== "string") {
    return false;
  }

  const {
    allowedExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"],
    allowDataUrls = true,
    allowLocalPaths = true,
    allowRelativePaths = true
  } = options;

  const trimmedInput = input.trim();

  // Check for data URLs
  if (allowDataUrls && trimmedInput.startsWith("data:image/")) {
    return /^data:image\/[a-zA-Z+]+;base64,/.test(trimmedInput);
  }

  // Create regex for allowed extensions
  const extensionPattern = new RegExp(
    `\\.(${allowedExtensions.join("|")})(?:\\?.*)?(?:#.*)?$`, 
    "i"
  );

  try {
    // Try to parse as URL
    const url = new URL(trimmedInput);
    
    // Check if protocol is allowed
    if (!["http:", "https:", "file:"].includes(url.protocol)) {
      return false;
    }

    // Check extension in pathname
    return extensionPattern.test(url.pathname);
  }
  catch {
    // Handle as local path
    if (!allowLocalPaths) {
      return false;
    }

    // Check if it"s a relative path and if allowed
    const isRelative = !trimmedInput.startsWith("/") && !trimmedInput.match(/^[a-zA-Z]:\\/); // Windows absolute path
    
    if (isRelative && !allowRelativePaths) {
      return false;
    }

    // Check extension
    return extensionPattern.test(trimmedInput);
  }
}

/**
 * Validates image URL by checking HTTP Content-Type header
 * @param url - The URL to validate
 * @returns Promise<boolean> - true if URL serves an image
 */
export const isValidImageUrlByContentType = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Validate URL format first
    new URL(url);
    
    const response = await fetch(url, { 
      method: 'HEAD', // Only fetch headers, not content
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
  } catch {
    return false;
  }
}

/**
 * Checks if string is a valid HTTP/HTTPS image URL
 */
export const isValidImageHttpUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "http:" || urlObj.protocol === "https:";
    const hasImageExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(?:\?.*)?(?:#.*)?$/i.test(urlObj.pathname);
    
    return isHttps && hasImageExtension;
  }
  catch {
    return false;
  }
}

/**
 * Checks if string is a valid data URL for images
 */
export const isValidImageDataUrl = (dataUrl: string): boolean => {
  if (!dataUrl || typeof dataUrl !== "string") {
    return false;
  }
  
  return /^data:image\/[a-zA-Z+]+;base64,/.test(dataUrl.trim());
}

/**
 * Checks if string is a valid local image path
 */
export const isValidImagePath = (path: string): boolean => {
  if (!path || typeof path !== "string") {
    return false;
  }
  
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i.test(path.trim());
}

/**
 * Comprehensive image URL/path validator
 */
export const isValidImage = (input: string): boolean => {
  return isValidImageHttpUrl(input) || isValidImageDataUrl(input) || isValidImagePath(input);
}

/**
 * Gets the image format from URL or path
 */
export const getImageFormat = (input: string): string | null => {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Handle data URLs
  if (input.startsWith("data:image/")) {
    const match = input.match(/^data:image\/([a-zA-Z+]+);/);
    return match ? match[1] : null;
  }

  // Handle regular URLs and paths
  const match = input.match(/\.([a-zA-Z]+)(?:\?.*)?(?:#.*)?$/i);
  return match ? match[1].toLowerCase() : null;
}

// Basic usage
// console.log(isValidImageUrl("https://example.com/image.jpg")); // true
// console.log(isValidImageUrl("https://example.com/image.png?v=1")); // true
// console.log(isValidImageUrl("./images/photo.gif")); // true
// console.log(isValidImageUrl("/assets/icon.svg")); // true
// console.log(isValidImageUrl("data:image/png;base64,iVBOR...")); // true
// console.log(isValidImageUrl("https://example.com/file.txt")); // false

// With options
// console.log(isValidImageUrl("image.jpg", {
//   allowLocalPaths: false,
//   allowRelativePaths: false
// })); // false

// console.log(isValidImageUrl("https://example.com/image.jpg", {
//   allowedExtensions: ["jpg", "png"]
// })); // true

// Individual validators
// console.log(isValidImageHttpUrl("https://example.com/image.jpg")); // true
// console.log(isValidImageDataUrl("data:image/png;base64,iVBOR...")); // true
// console.log(isValidImagePath("./image.png")); // true

// Get image format
// console.log(getImageFormat("image.jpg")); // "jpg"
// console.log(getImageFormat("data:image/png;base64,...")); // "png"

// Content-type check (async)
// isValidImageUrlByContentType(testUrl).then(result => {
//   console.log('Content-type based:', result); // likely true
// });
