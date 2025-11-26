"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default function AdminLoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Redirect to admin dashboard after successful login
    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark-text">Clinton Lexicon</h1>
          <h2 className="mt-2 text-xl text-dark-text-secondary">Admin Login</h2>
        </div>

        <div className="mt-8 bg-dark-bg-secondary border-2 border-dark-border rounded-lg p-6">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
}
