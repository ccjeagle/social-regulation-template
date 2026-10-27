import { Suspense } from "react";
import { Generator } from "@/components/Generator";
import { isValidKey } from "@/lib/access";

async function Gate({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { id } = await searchParams;
  const key = Array.isArray(id) ? id[0] : id;
  if (!isValidKey(key)) {
    return (
      <h1 className="mx-auto mt-32 max-w-md px-6 text-center text-lg font-normal text-ink-soft">
        請聯絡資訊委員會，取得最新網址。
      </h1>
    );
  }
  return <Generator accessKey={key as string} />;
}

export default function Page(props: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Suspense>
        <Gate searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
