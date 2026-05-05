import { ForgotPasswordForm } from "@/components/forms";

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
