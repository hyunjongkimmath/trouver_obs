

/**
 * Sanitize the given filename
 * @param {string} name 
 * @returns 
 */

export function sanitizeFilename(
      name: string,
      replace_spaces_with_underscore: boolean = true
    ): string {
    // Remove or replace invalid characters
    let sanitized = name.replace(/[\\/:*?"<>|]/g, '');
    
    // Replace spaces with underscores
    if (replace_spaces_with_underscore){
      sanitized = sanitized.replace(/\s+/g, '_');
    }
    
    // Trim the filename to a reasonable length (e.g., 100 characters)
    // sanitized = sanitized.slice(0, 100);
    
    // Remove leading and trailing periods and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // If the sanitized name is empty, return null
    return sanitized || null;
  }