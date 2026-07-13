"use client";

import { API_URL } from "@/config/api";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus, LogOut, Crown, Bell, Menu, X, BookMarked, Sparkles, User, Coins, Search, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSocket } from "./SocketProvider";
import { useNotificationStore } from "@/store/useNotificationStore";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const socket = useSocket();
  const notifications = useNotificationStore(state => state.notifications);
  const unreadNotificationCount = notifications.filter(n => !n.isRead && n.type === 'BOOK_REQUEST').length;

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadChatCount = useCallback(async () => {
    const storedAuth = parseStoredAuth();
    if (!storedAuth) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${storedAuth.token}` },
      });
      setUnreadChatCount(res.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread chat count", error);
    }
  }, []);

  useEffect(() => {
    if (auth?.isLoggedIn) {
      void fetchUnreadChatCount();

      const interval = setInterval(() => {
        void fetchUnreadChatCount();
      }, 15000);

      window.addEventListener("unread-count-updated", fetchUnreadChatCount);

      if (socket) {
        const handleNewMessage = () => fetchUnreadChatCount();
        const handleNewNotification = (data: any) => {
          if (data.type === 'CHAT_MESSAGE') {
            fetchUnreadChatCount();
          }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('new_notification', handleNewNotification);

        return () => {
          clearInterval(interval);
          window.removeEventListener("unread-count-updated", fetchUnreadChatCount);
          socket.off('newMessage', handleNewMessage);
          socket.off('new_notification', handleNewNotification);
        };
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener("unread-count-updated", fetchUnreadChatCount);
      };
    } else {
      setUnreadChatCount(0);
    }
  }, [auth, fetchUnreadChatCount, socket]);

  const handleTestNotification = () => {
    const targetUserId = prompt("Nhập ID người dùng muốn gửi thông báo test:");
    if (targetUserId && socket) {
      socket.emit("test_send_notification", { targetUserId });
    }
  };

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
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isChatRoom = pathname.startsWith("/chat/") && pathname !== "/chat";
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  const navItems: { name: string; path: string }[] = [];

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

        <form 
            className={styles.searchFormDesktop} 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const q = formData.get('q');
              if (q) router.push(`/search?q=${encodeURIComponent(q.toString())}`);
            }}
          >
            <Search size={16} className={styles.searchIconInput} />
            <input 
              name="q" 
              placeholder="Tìm kiếm sách..." 
              className={styles.searchInputField}
              defaultValue={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : ''}
            />
          </form>

        <div className={styles.rightSection}>
          <div className={styles.desktopActions}>
            {auth?.isLoggedIn ? (
              <>
                <Link
                  href="/rewards"
                  className={`${styles.unifiedMembershipButton} ${isPremium ? styles.premiumActive : ""} ${pathname === "/rewards" ? styles.active : ""}`}
                  title="Membership & Điểm"
                >
                  <div className={styles.ptsPart}>
                    <span>{points}</span>
                    <Coins size={14} />
                  </div>
                  <div className={styles.dividerLine} />
                  <div className={styles.proPart}>
                    <Crown size={14} className={styles.crownIcon} />
                    <span>{isPremium ? "PRO Active" : "Gói PRO"}</span>
                  </div>
                </Link>

                <Link
                  href="/requests"
                  onClick={() => {
                    if (unreadNotificationCount > 0 && auth) {
                      axios.patch(`${API_URL}/notification/read-all`, {}, { headers: { Authorization: `Bearer ${auth.token}` } })
                        .then(() => useNotificationStore.setState({ notifications: notifications.map(n => ({ ...n, isRead: true })) }))
                        .catch(console.error);
                    }
                  }}
                  className={`${styles.chatIcon} ${pathname.startsWith("/requests") ? styles.chatIconActive : ""}`}
                  title="Quản lý lượt xin"
                >
                  <Bell size={18} />
                  {unreadNotificationCount > 0 && <span className={styles.chatBadge} />}
                </Link>

                <Link
                  href="/my-books"
                  className={`${styles.chatIcon} ${pathname.startsWith("/my-books") ? styles.chatIconActive : ""}`}
                  title="Sách của tôi"
                >
                  <BookMarked size={18} />
                </Link>

                <Link
                  href="/chat"
                  className={`${styles.chatIcon} ${pathname.startsWith("/chat") ? styles.chatIconActive : ""}`}
                  title="Tin nhắn"
                >
                  <MessageCircle size={18} />
                  {unreadChatCount > 0 && (
                    <span className={styles.chatCountBadge}>{unreadChatCount}</span>
                  )}
                </Link>

                <div className={styles.btnSparkleWrapper}>
                  <Link href="/post" className={styles.btnSparkle}>
                    <Plus size={16} className={styles.sparkleIcon} />
                    <span>Đăng sách</span>
                  </Link>
                </div>

                <div className={styles.divider} />

                <div className={styles.profileSection} ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                    className={`${styles.avatar} ${isPremium ? styles.premiumAvatar : ""}`}
                    title="Menu tài khoản"
                  >
                    {auth.avatar && !auth.avatar.includes("pravatar.cc") ? (
                      <img src={auth.avatar} alt="Avatar" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <User size={20} color="white" />
                      </div>
                    )}
                    {isPremium && (
                      <>
                        <div className={styles.premiumCrownWrapper}>
                          <Crown size={14} className={styles.premiumCrownIcon} />
                        </div>
                        <span className={styles.premiumGlowRing} />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className={styles.dropdownMenu}
                      >
                        <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          <User size={16} />
                          <span>Xem profile</span>
                        </Link>
                        <Link href="/my-books" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          <BookMarked size={16} />
                          <span>Quản lý sách</span>
                        </Link>
                        <Link href="/requests" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          <Bell size={16} />
                          <span>Quản lý lượt xin</span>
                        </Link>
                        <Link href="/profile?tab=transactions" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          <History size={16} />
                          <span>Lịch sử giao dịch</span>
                        </Link>
                        <div className={styles.dropdownDivider} />
                        <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} className={`${styles.dropdownItem} ${styles.logoutDropdownItem}`}>
                          <LogOut size={16} className={styles.logoutIconColor} />
                          <span>Đăng xuất</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className={styles.authActions}>
                <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className={styles.loginButton}>
                  Đăng nhập để trao đổi
                </Link>
                <Link href="/register" className={styles.registerButton}>
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>

          <div className={styles.mobileActions}>
            {auth?.isLoggedIn && (
              <Link
                href="/requests"
                onClick={() => {
                  if (unreadNotificationCount > 0 && auth) {
                    axios.patch(`${API_URL}/notification/read-all`, {}, { headers: { Authorization: `Bearer ${auth.token}` } })
                      .then(() => useNotificationStore.setState({ notifications: notifications.map(n => ({ ...n, isRead: true })) }))
                      .catch(console.error);
                  }
                }}
                className={`${styles.chatIcon} ${pathname.startsWith("/requests") ? styles.chatIconActive : ""}`}
                title="Quản lý lượt xin"
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && <span className={styles.chatBadge} />}
              </Link>
            )}

            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sidebar/Dropdown */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={styles.mobileMenu}
        >
          <div className={styles.mobileNavItems}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={closeMobileMenu}
                  className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className={styles.mobileMenuDivider} />

          {auth?.isLoggedIn ? (
            <div className={styles.mobileUserActions}>
              <div className={styles.mobileUserInfo}>
                <Link href="/profile" className={`${styles.mobileAvatar} ${isPremium ? styles.premiumAvatar : ""}`} onClick={closeMobileMenu}>
                  {auth.avatar && !auth.avatar.includes("pravatar.cc") ? (
                    <img src={auth.avatar} alt="Avatar" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <User size={20} color="white" />
                    </div>
                  )}
                  {isPremium && (
                    <>
                      <div className={styles.premiumCrownWrapper}>
                        <Crown size={14} className={styles.premiumCrownIcon} />
                      </div>
                      <span className={styles.premiumGlowRing} />
                    </>
                  )}
                </Link>
              </div>

              <Link href="/rewards" onClick={closeMobileMenu} className={`${styles.mobileActionButton} ${styles.mobileUnifiedButton} ${isPremium ? styles.mobilePremiumActive : ""}`}>
                <span className={styles.mobilePtsPart} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{points}</span>
                  <Coins size={14} />
                </span>
                <span className={styles.mobileDivider}>•</span>
                <span className={styles.mobileProPart}>
                  <Crown size={14} className={styles.mobileCrownIcon} />
                  <span>{isPremium ? "Tài khoản PRO" : "Đăng ký PRO"}</span>
                </span>
              </Link>

              <Link href="/profile" onClick={closeMobileMenu} className={styles.mobileActionButton}>
                <User size={16} /> Xem profile
              </Link>

              <Link href="/post" onClick={closeMobileMenu} className={`${styles.mobileActionButton} ${styles.mobilePostButton} ${styles.btnSparkleMobile}`}>
                <Plus size={16} /> Đăng sách mới
              </Link>

              <Link href="/chat" onClick={closeMobileMenu} className={styles.mobileActionButton}>
                <MessageCircle size={16} /> Tin nhắn
                {unreadChatCount > 0 && <span className={styles.mobileUnreadBadge}>{unreadChatCount}</span>}
              </Link>

              <Link href="/my-books" onClick={closeMobileMenu} className={styles.mobileActionButton}>
                <BookMarked size={16} /> Sách của tôi
              </Link>

              <Link href="/requests" onClick={closeMobileMenu} className={styles.mobileActionButton}>
                <Bell size={16} /> Quản lý lượt xin
                {unreadNotificationCount > 0 && <span className={styles.mobileUnreadBadge}>{unreadNotificationCount}</span>}
              </Link>

              <Link href="/profile?tab=transactions" onClick={closeMobileMenu} className={styles.mobileActionButton}>
                <History size={16} /> Lịch sử giao dịch
              </Link>

              <button onClick={handleLogout} className={`${styles.mobileActionButton} ${styles.mobileLogoutButton}`}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className={styles.mobileAuthActions}>
              <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} onClick={closeMobileMenu} className={styles.mobileLoginButton}>
                Đăng nhập
              </Link>
              <Link href="/register" onClick={closeMobileMenu} className={styles.mobileRegisterButton}>
                Đăng ký ngay
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </header>
  );
}
