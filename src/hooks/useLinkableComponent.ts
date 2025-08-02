"use client";
import Link from "next/link";
import type * as React from "react";

export interface LinkableProps extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  external?: boolean;
  as?: React.ElementType; // Allow specifying the component type when not a link
}

interface UseLinkableComponentResult {
  Component: React.ElementType;
  href?: string;
  linkProps: Record<string, any>;
}

export const useLinkableComponent = ({
  href,
  external,
  as = "div", // Default to 'div' if no href and no 'as' prop
  ...rest
}: LinkableProps): UseLinkableComponentResult => {
  const isExternal =
    external ??
    (href?.startsWith("http") ||
      href?.startsWith("mailto:") ||
      href?.startsWith("tel:"));

  if (href) {
    if (isExternal) {
      return {
        Component: "a",
        href,
        linkProps: {
          target: "_blank",
          rel: "noopener noreferrer",
          ...rest,
        },
      };
    } else {
      // Internal link, use Next.js Link
      return {
        Component: Link,
        href,
        linkProps: { ...rest },
      };
    }
  }

  // Not a link, use the 'as' prop or default
  return {
    Component: as,
    linkProps: { ...rest },
  };
};
