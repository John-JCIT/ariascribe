"use client";
import { useTheme } from "next-themes";
import { type ReactFC } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";
import {
  ThemeSwitchMinimal,
  type ThemeSwitchMinimalClassNames,
} from "@/components/ThemeSwitchMinimal";
import { type CustomButtonProps } from "@/components/CustomButton";
import { motion } from "framer-motion";

export interface ThemeSwitchMinimalNextThemesProps {
  className?: string;
  classNames?: ThemeSwitchMinimalClassNames;
  buttonProps?: Partial<CustomButtonProps>;
}

export const ThemeSwitchMinimalNextThemes: ReactFC<
  ThemeSwitchMinimalNextThemesProps
> = ({ className, classNames, buttonProps }) => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <ThemeSwitchMinimal
        theme={theme || "light"}
        setTheme={setTheme}
        className={className}
        classNames={classNames}
        buttonProps={buttonProps}
      />
    </motion.div>
  );
};
