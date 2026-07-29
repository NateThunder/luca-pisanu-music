import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Admin Password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <ResetPasswordForm token={token} />;
}
