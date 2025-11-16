// components/ProductOverviews.tsx
import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import { FlattenedProduct } from "../data/mappers";

type ProductOverviewsProps = {
  product: FlattenedProduct;
  perUnit: string;
  abv: string;
  ibu: string;
  fg: string;
  country: string;
  brand: string;
  style: string;
  addToCart: string;
  reviews: string;
  outOf5Stars: string;
  viewAllReviews: string;
  leaveAReview: string;
  description: string;
  tastedBestWith: string;
  allergens: string;
  ingredients: string;
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ProductOverviews({
  product,
  perUnit,
  abv,
  ibu,
  fg,
  country,
  brand,
  style,
  addToCart,
  reviews,
  outOf5Stars,
  viewAllReviews,
  leaveAReview,
  description,
  tastedBestWith,
  allergens,
  ingredients,
}: ProductOverviewsProps) {
  const price = product.priceRange.minVariantPrice.amount;
  const packSize = product.specs?.pack_size_l;
  const productAbv = product.specs?.abv;
  const productIbu = product.specs?.ibu;
  const productFg = product.specs?.fg;
  const productCountry = product.specs?.country;
  const productBrand = product.specs?.brand;
  const productStyle = product.shopify?.["beer-style"];
  const productAllergens = product.specs?.allergens;
  const productIngredients = product.specs?.ingredients;
  const productPairing = product.specs?.pairing;
  console.log(productStyle);
  const images =
    product.images?.edges.map((edge, index) => ({
      id: index + 1,
      imageSrc: edge.node.url,
      imageAlt: edge.node.altText || product.title,
      primary: index === 0,
    })) || [];

  const rating = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  // ✅ Парсим pairing (предполагаем что это строка через запятую или список)
  const pairingList = productPairing
    ? productPairing
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  // console.log(product);

  return (
    <div>
      <div className="pb-16 pt-6 sm:pb-24">
        <div className="mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:auto-rows-min lg:grid-cols-12 lg:gap-x-8">
            {/* title and price */}
            <div className="lg:col-span-5 lg:col-start-8">
              {/* ... весь предыдущий код без изменений ... */}
              <div className="flex justify-between items-baseline gap-10">
                <h1 className="text-3xl tracking-tight font-semibold text-yellow-400 max-w-md">
                  {product.title}
                  {packSize && (
                    <span className="ml-3 text-white text-xl">
                      {packSize} L
                    </span>
                  )}
                </h1>

                <div className="flex flex-col items-end text-right">
                  <span className="text-2xl font-medium text-white whitespace-nowrap">
                    {parseFloat(price).toFixed(2)} €
                  </span>
                  <span className="text-base text-gray-300 whitespace-nowrap">
                    {perUnit}
                  </span>
                </div>
              </div>

              {/* Product country and abv ibu fg */}
              <div className="mt-10 w-full flex gap-5 justify-start items-center">
                {productAbv && (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-white font-semibold whitespace-nowrap">
                        {abv}:
                      </span>
                      <span className="text-base text-gray-300">
                        {productAbv}%
                      </span>
                    </div>
                    {(productIbu || productFg) && "|"}
                  </>
                )}

                {productIbu && (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-white font-semibold whitespace-nowrap">
                        {ibu}:
                      </span>
                      <span className="text-base text-gray-300">
                        {productIbu}
                      </span>
                    </div>
                    {productFg && "|"}
                  </>
                )}

                {productFg && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-white font-semibold whitespace-nowrap">
                      {fg}:
                    </span>
                    <span className="text-base text-gray-300">
                      {productFg}°
                    </span>
                  </div>
                )}
              </div>

              {productCountry && (
                <div className="w-full flex items-baseline gap-2">
                  <span className="text-lg text-white font-semibold whitespace-nowrap">
                    {country}:
                  </span>
                  <span className="text-base text-gray-300">
                    {productCountry}
                  </span>
                </div>
              )}

              {productBrand && (
                <div className="w-full flex items-baseline gap-2">
                  <span className="text-lg text-white font-semibold whitespace-nowrap">
                    {brand}:
                  </span>
                  <span className="text-base text-gray-300">
                    {productBrand}
                  </span>
                </div>
              )}

              {productStyle && (
                <div className="w-full flex items-baseline gap-2 mt-10">
                  <span className="text-lg text-white font-semibold whitespace-nowrap">
                    {style}:
                  </span>
                  <span className="text-base text-gray-300">
                    {productStyle}
                  </span>
                </div>
              )}

              {/* Reviews */}
              <div className="mt-10">
                <h2 className="sr-only">{reviews}</h2>
                <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                  <div className="flex items-center">
                    <div className="mr-2 flex items-center">
                      {[0, 1, 2, 3, 4].map((ratingValue) => (
                        <StarIcon
                          key={ratingValue}
                          aria-hidden="true"
                          className={classNames(
                            rating > ratingValue
                              ? "text-yellow-400"
                              : "text-gray-500",
                            "size-5 shrink-0"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {rating}
                      <span className="sr-only">{outOf5Stars}</span>
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-400 hover:text-yellow-500 transition-colors">
                    {reviewCount > 0 ? viewAllReviews : leaveAReview}
                  </span>
                </button>
              </div>
            </div>

            {/* Image gallery */}
            <div className="mt-8 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:-mt-6">
              <div className="group grid grid-cols-1 lg:grid-cols-2 lg:gap-8 p-6">
                {images.length > 0 ? (
                  images.map((image) => (
                    <div
                      key={image.id}
                      className={classNames(
                        image.primary
                          ? "lg:col-span-2 lg:row-span-2"
                          : "hidden lg:block",
                        "relative aspect-square w-full overflow-hidden rounded-lg bg-stone-200 transition-colors duration-300"
                      )}
                    >
                      <Image
                        alt={image.imageAlt}
                        src={image.imageSrc}
                        fill
                        sizes="(min-width:1024px) 50vw, 100vw"
                        className="object-contain object-center"
                        priority={image.primary}
                      />
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 lg:row-span-2 relative aspect-square w-full overflow-hidden rounded-lg bg-stone-200 flex items-center justify-center">
                    <p className="text-gray-500">No images available</p>
                  </div>
                )}
              </div>
            </div>

            {/* button and right side under*/}
            <div className="mt-16 lg:col-span-5">
              <form>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-500 hover:border-yellow-600 sm:w-auto lg:w-full duration-300"
                >
                  {addToCart}
                </button>
              </form>

              {/* Product Description */}
              {product.descriptionHtml && (
                <div className="mt-10">
                  <h2 className="mx-auto mt-6 max-w-lg text-lg text-white font-semibold">
                    {description}
                  </h2>

                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml,
                    }}
                    className="mx-auto mt-6 max-w-xl text-pretty text-base text-gray-300"
                  />
                </div>
              )}

              {/* ✅ Tasted best with - раскомментируйте и используйте pairing */}
              {pairingList.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h2 className="mx-auto mt-6 max-w-lg text-pretty text-lg text-white font-semibold">
                    {tastedBestWith}
                  </h2>
                  <div className="mt-4">
                    <ul
                      role="list"
                      className="list-disc space-y-1 pl-5 text-sm text-gray-300 marker:text-gray-300"
                    >
                      {pairingList.map((item, index) => (
                        <li key={index} className="pl-2 text-base ">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Allergens */}
              {productAllergens && (
                <div className="w-full flex items-baseline gap-2 mt-6">
                  <span className="text-lg text-white font-semibold whitespace-nowrap">
                    {allergens}:
                  </span>
                  <span className="text-base text-gray-300">
                    {productAllergens}
                  </span>
                </div>
              )}

              {/* Ingredients */}
              {productIngredients && (
                <div className="w-full flex items-baseline gap-2 mt-6">
                  <span className="text-lg text-white font-semibold whitespace-nowrap">
                    {ingredients}:
                  </span>
                  <span className="text-base text-gray-300">
                    {productIngredients}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
