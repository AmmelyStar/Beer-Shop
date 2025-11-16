import { StarIcon } from "@heroicons/react/20/solid";

const reviews = {
  average: 4,
  totalCount: 1624,
  counts: [
    { rating: 5, count: 1019 },
    { rating: 4, count: 162 },
    { rating: 3, count: 97 },
    { rating: 2, count: 199 },
    { rating: 1, count: 147 },
  ],
  featured: [
    {
      id: 1,
      rating: 5,
      content: `
        This is the bag of my dreams. I took it on my last vacation and was able to fit an absurd amount of snacks for the many long and hungry flights.
      `,
      author: "Emily Selman",
    },
    {
      id: 2,
      rating: 5,
      content: `
        Before getting the Ruck Snack, I struggled my whole life with pulverized snacks, endless crumbs, and other heartbreaking snack catastrophes. Now, I can stow my snacks with confidence and style!
      `,
      author: "Hector Gibbons",
    },
    {
      id: 3,
      rating: 4,
      content: `
        I love how versatile this bag is. It can hold anything ranging from cookies that come in trays to cookies that come in tins.
      `,
      author: "Mark Edwards",
    },
  ],
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type CustomerReviewsProps = {
  title: string;
  stars: string;
  base1: string;
  base2: string;
  starRew: string;
  CTATitle: string;
  CTASubtitle: string;
  button: string;
  recentReviews: string;
};
export default function CustomerReviews({
  title,
  stars,
  base1,
  base2,
  starRew,
  CTATitle,
  CTASubtitle,
  button,
  recentReviews,
}: CustomerReviewsProps) {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6  lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8 lg:px-8 ">
        {/* left    */}
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-200">
            {title}
          </h2>

          <div className="mt-3 flex items-center">
            <div>
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    aria-hidden="true"
                    className={classNames(
                      reviews.average > rating
                        ? "text-yellow-400"
                        : "text-gray-500",
                      "size-5 shrink-0"
                    )}
                  />
                ))}
              </div>
              <p className="sr-only"> {stars}</p>
            </div>
            <p className="ml-2 text-sm text-gray-500">
              {base1} {reviews.totalCount} {base2}
            </p>
          </div>

          <div className="mt-6">
            <div className="space-y-3">
              {reviews.counts.map((count) => (
                <div key={count.rating} className="flex items-center text-sm">
                  <dt className="flex flex-1 items-center">
                    <p className="w-3 font-medium text-gray-500">
                      {count.rating}
                      <span className="sr-only"> {starRew}</span>
                    </p>
                    <div
                      aria-hidden="true"
                      className="ml-1 flex flex-1 items-center"
                    >
                      <StarIcon
                        aria-hidden="true"
                        className={classNames(
                          count.count > 0 ? "text-yellow-400" : "text-gray-500",
                          "size-5 shrink-0"
                        )}
                      />

                      <div className="relative ml-3 flex-1">
                        <div className="h-3 rounded-full border border-white/10 bg-white/10" />
                        {count.count > 0 ? (
                          <div
                            style={{
                              width: `calc(${count.count} / ${reviews.totalCount} * 100%)`,
                            }}
                            className="absolute inset-y-0 rounded-full border border-yellow-400 bg-yellow-400"
                          />
                        ) : null}
                      </div>
                    </div>
                  </dt>
                  <dd className="ml-3 w-10 text-right text-sm tabular-nums text-gray-500">
                    {Math.round((count.count / reviews.totalCount) * 100)}%
                  </dd>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-medium text-gray-200">{CTATitle}</h3>
            <p className="mt-6  text-sm text-gray-300">{CTASubtitle}</p>

            <a
              href="#"
              className="mt-10 relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {button}
            </a>
          </div>
        </div>

        {/* right */}
        <div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
          <h3 className="sr-only">{recentReviews}</h3>

          <div className="flow-root">
            <div className="-my-12 divide-y divide-gray-200">
              {reviews.featured.map((review) => (
                <div key={review.id} className="py-12">
                  <div className="flex items-center">
                    <div>
                      <h4 className="text-lg text-white font-semibold whitespace-nowrap">
                        {review.author}
                      </h4>
                      <div className="mt-1 flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <StarIcon
                            key={rating}
                            aria-hidden="true"
                            className={classNames(
                              review.rating > rating
                                ? "text-yellow-400"
                                : "text-gray-500",
                              "size-5 shrink-0"
                            )}
                          />
                        ))}
                      </div>
                      <p className="sr-only">{review.rating} out of 5 stars</p>
                    </div>
                  </div>

                  <div className="mt-6  text-pretty text-base text-gray-300">
                    {review.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
