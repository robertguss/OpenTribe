"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signupSchema, type SignupFormData } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isRetryable, setIsRetryable] = useState(false);

  // Store last submitted data for retry (using state instead of ref for lint compliance)
  const [lastSubmittedData, setLastSubmittedData] =
    useState<SignupFormData | null>(null);

  // Convex mutation for creating user profile
  const createUserProfile = useMutation(
    api.members.mutations.createUserProfile
  );
  // Convex action for sending welcome email
  const sendWelcomeEmail = useAction(
    api.notifications.actions.sendWelcomeEmail
  );

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate on blur first
    reValidateMode: "onChange", // Then on change after first validation
  });

  // Helper to determine if error is retryable (network/server issues)
  const isNetworkError = (error: unknown): boolean => {
    const err = error as { code?: string; message?: string };
    // Network errors, timeouts, and server errors are retryable
    return (
      err?.message?.toLowerCase().includes("network") ||
      err?.message?.toLowerCase().includes("timeout") ||
      err?.message?.toLowerCase().includes("fetch") ||
      err?.message?.toLowerCase().includes("connection") ||
      err?.code === "NETWORK_ERROR" ||
      err?.code === "TIMEOUT"
    );
  };

  const performSignup = useCallback(
    async (data: SignupFormData) => {
      setServerError("");
      setLoading(true);
      setIsRetryable(false);

      // Normalize email to lowercase for consistency
      const normalizedEmail = data.email.toLowerCase().trim();

      try {
        // Step 1: Create Better Auth user
        await authClient.signUp.email({
          email: normalizedEmail,
          password: data.password,
          name: data.name,
        });

        // Step 2: Create extended user profile in Convex
        // This is important - if it fails, we should inform the user
        try {
          await createUserProfile({
            email: normalizedEmail,
            name: data.name,
          });
        } catch (profileError) {
          // Profile creation failed after auth succeeded
          // Log the error but continue - profile will be created on next login
          console.error("Failed to create user profile:", profileError);

          // Check if it's a rate limit error
          const err = profileError as { data?: { code?: string } };
          if (err?.data?.code === "RATE_LIMITED") {
            // This shouldn't normally happen, but handle it gracefully
            console.warn("Profile creation rate limited - will retry on login");
          }
        }

        // Step 3: Send welcome email (fire and forget - don't block signup)
        sendWelcomeEmail({
          email: normalizedEmail,
          name: data.name,
        }).catch((emailError) => {
          // Log but don't fail - email is not critical for signup
          console.error("Failed to send welcome email:", emailError);
        });

        // Step 4: Redirect to dashboard (TODO: onboarding flow in future)
        router.push("/dashboard");
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };

        // Store data for potential retry
        setLastSubmittedData(data);

        // Handle Better Auth specific errors
        if (
          error?.code === "USER_ALREADY_EXISTS" ||
          error?.message?.toLowerCase().includes("already exists")
        ) {
          setServerError("An account with this email already exists");
          setIsRetryable(false);
        } else if (isNetworkError(err)) {
          // Network error - allow retry
          setServerError(
            "Connection failed. Please check your internet and try again."
          );
          setIsRetryable(true);
        } else {
          setServerError(
            error?.message || "Failed to create account. Please try again."
          );
          // Allow retry for generic errors
          setIsRetryable(true);
        }
        setLoading(false);
      }
    },
    [createUserProfile, sendWelcomeEmail, router]
  );

  const onSubmit = async (data: SignupFormData) => {
    setLastSubmittedData(data);
    await performSignup(data);
  };

  const handleRetry = async () => {
    if (lastSubmittedData) {
      await performSignup(lastSubmittedData);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {serverError && (
              <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
                <p>{serverError}</p>
                {serverError.includes("already exists") && (
                  <p className="mt-1">
                    <a href="/login" className="underline">
                      Sign in instead
                    </a>
                  </p>
                )}
                {isRetryable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleRetry}
                    disabled={loading}
                  >
                    {loading ? "Retrying..." : "Try Again"}
                  </Button>
                )}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                disabled={loading}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && touchedFields.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                disabled={loading}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && touchedFields.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
              {!errors.email && (
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                disabled={loading}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && touchedFields.password ? (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              ) : (
                <FieldDescription>
                  8+ characters, 1 uppercase, 1 number
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                disabled={loading}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && touchedFields.confirmPassword && (
                <p className="text-destructive text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </Field>

            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                <Button variant="outline" type="button" disabled={loading}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <a href="/login" className="underline">
                    Sign in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
