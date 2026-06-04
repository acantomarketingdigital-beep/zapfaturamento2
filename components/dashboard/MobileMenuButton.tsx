"use client";

export function MobileMenuButton() {
  function open() {
    document.querySelector(".dashboard-sidebar")?.setAttribute("data-open", "");
    document.body.style.overflow = "hidden";
  }

  function close() {
    document.querySelector(".dashboard-sidebar")?.removeAttribute("data-open");
    document.body.style.overflow = "";
  }

  return (
    <>
      {/* Hamburger — position:fixed via CSS, visible even when sidebar is off-screen */}
      <button
        className="mobile-menu-open-btn"
        onClick={open}
        type="button"
        aria-label="Abrir menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Backdrop — covers main content while sidebar is open */}
      <div className="mobile-sidebar-backdrop" onClick={close} />

      {/* Close button — visible inside sidebar on mobile */}
      <button
        className="mobile-menu-close-btn"
        onClick={close}
        type="button"
        aria-label="Fechar menu"
      >
        ✕
      </button>
    </>
  );
}
