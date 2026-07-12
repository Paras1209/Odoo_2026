/**
 * Shared validation utilities for consistent validation across controllers
 */

/**
 * Parse numeric value safely
 * @param {*} value - Value to parse
 * @returns {number|*} - Parsed number or original value if not parseable
 */
const parseNumericValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

/**
 * Validate string field
 * @param {Array} errors - Array to push errors to
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} minLength - Minimum string length
 * @param {number} maxLength - Maximum string length
 * @param {boolean} required - Whether field is required
 */
const validateStringField = (errors, value, fieldName, minLength, maxLength, required = true) => {
  const stringValue = String(value || '').trim();

  if (!stringValue) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return;
  }

  if (stringValue.length < minLength || stringValue.length > maxLength) {
    errors.push(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
  }
};

/**
 * Validate numeric field
 * @param {Array} errors - Array to push errors to
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} minimum - Minimum allowed value
 * @param {boolean} allowIntegerOnly - Whether only integers are allowed
 */
const validateNumericField = (errors, value, fieldName, minimum, allowIntegerOnly = false) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue < minimum || (allowIntegerOnly && !Number.isInteger(numericValue))) {
    const minimumText = minimum === 0 ? 'greater than or equal to 0' : `greater than or equal to ${minimum}`;
    const typeText = allowIntegerOnly ? 'positive integer' : `number ${minimumText}`;
    errors.push(`${fieldName} must be a ${typeText}`);
  }
};

/**
 * Validate enum field
 * @param {Array} errors - Array to push errors to
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {Array} allowedValues - Array of allowed values
 */
const validateEnumField = (errors, value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
};

/**
 * Validate date field
 * @param {Array} errors - Array to push errors to
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {boolean} required - Whether field is required
 */
const validateDateField = (errors, value, fieldName, required = true) => {
  if (!value) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return;
  }

  if (Number.isNaN(new Date(value).getTime())) {
    errors.push(`${fieldName} must be a valid date`);
  }
};

/**
 * Validate email field
 * @param {Array} errors - Array to push errors to
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {boolean} required - Whether field is required
 */
const validateEmailField = (errors, value, fieldName, required = true) => {
  const emailValue = String(value || '').trim();

  if (!emailValue) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue)) {
    errors.push(`${fieldName} must be a valid email address`);
  }
};

/**
 * Create a validation helper for conditional validation during updates
 * @param {boolean} isUpdate - Whether this is an update operation
 * @param {Object} payload - The data payload being validated
 * @returns {Function} - Function that checks if a field should be validated
 */
const createUpdateValidator = (isUpdate, payload) => {
  return (field) => !isUpdate || payload[field] !== undefined;
};

module.exports = {
  parseNumericValue,
  validateStringField,
  validateNumericField,
  validateEnumField,
  validateDateField,
  validateEmailField,
  createUpdateValidator
};
