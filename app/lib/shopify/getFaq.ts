// app\lib\shopify\getFaq.ts
import type { Locale } from "@/app/lib/locale";
import { shopifyFetchWithLocale } from "./client";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

const FAQ_QUERY = `#graphql
query FAQ($language: LanguageCode!, $country: CountryCode!)
@inContext(language: $language, country: $country) {
  metaobjects(type: "faq_item", first: 50) {
    nodes {
      id
      fields { key value }
    }
  }
}
`;

function fieldsToObj(fields: Array<{ key: string; value: string | null }>) {
  return Object.fromEntries(fields.map((f) => [f.key, f.value ?? ""]));
}

export async function getFaq(lang: Locale): Promise<FaqItem[]> {
  const data = await shopifyFetchWithLocale<{
    metaobjects: {
      nodes: Array<{
        id: string;
        fields: Array<{ key: string; value: string | null }>;
      }>;
    };
  }>(FAQ_QUERY, {}, lang, 60);

  const items: FaqItem[] = data.metaobjects.nodes.map((n) => {
    const f = fieldsToObj(n.fields);
    return {
      id: n.id,
      question: String(f.question ?? ""),
      answer: String(f.answer ?? ""),
      order: Number(f.order ?? 0),
    };
  });

  return items
    .filter((x) => x.question && x.answer)
    .sort((a, b) => a.order - b.order);
}