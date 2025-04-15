import { ZodError } from "zod";

export const formatZodErrors = (errors: ZodError) => {
    const formattedErrors: Record<string, string> = {};

    errors.errors.forEach((err) => {
        if (err.path.length > 0) {
            const fieldName = err.path.join('.');

            // Create user-friendly messages
            let message = err.message;
            if (err.code === 'invalid_type' && err.received === 'undefined') {
                message = `The field '${fieldName}' is required`;
            } else if (err.code === 'too_small') {
                message = `The field '${fieldName}' is too short`;
            } else if (err.code === 'too_big') {
                message = `The field '${fieldName}' is too long`;
            }

            formattedErrors[fieldName] = message;
        }
    });

    return formattedErrors;
};

