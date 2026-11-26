"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const INTERNAL_ROUTES = ["/admin", "/settings", "/business-case/methodology", "/ja/business-case/methodology"];

export function PublicSectionScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const internalRoute = INTERNAL_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    if (internalRoute) return;

    const root = document.documentElement;
    const marked = new Set<HTMLElement>();
    let frame = 0;

    const markSections = () => {
      frame = 0;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("main section, .site > section"),
      ).filter((section) => !section.parentElement?.closest("section"));

      sections.forEach((section) => {
        section.dataset.pvSnapSection = "";
        marked.add(section);
      });
    };

    const scheduleMark = () => {
      if (frame) return;
      frame = requestAnimationFrame(markSections);
    };

    root.classList.add("pv-public-section-scroll");
    markSections();

    const observer = new MutationObserver(scheduleMark);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      marked.forEach((section) => delete section.dataset.pvSnapSection);
      root.classList.remove("pv-public-section-scroll");
    };
  }, [pathname]);

  return null;
}
