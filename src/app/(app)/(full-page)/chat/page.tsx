"use client";

import { AiChat } from "@/components/ai/AiChat";

export default function ChatPage() {
  return (
    <AiChat
      classNames={{
        root: "m-4 mx-auto w-full max-w-[var(--container-max-width)]",
      }}
    />
  );
}
