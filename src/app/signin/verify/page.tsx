import Link from "next/link";

export const metadata = {
  title: "Check your email",
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link. Click the link in the email to finish signing
          in. If you don&apos;t see it, check your spam folder.
        </p>
        <p className="text-xs text-muted-foreground">
          <Link href="/signin" className="underline underline-offset-4">
            Back to sign in
          </Link>
          {" · "}
          <Link href="/" className="underline underline-offset-4">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
