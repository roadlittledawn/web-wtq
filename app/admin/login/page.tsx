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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Clinton Lexicon</h1>
          <h2 className="mt-2 text-xl text-gray-600">Admin Login</h2>
        </div>

        <div className="mt-8">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
}
