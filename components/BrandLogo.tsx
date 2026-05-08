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
      src={isIcon ? "/images/logo-perfil-whatsapp.png" : "/images/logo-horizontal.png"}
      alt="Zap Faturamento"
      width={isIcon ? 52 : 440}
      height={isIcon ? 52 : 88}
      priority={priority}
      className={className}
    />
  );
}
