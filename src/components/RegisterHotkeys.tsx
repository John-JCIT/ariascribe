"use client";
import { useHotkeys } from "react-hotkeys-hook";
import { useTheme } from "next-themes";
import { type Hotkey, type HotkeyId } from "@/config/hotkeys";
import { useAiChatDialog } from "@/hooks/useAiChatDialog";
import { useGlobalStore } from "@/context/GlobalStoreContext";

export const RegisterHotkeys = ({ hotkeys }: { hotkeys: Hotkey[] }) => {
  const { setTheme, theme } = useTheme();
  const { openAiChat } = useAiChatDialog();
  const { toggleCommandPalette } = useGlobalStore();

  // Define all possible handlers using the ID as the key, typed with HotkeyId
  const handlers: Record<HotkeyId, () => void> = {
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    openAiChat: () => {
      openAiChat();
    },
    toggleCommandPalette: toggleCommandPalette,
  };

  return (
    <>
      {hotkeys.map((hotkey) => {
        const handler = handlers[hotkey.id]; // Use hotkey.id for lookup
        if (handler) {
          return (
            <HotkeyHandler
              key={hotkey.id} // Use hotkey.id as the key
              keys={hotkey.keys}
              handler={handler}
            />
          );
        }
        return null;
      })}
    </>
  );
};

// Helper component to handle a single hotkey
const HotkeyHandler = ({
  keys,
  handler,
}: {
  keys: string;
  handler: () => void;
}) => {
  useHotkeys(keys, handler);
  return null; // This component doesn't render anything
};
