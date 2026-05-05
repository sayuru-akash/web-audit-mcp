import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Set New Password",
  ...noIndexMetadata,
};

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <ResetPasswordForm />
    </main>
  );
}
