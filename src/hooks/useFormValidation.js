import { useCallback, useMemo, useState } from "react";

import { validateFieldValue, validateFormValues } from "../utils/validationRules";

export function useFormValidation(schema = {}, initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (fieldName, nextValue) => {
      setValues((prev) => {
        const updated = { ...prev, [fieldName]: nextValue };
        if (errors[fieldName]) {
          const nextError = validateFieldValue(
            fieldName,
            nextValue,
            schema[fieldName],
            updated
          );
          setErrors((prevErrors) => {
            const draft = { ...prevErrors };
            if (nextError) {
              draft[fieldName] = nextError;
            } else {
              delete draft[fieldName];
            }
            return draft;
          });
        }
        return updated;
      });
    },
    [errors, schema]
  );

  const validateField = useCallback(
    (fieldName) => {
      const nextError = validateFieldValue(
        fieldName,
        values[fieldName],
        schema[fieldName],
        values
      );
      setErrors((prev) => {
        const draft = { ...prev };
        if (nextError) {
          draft[fieldName] = nextError;
        } else {
          delete draft[fieldName];
        }
        return draft;
      });
      return !nextError;
    },
    [schema, values]
  );

  const validate = useCallback(() => {
    const nextErrors = validateFormValues(schema, values);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [schema, values]);

  const resetForm = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
    },
    [initialValues]
  );

  const api = useMemo(
    () => ({
      values,
      errors,
      handleChange,
      setValues,
      setErrors,
      validateField,
      validate,
      resetForm,
      isValid: Object.keys(errors).length === 0,
    }),
    [errors, handleChange, resetForm, validate, validateField, values]
  );

  return api;
}

export default useFormValidation;
