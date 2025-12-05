import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
} from "./validators";

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

describe("profileSchema", () => {
  it("should accept valid profile data", () => {
    const result = profileSchema.safeParse({
      name: "Test User",
      bio: "This is my bio",
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty name", () => {
    const result = profileSchema.safeParse({
      name: "",
      bio: "Bio text",
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty bio", () => {
    const result = profileSchema.safeParse({
      name: "Name",
      bio: "",
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("should reject name over 100 characters", () => {
    const result = profileSchema.safeParse({
      name: "a".repeat(101),
      bio: "Bio",
      visibility: "public",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("100");
    }
  });

  it("should reject bio over 500 characters", () => {
    const result = profileSchema.safeParse({
      name: "Name",
      bio: "a".repeat(501),
      visibility: "public",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("500");
    }
  });

  it("should accept visibility public", () => {
    const result = profileSchema.safeParse({
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("should accept visibility private", () => {
    const result = profileSchema.safeParse({
      visibility: "private",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid visibility", () => {
    const result = profileSchema.safeParse({
      visibility: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept 500 character bio exactly", () => {
    const result = profileSchema.safeParse({
      name: "Name",
      bio: "a".repeat(500),
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("should accept 100 character name exactly", () => {
    const result = profileSchema.safeParse({
      name: "a".repeat(100),
      bio: "Bio",
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });
});
