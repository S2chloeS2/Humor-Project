import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./UploadForm";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold mb-2">Upload an Image</h1>
        <p className="text-gray-400 text-sm mb-8">
          Upload a photo and we&apos;ll generate captions for it.
        </p>
        <UploadForm />
      </div>
    </main>
  );
}
