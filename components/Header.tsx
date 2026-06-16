"use client";

import { API_URL } from "@/config/api";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus, LogOut, Crown, Bell } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import styles from "./Header.module.scss";

type StoredAuth = {
  isLoggedIn: boolean;
  token: string;
  avatar?: string;
  role?: string;
};

const parseStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("bookshare_auth_v3");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<StoredAuth>;
    if (!parsed?.isLoggedIn || !parsed?.token) return null;

    return {
      isLoggedIn: true,
      token: parsed.token,
      avatar: parsed.avatar,
      role: parsed.role,
    };
  } catch {
    return null;
  }
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [auth, setAuth] = useState<StoredAuth | null>(null);

  const clearAuthState = useCallback(() => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("bookshare_auth_v3");
    setAuth(null);
    setPoints(0);
    setIsPremium(false);
  }, []);

  useEffect(() => {
    const fetchUserData = async (token: string, candidateAuth: StoredAuth) => {
      try {
        const res = await axios.get(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAuth(candidateAuth);
        setPoints(res.data.points || 0);
        setIsPremium(res.data.isPremium || false);
      } catch (error: unknown) {
        console.error("Failed to fetch user data", error);
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          clearAuthState();
        }
      }
    };

    const initializeAuth = async () => {
      const storedAuth = parseStoredAuth();
      if (!storedAuth) {
        clearAuthState();
        return;
      }

      await fetchUserData(storedAuth.token, storedAuth);
    };

    void initializeAuth();

    const handleAuthUpdate = () => {
      void initializeAuth();
    };

    window.addEventListener("auth-updated", handleAuthUpdate);
    return () => {
      window.removeEventListener("auth-updated", handleAuthUpdate);
    };
  }, [clearAuthState]);

  const handleLogout = () => {
    clearAuthState();
    window.dispatchEvent(new Event("auth-updated"));
    router.push("/login");
  };

  const isChatRoom = pathname.startsWith("/chat/") && pathname !== "/chat";
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  const navItems = [
    { name: "Khám phá", path: "/" },
    { name: "Đăng tặng", path: "/post" },
    { name: "Tin nhắn", path: "/chat" },
  ];

  if (auth?.role === "ADMIN") {
    navItems.push({ name: "Admin", path: "/admin" });
  }

  if (isChatRoom) {
    return (
      <header className={`${styles.header} ${styles.desktopOnly}`}>
        <div className={styles.headerContainer}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandName}>Kindness Connector</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  if (isAuthPage) {
    return (
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandName}>Kindness Connector</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Kindness Connector</span>
          </Link>

          <nav className={styles.desktopNav}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className={styles.activeIndicator}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.rightSection}>
          {auth?.isLoggedIn ? (
            <>
              <div className={styles.pointsPill} onClick={() => router.push("/rewards")}>
                <span>🪙</span>
                <span>{points} pts</span>
              </div>

              <Link
                href="/requests"
                className={`${styles.chatIcon} ${pathname.startsWith("/requests") ? styles.chatIconActive : ""}`}
                title="Quản lý lượt xin"
              >
                <Bell size={18} />
              </Link>

              <Link
                href="/chat"
                className={`${styles.chatIcon} ${pathname.startsWith("/chat") ? styles.chatIconActive : ""}`}
                title="Tin nhắn"
              >
                <MessageCircle size={18} />
                <span className={styles.chatBadge} />
              </Link>

              <Link href="/post" className={styles.postButton}>
                <Plus size={14} />
                <span>Đăng sách</span>
              </Link>

              <div className={styles.divider} />

              <div className={styles.profileSection}>
                <Link href="/profile" className={styles.avatar}>
                  <img src={auth.avatar || "https://i.pravatar.cc/150?u=99"} alt="Avatar" />
                  {isPremium && (
                    <div className={styles.premiumBadge}>
                      <Crown size={10} strokeWidth={3} />
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} title="Đăng xuất" className={styles.logoutButton}>
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.authActions}>
              <Link href="/login" className={styles.loginButton}>
                Đăng nhập để trao đổi
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Đăng ký ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
