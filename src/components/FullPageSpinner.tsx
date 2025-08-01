"use client";

import * as React from "react";
import { type ReactFC } from "@/lib/utils";
import { Spinner, type SpinnerProps } from "@/components/Spinner";

export interface FullPageSpinnerProps extends SpinnerProps {}

export const FullPageSpinner: ReactFC<FullPageSpinnerProps> = ({
  size = "xl",
  ...props
}) => {
  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center">
      <Spinner size={size} {...props} />
    </div>
  );
};
