import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-2xl font-bold">
            <span className="gradient-text">Admin Panel</span>
          </p>
          <p className="mt-2 text-sm text-muted">Sign in to manage your content</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
