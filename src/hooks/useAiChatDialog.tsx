"use client";

import * as React from "react";
import { useDialog } from "@/components/DialogManager";
import { AiChat } from "@/components/ai/AiChat";

export function useAiChatDialog() {
  const dialog = useDialog();

  const openAiChat = React.useCallback(() => {
    dialog.openDialog({
      showCancel: false,
      showCloseButton: false,
      size: "xl", // Let's make it extra large for chat
      component: ({ close }: { close: () => void }) => (
        <div className="max-h-[80vh] overflow-auto">
          <AiChat />
        </div>
      ),
    });
  }, [dialog]);

  return { openAiChat };
}
