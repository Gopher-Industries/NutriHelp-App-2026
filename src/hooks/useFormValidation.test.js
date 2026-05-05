import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useFormValidation } from "./useFormValidation";

function HookProbe({ schema, initialValues, onRender }) {
  const api = useFormValidation(schema, initialValues);
  onRender(api);
  return null;
}

describe("useFormValidation", () => {
  let consoleErrorSpy;

  beforeAll(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  it("tracks values, validates fields, and resets state", () => {
    const schema = {
      email: [{ required: true }, { type: "email" }],
      password: [{ required: true }, { type: "password" }],
      confirmPassword: [
        { required: true },
        { matchesField: "password", message: "Passwords do not match" },
      ],
    };

    let hookApi = null;

    act(() => {
      TestRenderer.create(
        React.createElement(HookProbe, {
          schema,
          initialValues: { email: "", password: "", confirmPassword: "" },
          onRender: (api) => {
            hookApi = api;
          },
        })
      );
    });

    act(() => {
      hookApi.handleChange("email", "bad-email");
      hookApi.handleChange("password", "Aa123456!");
      hookApi.handleChange("confirmPassword", "no-match");
    });

    act(() => {
      hookApi.validate();
    });

    expect(hookApi.errors.email).toBeDefined();
    expect(hookApi.errors.confirmPassword).toBe("Passwords do not match");

    act(() => {
      hookApi.handleChange("email", "ok@example.com");
      hookApi.handleChange("confirmPassword", "Aa123456!");
    });

    act(() => {
      const valid = hookApi.validate();
      expect(valid).toBe(true);
    });

    expect(hookApi.errors).toEqual({});

    act(() => {
      hookApi.resetForm();
    });

    expect(hookApi.values).toEqual({
      email: "",
      password: "",
      confirmPassword: "",
    });
  });
});
