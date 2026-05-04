import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const NAV_ITEMS = [
  { href: "#solucoes", label: "Soluções" },
  { href: "#recursos", label: "Recursos" },
  { href: "#precos",   label: "Preços"   },
  { href: "#contato",  label: "Contato"  }
];

export function SiteHeader() {
  return (
    <header className="zf-site-header">
      <div className="zf-site-header__inner">
        <Link href="/" className="zf-site-header__brand" aria-label="Zap Faturamento">
          <BrandLogo
            variant="horizontal"
            className="zf-site-header__logo zf-site-header__logo--desktop"
            priority
          />
          <BrandLogo
            variant="icon"
            className="zf-site-header__logo zf-site-header__logo--mobile"
            priority
          />
        </Link>

        <nav className="zf-site-header__nav" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="zf-site-header__link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="zf-site-header__actions">
          <Link href="/login" className="zf-button zf-button--ghost">
            Login
          </Link>
          <Link href="/register" className="zf-button zf-button--primary">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
