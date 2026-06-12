import Image from "next/image";

type BrandLogoProps = {
  variant?: "horizontal" | "icon";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "horizontal",
  className = "",
  priority = false
}: BrandLogoProps) {
  const isIcon = variant === "icon";

  return (
    <Image
      src="/images/kreo-logo.png"
      alt="Whats Redirect"
      width={isIcon ? 52 : 200}
      height={isIcon ? 52 : 60}
      priority={priority}
      className={className}
    />
  );
}
