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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  const onSubmit = async (data: SignupFormData) => {
    setServerError("");
    setLoading(true);

    try {
      // Step 1: Create Better Auth user
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Step 2: Create extended user profile in Convex
      try {
        await createUserProfile({
          email: data.email,
          name: data.name,
        });
      } catch (profileError) {
        // Log but don't fail - profile can be created later
        console.error("Failed to create user profile:", profileError);
      }

      // Step 3: Send welcome email (fire and forget - don't block signup)
      sendWelcomeEmail({
        email: data.email,
        name: data.name,
      }).catch((emailError) => {
        // Log but don't fail - email is not critical for signup
        console.error("Failed to send welcome email:", emailError);
      });

      // Step 4: Redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Handle Better Auth specific errors
      if (
        error?.code === "USER_ALREADY_EXISTS" ||
        error?.message?.toLowerCase().includes("already exists")
      ) {
        setServerError("An account with this email already exists");
      } else {
        setServerError(
          error?.message || "Failed to create account. Please try again."
        );
      }
      setLoading(false);
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
                {serverError}
                {serverError.includes("already exists") && (
                  <span className="ml-1">
                    <a href="/login" className="underline">
                      Sign in instead
                    </a>
                  </span>
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
