const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function getImageValidationError(selectedFile: File): string {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(selectedFile.type))
    return "Formato no permitido. Usa JPG, PNG, WEBP o GIF.";

  if (selectedFile.size > MAX_IMAGE_FILE_SIZE_BYTES)
    return "La imagen debe pesar máximo 5MB.";

  return "";
}
