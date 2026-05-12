/**
 * Formats a phone number string to: +62 XXX XXXX XXXX
 * @param {string} value - The raw input value
 * @returns {string} - The formatted value
 */
export const formatPhoneNumber = (value) => {
    if (!value) return value;

    // Clean all non-digit characters
    let cleaned = value.replace(/\D/g, '');

    // If it starts with 62, remove it temporarily to handle as local
    if (cleaned.startsWith('62')) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Now format: +62 [3] [4] [remainder]
    let result = '+62';
    
    if (cleaned.length > 0) {
        result += ' ' + cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
        result += ' ' + cleaned.substring(3, 7);
    }
    if (cleaned.length > 7) {
        result += ' ' + cleaned.substring(7, 13);
    }

    return result;
};
