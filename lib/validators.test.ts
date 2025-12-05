import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema } from "./validators";

describe("forgotPasswordSchema", () => {
  it("should accept valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("email");
    }
  });

  it("should reject empty email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept email with subdomain", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@mail.example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  const validPassword = "Password1";

  it("should accept valid password and matching confirmation", () => {
    const result = resetPasswordSchema.safeParse({
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: validPassword,
      confirmPassword: "DifferentPassword1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("match");
    }
  });

  it("should reject password without uppercase", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("uppercase");
    }
  });

  it("should reject password without number", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("number");
    }
  });

  it("should reject password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8 characters");
    }
  });

  it("should accept strong password with special characters", () => {
    const strongPassword = "MyP@ssw0rd!";
    const result = resetPasswordSchema.safeParse({
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });
});
