"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { MockUserSwitcher } from "@/components/auth/mock-user-switcher";
import { LigaLogo } from "@/components/icons/liga-logo";
import type { User } from "@/types/database";

interface NavbarProps {
  profile?: User | null;
}

export function Navbar({ profile }: NavbarProps) {
  return (
    <header className="sticky top-[var(--demo-banner-height,0px)] z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display flex items-center gap-2.5 text-sm font-semibold tracking-wide text-[var(--foreground)]"
        >
          <LigaLogo size="nav" className="shrink-0" />
          Liga Sevilla
          <span className="font-normal text-[var(--muted)]">AoS: Spearhead</span>
        </Link>

        <div className="flex items-center gap-2">
          <MockUserSwitcher currentUserId={profile?.id} />
          <AuthButton profile={profile} />
        </div>
      </div>
    </header>
  );
}
