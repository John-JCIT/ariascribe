import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ReactFC, cn } from "@/lib/utils";
import { Drawer } from "vaul";
import { DrawerContext } from "@/components/DrawerContext";
import { useControlledOpen } from "@/hooks/useControlledOpen";

export interface BottomDrawerClassNames {
  overlay?: string;
  content?: string;
  handle?: string;
  title?: string;
  headerWrapper?: string;
  childrenWrapper?: string;
}

export interface BottomDrawerProps {
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  classNames?: BottomDrawerClassNames;
  renderHeader?:
    | ((props: {
        handle: React.ReactNode;
        close: () => void;
      }) => React.ReactNode)
    | null;
}

export const BottomDrawer: ReactFC<BottomDrawerProps> = ({
  children,
  title,
  open,
  onOpenChange,
  trigger,
  classNames,
  renderHeader,
}) => {
  const { isOpen, setIsOpen, close } = useControlledOpen({
    open,
    onOpenChange,
  });

  const handle = (
    <div
      className={cn(
        "mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700",
        classNames?.handle,
      )}
    />
  );

  const defaultHeader = (
    <>
      {handle}
      <Drawer.Title className={cn(
          "mb-4 text-lg font-semibold text-zinc-900 dark:text-white",
          classNames?.title,
          !title && "sr-only"
        )}>
        {title || "Drawer"}
      </Drawer.Title>
    </>
  );

  const noHeader = renderHeader === null;

  return (
    <DrawerContext.Provider value={{ close }}>
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 0.95 }}
              exit={{ scale: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="pointer-events-none fixed inset-0 z-30"
            >
              <div className="h-full w-full origin-top">
                <div className="h-full overflow-hidden">
                  <div className="opacity-0">{trigger}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Overlay
            className={cn(
              "fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md dark:bg-black/60",
              classNames?.overlay,
            )}
          />
          <Drawer.Content
            className={cn(
              "fixed right-0 bottom-0 left-0 z-[9999] mx-auto flex w-[95%] flex-col rounded-t-[10px] bg-white dark:bg-zinc-900",
              "dark:border-t dark:border-zinc-800",
              "max-w-[500px]",
              classNames?.content,
              {
                "pt-6": !noHeader,
              },
            )}
          >
            {!noHeader && (
              <div
                className={cn(
                  "rounded-t-[10px] bg-white px-4 dark:bg-zinc-900",
                  classNames?.headerWrapper,
                )}
              >
                {renderHeader ? renderHeader({ handle, close }) : defaultHeader}
              </div>
            )}
            <div
              className={cn(
                "flex-1 overflow-y-auto bg-white px-4 pt-0 pb-6 md:pb-2 dark:bg-zinc-900",
                noHeader && "rounded-t-[10px] pt-6",
                classNames?.childrenWrapper,
              )}
            >
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </DrawerContext.Provider>
  );
};
