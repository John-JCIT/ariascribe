"use client";

import * as React from "react";
import { KbdShortcutsList } from "@/components/KbdShortcutsList";
import { hotkeys, userHotkeys, type Hotkey } from "@/config/hotkeys";
import { SettingsPanel } from "./SettingsPanel";

export function SettingsTabShortcuts() {
  // Group hotkeys by their group
  const groupedHotkeys = React.useMemo(() => {
    const groups: Record<string, Hotkey[]> = {};

    [...hotkeys, ...userHotkeys].forEach((hotkey) => {
      if (!groups[hotkey.group]) {
        groups[hotkey.group] = [];
      }
      // Now groups[hotkey.group] is guaranteed to exist
      groups[hotkey.group]!.push(hotkey);
    });

    return groups;
  }, []);

  // Convert hotkeys to format expected by KbdShortcutsList
  // const shortcutItems = React.useMemo(() => {
  //   const items: Array<{
  //     label: string;
  //     shortcuts: string[];
  //   }> = [];

  //   Object.entries(groupedHotkeys).forEach(([group, groupHotkeys]) => {
  //     // Add group header
  //     items.push({
  //       label: group,
  //       shortcuts: [],
  //     });

  //     // Add hotkeys in this group
  //     groupHotkeys.forEach((hotkey) => {
  //       items.push({
  //         label: hotkey.title,
  //         shortcuts: hotkey.keys.split("+"),
  //       });
  //     });
  //   });

  //   return items;
  // }, [groupedHotkeys]);

  return (
    <SettingsPanel
      title="Keyboard Shortcuts"
      description="Customize how you navigate and interact with the application."
    >
      {Object.entries(groupedHotkeys).map(([group, groupHotkeys]) => {
        const items = groupHotkeys.map((hotkey) => ({
          label: hotkey.title,
          shortcuts: hotkey.keys.split("+"),
        }));

        return (
          <div key={group} className="mb-6 last:mb-0">
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {group}
            </h3>
            <KbdShortcutsList shortcuts={items} />
          </div>
        );
      })}
    </SettingsPanel>
  );
}
