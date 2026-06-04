import { Fragment, Suspense, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import type { AppSession } from "@/lib/dashboard-auth";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { AISupportChat } from "@/components/dashboard/AISupportChat";
import { MobileMenuButton } from "@/components/dashboard/MobileMenuButton";
import { getUserPermissions, type UserPermissions } from "@/lib/permissions";
import { getCachedBillingStatus } from "@/lib/billing";
import { isCrmPlan } from "@/lib/plans";

type ActivePath =
  | "/dashboard"
  | "/dashboard/kanban"
  | "/dashboard/pipeline"
  | "/dashboard/criativos"
  | "/dashboard/campanhas"
  | "/dashboard/grupos"
  | "/dashboard/clinicas"
  | "/dashboard/relatorio"
  | "/dashboard/investimentos"
  | "/dashboard/financeiro"
  | "/dashboard/configuracoes"
  | "/dashboard/configuracoes/whatsapp"
  | "/dashboard/inbox"
  | "/dashboard/admin/business"
  | "/dashboard/respostas-rapidas"
  | "/dashboard/disparos"
  | "/dashboard/formularios"
  | "/dashboard/suporte"
  | "/dashboard/academia"
  | "/dashboard/usuarios"
  | "/dashboard/assinatura";

type DashboardSidebarProps = {
  activePath: ActivePath;
  databaseReady?: boolean;
  user?: AppSession | null;
};

type NavItem = {
  href: ActivePath;
  label: string;
  icon: ReactNode;
  permission?: keyof UserPermissions;
  adminOnly?: boolean;
  notEnvAdmin?: boolean;
  badge?: string;
  hiddenForCrm?: boolean;
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    section: "Gerenciamento",
    items: [
      {
        href: "/dashboard",
        label: "Visão Geral",
        permission: "dashboard",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M2 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM2 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
          </svg>
        )
      },
      {
        href: "/dashboard/clinicas",
        label: "Clientes",
        permission: "clientes",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        )
      },
      {
        href: "/dashboard/campanhas",
        label: "Campanhas",
        permission: "campanhas_view",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
          </svg>
        )
      },
      {
        href: "/dashboard/criativos",
        label: "Criativos",
        permission: "criativos",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.001z" />
          </svg>
        )
      },
      {
        href: "/dashboard/formularios",
        label: "Lead Express",
        permission: "formularios_view",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      }
    ]
  },
  {
    section: "Vendas",
    items: [
      {
        href: "/dashboard/kanban",
        label: "Leads (Kanban)",
        permission: "kanban",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M2 3a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm7 0a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1V3z" />
          </svg>
        )
      },
      {
        href: "/dashboard/pipeline",
        label: "Pipeline",
        permission: "kanban",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
          </svg>
        )
      }
    ]
  },
  {
    section: "WhatsApp",
    items: [
      {
        href: "/dashboard/configuracoes/whatsapp",
        label: "Conexões",
        permission: "conexoes",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )
      },
      {
        href: "/dashboard/inbox",
        label: "Conversas",
        permission: "conexoes",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        )
      },
      {
        href: "/dashboard/disparos",
        label: "Envios em Massa",
        permission: "disparos",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        )
      },
      {
        href: "/dashboard/grupos",
        label: "Grupos",
        permission: "campanhas_view",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
          </svg>
        )
      },
      {
        href: "/dashboard/respostas-rapidas",
        label: "Respostas Rápidas",
        permission: "conexoes",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        )
      }
    ]
  },
  {
    section: "Análise",
    items: [
      {
        href: "/dashboard/relatorio",
        label: "Relatórios",
        permission: "relatorio",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
        )
      },
      {
        href: "/dashboard/financeiro",
        label: "Financeiro",
        permission: "investimentos",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        )
      },
      {
        href: "/dashboard/investimentos",
        label: "Investimentos",
        permission: "investimentos",
        hiddenForCrm: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        )
      }
    ]
  },
  {
    section: "Sistema",
    items: [
      {
        href: "/dashboard/academia",
        label: "Como Usar",
        badge: "Guia",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        )
      },
      {
        href: "/dashboard/usuarios",
        label: "Equipe",
        adminOnly: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
          </svg>
        )
      },
      {
        href: "/dashboard/configuracoes",
        label: "Configurações",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        )
      },
      {
        href: "/dashboard/assinatura",
        label: "Assinatura",
        adminOnly: true,
        notEnvAdmin: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6.5 6.5a1 1 0 101.414 1.414l6.5-6.5a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
          </svg>
        )
      },
      {
        href: "/dashboard/suporte",
        label: "Suporte",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
      }
    ]
  }
];

export async function DashboardSidebar({
  activePath,
  databaseReady = false,
  user
}: DashboardSidebarProps) {
  const permissions = user
    ? await getUserPermissions(user.id, user.role)
    : null;

  const isAdmin = user?.role === "agency_admin" || user?.kind === "env_admin";
  const isEnvAdmin = user?.kind === "env_admin";

  const billing = user ? await getCachedBillingStatus(user.id).catch(() => null) : null;
  const isCrm = isCrmPlan(billing?.subscriptionPlan);

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.hiddenForCrm && isCrm) return false;
      if (item.adminOnly && !isAdmin) return false;
      if (item.notEnvAdmin && isEnvAdmin) return false;
      if (!item.permission) return true;
      if (!permissions) return false;
      return permissions[item.permission] === true;
    })
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="dashboard-sidebar">
      <MobileMenuButton />
      <div className="dashboard-sidebar__stack">
        <div className="sidebar-brand">
          <div className="sidebar-brand__text">
            <BrandLogo variant="horizontal" className="sidebar-brand__logo" priority />
            <span className="sidebar-brand__tagline">
              Growth OS para WhatsApp, CRM e faturamento
            </span>
          </div>
        </div>

        <nav className="dashboard-nav">
          {filteredGroups.map((group) => (
            <Fragment key={group.section}>
              <span className="nav-section-label">{group.section}</span>
              {group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`dashboard-nav__item${
                    activePath === item.href ? " dashboard-nav__item--active" : ""
                  }`}
                >
                  {item.icon}
                  <strong>{item.label}</strong>
                  {item.badge && (
                    <span style={{
                      marginLeft: "auto",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      background: "var(--brand)",
                      color: "#fff",
                      borderRadius: 4,
                      padding: "1px 6px",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </a>
              ))}
            </Fragment>
          ))}
        </nav>
      </div>

      <div className="dashboard-sidebar__meta">
        <Suspense fallback={null}>
          <TrialBanner userId={user?.id} planKind={user?.kind} />
        </Suspense>
        <div className="sidebar-user">
          <span className="sidebar-user__email">{user?.email ?? "Não autenticado"}</span>
          <span className="sidebar-user__role">
            {user?.role === "agency_admin" ? "Agency Admin" : "Client User"}
          </span>
        </div>
        <div className="sidebar-db-status">
          <span className={`sidebar-db-dot${databaseReady ? " sidebar-db-dot--active" : ""}`} />
          <span>{databaseReady ? "Banco conectado" : "Banco não configurado"}</span>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="dashboard-button dashboard-button--ghost"
            style={{ width: "100%", fontSize: "0.78rem", height: 34, marginTop: 6 }}
          >
            Sair da conta
          </button>
        </form>
      </div>

      <AISupportChat />
    </aside>
  );
}
