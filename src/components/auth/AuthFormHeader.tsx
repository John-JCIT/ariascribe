"use client";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ReactNode } from "react";

interface AuthFormHeaderProps {
  title: ReactNode;
  description?: ReactNode;
}

export function AuthFormHeader({ title, description }: AuthFormHeaderProps) {
  return (
    <CardHeader className="vertical center">
      <CardTitle className="text-center text-2xl">{title}</CardTitle>
      {description && (
        <CardDescription className="text-center">{description}</CardDescription>
      )}
    </CardHeader>
  );
}
