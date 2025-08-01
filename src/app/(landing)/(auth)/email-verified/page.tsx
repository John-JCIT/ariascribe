import { CustomButton } from "@/components/CustomButton";
import { use } from "react";

export default function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = use(searchParams);

  if (error) {
    return (
      <div className="flex grow flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-2xl font-bold text-red-500">
          Error verifying email 🥲
        </h1>
        <CustomButton href="/signin">Try again</CustomButton>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold text-green-500">
        Email Verified!
      </h1>
      <p className="mb-4 text-gray-600">
        Your email has been successfully verified.
      </p>
      <CustomButton href="/signin">Login</CustomButton>
    </div>
  );
}
