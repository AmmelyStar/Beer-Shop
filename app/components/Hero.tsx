// import Image from "next/image";
// type HeroProps = {
//   title: string;
//   subtitle: string;
//   ctaLabel: string;
//   ctaHref?: string;
//   imageUrl?: string; // можешь заменить данными с бэка
// };

// export default function Hero({
//   title,
//   subtitle,
//   ctaLabel,
//   ctaHref = "/en/shop",
//   imageUrl = "/category/olga2813_beer_macro_ad_photo_9b6d9918-4d2e-4a3b-8a71-7d7051d002be.png",
// }: HeroProps) {
//   return (
//     <section className="relative overflow-hidden max-w-7xl mx-auto rounded-3xl ">
//       <div className="absolute inset-0">
//         <Image
//           src={imageUrl}
//           alt=""
//           className="h-full w-full object-cover"
//           width={640}
//           height={480}
//         />
//         <div className="absolute inset-0 bg-black/35" />
//       </div>

//       <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36 text-center">
//         <div className="max-w-xl mx-auto">
//           <h1 className="text-6xl font-semibold leading-tight text-white  ">
//             {title}
//           </h1>
//           <p className="mt-4 text-xl text-white/90">{subtitle}</p>
//           <a
//             href={ctaHref}
//             className="mt-10 inline-block rounded-xl bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow w-md"
//           >
//             {ctaLabel}
//           </a>
//         </div>
//       </div>
//     </section>
//   );
// }
"use client";
import Image from "next/image";
import { useState } from "react";

type HeroProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref?: string;
  imageUrl?: string; // постер/фолбэк
  videoUrl?: string; // видео-фон из /public
};

export default function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/en/shop",
  imageUrl = "/category/olga2813_beer_macro_ad_photo_9b6d9918-4d2e-4a3b-8a71-7d7051d002be.png",
  videoUrl = "/category/578e8b9f.mp4",
}: HeroProps) {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative overflow-hidden max-w-7xl mx-auto rounded-b-3xl mt-2 mb-12">
      <div className="absolute inset-0">
        {/* Видео как фон, если есть и не упало */}
        {videoUrl && !videoError ? (
          <video
            key={videoUrl} // сбрасывает проигрыватель при смене src
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={imageUrl} // постер до старта
            onError={() => setVideoError(true)} // если не загрузилось — покажем картинку
            aria-hidden="true"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            width={640}
            height={480}
            priority
          />
        )}

        {/* тёмный оверлей для читаемости */}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-42 pb-30  ">
        <div className=" pl-20">
          {" "}
          <p className="mt-6 text-xl text-white/90 max-w-sm">{subtitle}</p>
          <h1
            className="max-w-xl mx-autorelative font-extrabold uppercase leading-none
               text-transparent transform translate-all duration-300 group-hover:text-yellow-500  text-5xl sm:text-6xl lg:text-7xl 
               [-webkit-text-stroke:2px_white] 
               [paint-order:stroke_fill] pt-8"
          >
            {title}
          </h1>
          <a
            href={ctaHref}
            className="
    mt-16 inline-block rounded-sm
    bg-stone-950/40 px-6 py-3 text-sm font-medium uppercase text-white
    border-2 border-white
    hover:bg-white hover:text-gray-900
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
    transition-colors  w-sm transform translate-all duration-300
  "
          >
            {ctaLabel}
          </a>{" "}
        </div>
      </div>
    </section>
  );
}
