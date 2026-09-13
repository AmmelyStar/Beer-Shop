import Hero from "@/app/components/Hero";
import { getMessages } from "./messages";
import type { Locale } from "../lib/locale";
import ShopCategory from "../components/ShopCategory";
import TrendingProducts from "../components/TrendingProducts";
import BannerSection from "../components/BannerSection";
import TextBlockCenter from "../components/ui/TextBlockCenter";
import BrandSection from "../components/BrandSection";
import {
  fetchAllProductsFlattened,
  fetchTrendingProductsFlattened,
} from "../data/repo";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = await getMessages(lang);

  const allProducts = await fetchAllProductsFlattened(lang);

  let trendingProducts = await fetchTrendingProductsFlattened(lang, 4);

  if (!trendingProducts.length) {
    trendingProducts = allProducts
      .filter(
        (product) =>
          "trending" in product && Boolean(product.trending)
      )
      .slice(0, 4);
  }

  const shopHref = `/${lang}/shop`;

  return (
    <main>
      <Hero
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        ctaLabel={t.hero.cta}
        ctaHref={shopHref}
      />

      <TextBlockCenter
        title={t.TextBlockCategory.title}
        subtitle={t.TextBlockCategory.subtitle}
      />

      <ShopCategory
        title={t.ShopCategory.title}
        browseAll={t.ShopCategory.browseAll}
        names={t.ShopCategory.names}
        alts={t.ShopCategory.alts}
        lang={lang}
      />

      <TrendingProducts
        products={trendingProducts}
        lang={lang}
        title={t.TrendingProducts.title}
        stars={t.TrendingProducts.stars}
        reviews={t.TrendingProducts.reviews}
        add={t.TrendingProducts.add}
        alcohol={t.TrendingProducts.alcohol}
      />

      <BannerSection
        imageSrc="/category/golden-beer-bubbles-drop-wet-glass-generated-by-ai.jpg"
        imageAlt={t.BannerSection.title}
        title={t.BannerSection.title}
        subtitle={t.BannerSection.subtitle}
        ctaLabel={t.BannerSection.cta}
        ctaHref={shopHref}
      />

      <TextBlockCenter
        title={t.LogoSection.title}
        subtitle={t.LogoSection.subtitle}
      />

      <BrandSection messages={t} />
    </main>
  );
}