import { REGEX, validateFieldValue, validateFormValues } from "./validationRules";

describe("validationRules", () => {
  it("exposes expected regex patterns", () => {
    expect(REGEX.email.test("user@example.com")).toBe(true);
    expect(REGEX.password.test("Aa123456!")).toBe(true);
    expect(REGEX.name.test("Jane Doe")).toBe(true);
    expect(REGEX.phone.test("+61400111222")).toBe(true);
  });

  it("validates required + email format", () => {
    const schema = [
      { required: true, message: "Email required" },
      { type: "email" },
    ];

    expect(validateFieldValue("email", "", schema, {})).toBe("Email required");
    expect(validateFieldValue("email", "abc", schema, {})).toContain("valid email");
    expect(validateFieldValue("email", "ok@mail.com", schema, {})).toBeNull();
  });

  it("validates matching fields", () => {
    const schema = { matchesField: "password", message: "Passwords do not match" };

    expect(
      validateFieldValue("confirmPassword", "abc", schema, { password: "xyz" })
    ).toBe("Passwords do not match");
    expect(
      validateFieldValue("confirmPassword", "abc", schema, { password: "abc" })
    ).toBeNull();
  });

  it("validates full form and returns keyed errors", () => {
    const schema = {
      name: { required: true, type: "name" },
      phone: { required: true, type: "phone" },
      age: { min: 18, message: "Must be adult" },
    };
    const errors = validateFormValues(schema, {
      name: "123",
      phone: "abc",
      age: 16,
    });

    expect(errors).toEqual({
      name: expect.any(String),
      phone: expect.any(String),
      age: "Must be adult",
    });
  });
});
