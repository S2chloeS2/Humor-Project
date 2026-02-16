import Link from "next/link";
import SignOutButton from "@/app/dashboard/SignOutButton";

export default function Header({ email }: { email: string | null }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <Link href="/" className="text-lg font-semibold">
        Humor Project
      </Link>

      <nav className="flex items-center gap-4">
        {email ? (
          <>
            <span className="text-sm text-gray-400">{email}</span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-white px-4 py-2 text-sm text-black hover:bg-gray-200"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
