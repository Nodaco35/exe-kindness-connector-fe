"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

type StoredAuth = {
  isLoggedIn: boolean;
  token: string;
};

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

const readStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("bookshare_auth_v3");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (!parsed?.isLoggedIn || !parsed?.token) return null;

    return {
      isLoggedIn: true,
      token: parsed.token,
    };
  } catch {
    return null;
  }
};

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    let isMounted = true;

    const validateAuth = async () => {
      const auth = readStoredAuth();
      if (!auth) {
        localStorage.removeItem("bookshare_auth_v3");
        router.replace("/login");
        return;
      }

      try {
        await axios.get(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (isMounted) {
          setVerifiedPath(pathname);
        }
      } catch {
        localStorage.removeItem("bookshare_auth_v3");
        router.replace("/login");
      }
    };

    void validateAuth();

    return () => {
      isMounted = false;
    };
  }, [isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return children;
  }

  if (verifiedPath !== pathname) {
    return null;
  }

  return children;
}
