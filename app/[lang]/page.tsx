import Hero from "@/app/components/Hero";
import { getMessages } from "./messages";
import type { Locale } from "../lib/locale";
import ShopCategory from "../components/ShopCategory";
import TrendingProducts from "../components/TrendingProducts";
import BannerSection from "../components/BannerSection";
import TextBlockCenter from "../components/ui/TextBlockCenter";
import BrandSection from "../components/BrandSection";
import { fetchAllProductsFlattened } from "../data/repo";
// import LinksList from "../components/ui/LinksList";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = await getMessages(lang);

  const allProducts = await fetchAllProductsFlattened(lang);

  // Берём только те, у которых marketing.trending = true
  const trendingProducts = allProducts.filter((p) => p.trending).slice(0, 4); // например, максимум 4

  // Пример: если нужен URL магазина с текущей локалью
  const shopHref = `/${lang}/shop`;

  return (
    <main>
      <Hero
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        ctaLabel={t.hero.cta}
        ctaHref={shopHref}
        // imageUrl можешь подменять данными с бэка
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
        ctaHref={`/${lang}/shop`}
      />

      <TextBlockCenter
        title={t.LogoSection.title}
        subtitle={t.LogoSection.subtitle}
      />

      <BrandSection />
    </main>
  );
}
