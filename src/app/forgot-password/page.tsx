import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Reset Password",
  ...noIndexMetadata,
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; devToken?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <ForgotPasswordForm sent={params.sent === "1"} devToken={params.devToken} />
    </main>
  );
}
