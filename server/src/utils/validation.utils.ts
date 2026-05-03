import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Format validation errors in a readable way
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const error of errors) {
    const fieldName = error.property;
    const constraints = error.constraints ? Object.values(error.constraints) : [];
    formatted[fieldName] = constraints.map(c => c.toString());
  }
  
  return formatted;
}

/**
 * Validate a DTO class
 * Returns formatted errors or null if valid
 */
export async function validateDTO<T extends object>(dto: any, dtoClass: any): Promise<Record<string, string[]> | null> {
  const instance = plainToClass(dtoClass, dto) as T;
  const errors = await validate(instance as object, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false
  });

  if (errors.length > 0) {
    return formatValidationErrors(errors);
  }

  return null;
}

/**
 * Map FormData fields to DTO object
 * Extracts text fields and ignores files
 */
export function mapFormDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    // Skip file fields - they're handled separately by multer
    if (value instanceof File) {
      continue;
    }

    // Convert empty strings to undefined
    if (value === '') {
      obj[key] = undefined;
    } else {
      obj[key] = value;
    }
  }

  return obj;
}
