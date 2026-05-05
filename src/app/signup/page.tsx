import type { Metadata } from "next";
import { SignUpForm } from "@/components/forms";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign Up",
  ...noIndexMetadata,
};

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <SignUpForm />
    </main>
  );
}
