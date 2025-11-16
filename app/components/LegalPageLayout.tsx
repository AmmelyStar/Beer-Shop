// app/components/LegalPageLayout.tsx
import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  title: string;
  html?: string; // HTML из Shopify
  children?: ReactNode; // на всякий случай, если захочешь писать руками
};

export function LegalPageLayout({
  title,
  html,
  children,
}: LegalPageLayoutProps) {
  console.log(html);

  return (
    <div className="px-6 py-20 lg:px-8 max-w-3xl mx-auto">
      <div className="text-base/7">
        <h1 className="text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>

        <div className="text-base text-gray-300">
          {html ? (
            <div
              className="
              prose prose-invert max-w-none w-full
              prose-headings:text-white
              prose-a:text-indigo-400
              prose-strong:text-white

              [&_p]:my-6 [&_p]:text-gray-300
[&_a]:text-white [&_a:hover]:text-yellow-500
               [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-gray-300
    [&_ul>li]:marker:text-gray-300

    [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-gray-300
    [&_ol>li]:marker:text-gray-300

              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-10 [&_h2]:text-white
              [&_h3]:text-lg  [&_h3]:font-semibold [&_h3]:my-8  [&_h3]:text-white [&_h3]:max-w-2xl
            "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
