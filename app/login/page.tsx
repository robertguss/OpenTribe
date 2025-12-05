import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

function LoginContent() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
