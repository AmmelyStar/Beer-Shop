"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Tabs from "./Tabs";

type TabsQueryProps<T extends string> = {
  paramKey?: string;
  labels: Record<T, string>;
  keys: readonly T[];
  /**
   * Если у тебя есть строгий набор допустимых значений,
   * можно передать guard, чтобы не принимать мусор из URL.
   */
  isKey?: (x: string) => x is T;
};

export default function TabsQuery<T extends string>(props: TabsQueryProps<T>) {
  return (
    <Suspense fallback={<TabsQueryFallback {...props} />}>
      <TabsQueryInner {...props} />
    </Suspense>
  );
}

function TabsQueryFallback<T extends string>({ labels, keys }: TabsQueryProps<T>) {
  const first = keys[0] as T;
  return <Tabs labels={labels} keys={keys} active={first} onChange={() => {}} />;
}

function TabsQueryInner<T extends string>({
  paramKey = "category",
  labels,
  keys,
  isKey,
}: TabsQueryProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const raw = sp.get(paramKey);
  const active: T =
    raw && (isKey ? isKey(raw) : (keys as readonly string[]).includes(raw))
      ? (raw as T)
      : (keys[0] as T);

  const handleChange = (nextTab: T) => {
    const next = new URLSearchParams(sp.toString());

    if (nextTab === ("all" as T)) next.delete(paramKey);
    else next.set(paramKey, nextTab);

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return <Tabs labels={labels} keys={keys} active={active} onChange={handleChange} />;
}
