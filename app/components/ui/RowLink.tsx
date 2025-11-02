"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type RowLinkProps = LinkProps & {
  label: string;
  className?: string;
  icon?: "arrow" | "beer";
};

const ArrowIcon = ({ className = "" }) => (
  <svg
    className={twMerge(
      "size-4 translate-x-0 transition-transform duration-200 ease-out " +
        "group-hover:translate-x-1 group-active:translate-x-1.5 " +
        "motion-reduce:transition-none motion-reduce:transform-none",
      className
    )}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h12" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

const BeerIcon = ({ className = "" }) => (
  <svg
    className={twMerge(
      "size-4 translate-x-0 transition-transform duration-200 ease-out " +
        "group-hover:translate-x-1 group-active:translate-x-1.5 " +
        "motion-reduce:transition-none motion-reduce:transform-none",
      className
    )}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* mug */}
    <path d="M6 7h8a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2z" />
    {/* handle */}
    <path d="M16 9h1a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-1" />
    {/* foam */}
    <path d="M6 7c0-2 2-3 4-3 1.2 0 2.3.4 3 1 1-.8 3-.8 4 0 .7.6 1 1.3 1 2" />
  </svg>
);

const RowLink = forwardRef<HTMLAnchorElement, RowLinkProps>(
  ({ label, className, icon = "arrow", ...linkProps }, ref) => {
    const Icon = icon === "beer" ? BeerIcon : ArrowIcon;

    return (
      <Link
        ref={ref}
        {...linkProps}
        className={twMerge(
          "group inline-flex items-center gap-1.5 text-base " +
            "text-white hover:text-yellow-500 transition-colors",
          className
        )}
      >
        {label}
        <Icon />
      </Link>
    );
  }
);

RowLink.displayName = "RowLink";

export default RowLink;
