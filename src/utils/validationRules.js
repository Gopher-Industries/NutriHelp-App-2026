export const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]).{8,64}$/,
  name: /^[A-Za-z][A-Za-z\s'-]{1,79}$/,
  phone: /^\+?[1-9]\d{7,14}$/,
  otp: /^\d{4,8}$/,
};

export const VALIDATION_MESSAGES = {
  required: "This field is required.",
  email: "Please enter a valid email address.",
  password:
    "Password must be 8-64 chars with uppercase, lowercase, number, and special character.",
  name: "Name can contain letters, spaces, apostrophes, and hyphens only.",
  phone: "Please enter a valid phone number.",
  otp: "Please enter a valid verification code.",
};

function toRuleArray(fieldSchema) {
  if (!fieldSchema) {
    return [];
  }
  return Array.isArray(fieldSchema) ? fieldSchema : [fieldSchema];
}

function normalizeValue(value) {
  return value === undefined || value === null ? "" : value;
}

function isEmpty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function resolveMessage(rule, fallback) {
  if (typeof rule?.message === "string" && rule.message.trim()) {
    return rule.message;
  }
  return fallback;
}

function applyObjectRule(rule, value, allValues) {
  if (rule.required && isEmpty(value)) {
    return resolveMessage(rule, VALIDATION_MESSAGES.required);
  }

  if (isEmpty(value) && !rule.required) {
    return null;
  }

  const normalized = normalizeValue(value);

  if (rule.type && REGEX[rule.type]) {
    if (!REGEX[rule.type].test(String(normalized))) {
      return resolveMessage(rule, VALIDATION_MESSAGES[rule.type] || "Invalid value.");
    }
  }

  if (rule.pattern && !rule.pattern.test(String(normalized))) {
    return resolveMessage(rule, "Invalid format.");
  }

  if (rule.minLength && String(normalized).length < rule.minLength) {
    return resolveMessage(rule, `Must be at least ${rule.minLength} characters.`);
  }

  if (rule.maxLength && String(normalized).length > rule.maxLength) {
    return resolveMessage(rule, `Must be no more than ${rule.maxLength} characters.`);
  }

  if (rule.min !== undefined && Number(normalized) < rule.min) {
    return resolveMessage(rule, `Must be at least ${rule.min}.`);
  }

  if (rule.max !== undefined && Number(normalized) > rule.max) {
    return resolveMessage(rule, `Must be no more than ${rule.max}.`);
  }

  if (rule.matchesField) {
    const otherValue = allValues?.[rule.matchesField];
    if (normalized !== normalizeValue(otherValue)) {
      return resolveMessage(rule, `Must match ${rule.matchesField}.`);
    }
  }

  if (typeof rule.custom === "function") {
    const customResult = rule.custom(normalized, allValues);
    if (customResult === false) {
      return resolveMessage(rule, "Invalid value.");
    }
    if (typeof customResult === "string" && customResult.trim()) {
      return customResult;
    }
  }

  return null;
}

export function validateFieldValue(fieldName, value, fieldSchema, allValues = {}) {
  const rules = toRuleArray(fieldSchema);

  for (const rule of rules) {
    let error = null;

    if (typeof rule === "function") {
      const result = rule(value, allValues, fieldName);
      if (result === false) {
        error = "Invalid value.";
      } else if (typeof result === "string" && result.trim()) {
        error = result;
      }
    } else if (typeof rule === "string" && REGEX[rule]) {
      if (!REGEX[rule].test(String(normalizeValue(value)))) {
        error = VALIDATION_MESSAGES[rule] || "Invalid value.";
      }
    } else if (rule && typeof rule === "object") {
      error = applyObjectRule(rule, value, allValues);
    }

    if (error) {
      return error;
    }
  }

  return null;
}

export function validateFormValues(schema = {}, values = {}) {
  const errors = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const error = validateFieldValue(fieldName, values[fieldName], fieldSchema, values);
    if (error) {
      errors[fieldName] = error;
    }
  }
  return errors;
}

export default {
  REGEX,
  VALIDATION_MESSAGES,
  validateFieldValue,
  validateFormValues,
};
