"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SiteTextureToggle() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;
    const shouldDisableTexture = pathname === "/videos";

    body.classList.toggle("no-site-texture", shouldDisableTexture);

    return () => {
      body.classList.remove("no-site-texture");
    };
  }, [pathname]);

  return null;
}
