import type { Metadata } from "next";
import { LoginForm } from "@/components/forms";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Log In",
  ...noIndexMetadata,
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <LoginForm />
    </main>
  );
}
