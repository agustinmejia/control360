import Image from "next/image";
import { getCompanyName } from "@/modules/access/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const companyName = await getCompanyName();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/brand-logo.jpg"
          alt=""
          width={160}
          height={82}
          priority
          className="rounded-lg"
        />
        <div>
          <p className="text-2xl font-extrabold tracking-tight">Control360</p>
          <p className="text-muted">{companyName}</p>
        </div>
      </div>
      <div className="border-border bg-surface w-full max-w-sm rounded-lg border p-5 shadow-sm">
        {children}
      </div>
    </main>
  );
}
