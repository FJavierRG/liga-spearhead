import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/config";

const sizeClasses = {
  nav: "h-8 w-8",
  login: "h-[5.5rem] w-[5.5rem] scale-[1.3]",
} as const;

interface LigaLogoProps {
  size?: keyof typeof sizeClasses;
  className?: string;
  priority?: boolean;
}

export function LigaLogo({
  size = "nav",
  className,
  priority = false,
}: LigaLogoProps) {
  return (
    <img
      src={assetPath("/assets/logoshsevilla.png")}
      alt="Liga Sevilla"
      width={512}
      height={512}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("object-contain", sizeClasses[size], className)}
    />
  );
}
