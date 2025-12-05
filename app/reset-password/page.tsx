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
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // If no token, show error state
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Please request a new password reset link.
            </p>
            <Link
              href="/forgot-password"
              className="text-primary text-sm hover:underline"
            >
              Request new link &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError("");
    setLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      // Redirect to login with success message
      router.push("/login?reset=success");
    } catch (err: unknown) {
      // Better Auth errors include a `code` property for programmatic handling.
      // Known codes for token issues: "INVALID_TOKEN", "EXPIRED_TOKEN"
      // Coupling: better-auth@1.3.27 - error codes may change in future versions.
      // See: https://www.better-auth.com/docs/concepts/error-handling
      const error = err as { code?: string; message?: string };

      // Handle specific error cases by code
      if (error?.code === "INVALID_TOKEN" || error?.code === "EXPIRED_TOKEN") {
        setServerError(
          "This link has expired or is invalid. Please request a new password reset."
        );
      } else {
        setServerError(
          error?.message || "Failed to reset password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it&apos;s strong and
            secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              {serverError && (
                <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
                  <p>{serverError}</p>
                  {serverError.includes("expired") && (
                    <p className="mt-2">
                      <Link href="/forgot-password" className="underline">
                        Request new link
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
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
                  required
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

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </Field>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground text-sm hover:underline"
                >
                  &larr; Back to login
                </Link>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
