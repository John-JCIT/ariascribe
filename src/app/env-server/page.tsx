"use client";

import { api } from "@/trpc/react";
import { Spinner } from "@/components/Spinner";

export default function EnvDebugPage() {
  const { data, isPending, error } = api.admin.getEnvVars.useQuery();

  if (isPending) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-red-500">
        Error: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-2xl font-bold">Environment Variables</h1>

      {/* Picked server vars */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Server</h2>
        <div className="rounded-md bg-gray-100 p-4 shadow dark:bg-gray-800">
          <pre className="overflow-x-auto text-sm">
            {Object.entries(data).map(([key, value]) => (
              <div key={key}>{`${key}: ${String(value ?? "")}`}</div>
            ))}
          </pre>
        </div>
      </section>
    </div>
  );
}
