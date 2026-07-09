"use client";

import { API_URL } from "@/config/api";
import { HANOI_DISTRICTS } from "@/config/districts";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  MapPin, 
  Camera, 
  Save, 
  LogOut, 
  Heart, 
  Key, 
  BookOpen, 
  HeartOff,
  UserCheck,
  History
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.scss";

type TabType = "info" | "favorites" | "password" | "transactions";

function ProfileComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>("info");
  
  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [exchangesLoading, setExchangesLoading] = useState(false);

  // Data States
  const [authData, setAuthData] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [exchanges, setExchanges] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: "",
    avatar: "",
    bio: "",
    district: "Quận Cầu Giấy",
    city: "Hà Nội",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchFavorites(); // Tải sách đã thích khi vừa mount trang để hiển thị đúng số lượng ngay từ đầu
  }, []);

  useEffect(() => {
    if (tabParam === "transactions" || tabParam === "favorites" || tabParam === "password" || tabParam === "info") {
      setActiveTab(tabParam as TabType);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchFavorites();
    } else if (activeTab === "transactions") {
      fetchExchanges();
    }
  }, [activeTab]);

  const fetchExchanges = async () => {
    try {
      setExchangesLoading(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) return;
      const auth = JSON.parse(authStr);

      const res = await axios.get(`${API_URL}/exchange`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setExchanges(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách giao dịch", err);
    } finally {
      setExchangesLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);
      setAuthData(auth);

      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      const user = res.data;
      const addr = user.address && user.address.length > 0 ? user.address[0] : null;
      
      setFormData({
        fullName: user.fullName || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
        district: addr?.district || "Quận Cầu Giấy",
        city: addr?.city || "Hà Nội"
      });

      // Đặt số lượng sách đã thích lấy từ backend API (được đếm qua totalFavoritedBooks)
      if (user.totalFavoritedBooks !== undefined) {
        setFavoritesCount(user.totalFavoritedBooks);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setFavLoading(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) return;
      const auth = JSON.parse(authStr);

      const res = await axios.get(`${API_URL}/book/favorites`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setFavorites(res.data);
      setFavoritesCount(res.data.length); // Cập nhật lại số lượng theo thực tế
    } catch (err) {
      console.error("Lỗi lấy danh sách yêu thích", err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleUnlike = async (bookId: string) => {
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) return;
      const auth = JSON.parse(authStr);

      // API toggleLike - Gọi lại sẽ bỏ thích
      await axios.post(`${API_URL}/book/${bookId}/like`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      // Xóa khỏi danh sách favorites ở client
      setFavorites(prev => prev.filter(b => b._id !== bookId));
      setFavoritesCount(prev => Math.max(0, prev - 1)); // Giảm đi 1 khi bỏ thích thành công
    } catch (err) {
      console.error("Không thể bỏ thích", err);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: any) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      
      const payload = {
        fullName: formData.fullName,
        avatar: formData.avatar,
        bio: formData.bio,
        address: {
          city: formData.city,
          district: formData.district
        }
      };

      const res = await axios.patch(`${API_URL}/user/me`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      // Cập nhật avatar/name trong local storage
      auth.avatar = res.data.avatar;
      auth.fullName = res.data.fullName;
      localStorage.setItem("bookshare_auth_v3", JSON.stringify(auth));
      window.dispatchEvent(new Event("auth-updated"));

      alert("Cập nhật thông tin thành công!");
    } catch (err) {
      alert("Đã xảy ra lỗi khi cập nhật!");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setChangingPassword(true);
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.patch(
        `${API_URL}/user/me/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` }
        }
      );

      alert("Đổi mật khẩu thành công!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Mật khẩu hiện tại không đúng!");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bookshare_auth_v3");
    window.dispatchEvent(new Event("auth-updated"));
    router.push("/login");
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải...</div></div>;
  }

  const avatarSrc = formData.avatar || "https://ui-avatars.com/api/?name=" + (formData.fullName || "User");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <img src={avatarSrc} alt="Avatar" className={styles.avatar} />
              <div className={styles.avatarOverlay}>
                <Camera size={20} />
              </div>
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>{formData.fullName || "Tài khoản của tôi"}</h1>
              <p className={styles.subtitle}>Quản lý thông tin cá nhân và sách đã thả tim</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>

        {/* Tab Buttons */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "info" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <User size={16} /> Thông tin cá nhân
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "favorites" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            <Heart size={16} /> Sách đã tim ({favoritesCount})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "transactions" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            <History size={16} /> Lịch sử giao dịch
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "password" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <Key size={16} /> Đổi mật khẩu
          </button>
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          <AnimatePresence mode="wait">
            
            {/* 1. INFO TAB */}
            {activeTab === "info" && (
              <motion.form 
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmitProfile} 
                className={styles.form}
              >
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Họ và tên</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tiểu sử (Bio)</label>
                  <div className={styles.inputWrapper}>
                    <UserCheck className={styles.inputIcon} size={18} style={{ alignSelf: "flex-start", marginTop: "0.8rem" }} />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Chia sẻ vài điều về sở thích đọc sách của bạn..."
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Link Avatar (URL)</label>
                  <div className={styles.inputWrapper}>
                    <Camera className={styles.inputIcon} size={18} />
                    <input
                      type="url"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://example.com/avatar.jpg"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.rowGroup}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Khu vực (Quận)</label>
                    <div className={styles.inputWrapper}>
                      <MapPin className={styles.inputIcon} size={18} />
                      <select 
                        name="district" 
                        value={formData.district} 
                        onChange={handleChange}
                        className={styles.select}
                      >
                        {((): React.ReactNode[] => {
                          const baseDistricts = [...HANOI_DISTRICTS];
                          if (formData.district && !baseDistricts.includes(formData.district)) {
                            baseDistricts.push(formData.district);
                          }
                          return baseDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Thành phố</label>
                    <div className={styles.inputWrapper}>
                      <MapPin className={styles.inputIcon} size={18} />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        className={styles.input}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" disabled={saving} className={styles.submitBtn}>
                    <Save size={18} />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </motion.form>
            )}

            {/* 2. FAVORITES TAB */}
            {activeTab === "favorites" && (
              <motion.div 
                key="favorites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.favoritesSection}
              >
                <h3 className={styles.sectionTitle}>Sách đã thích</h3>
                {favLoading ? (
                  <div className={styles.subLoading}>Đang tải danh sách sách yêu thích...</div>
                ) : favorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Heart size={40} className={styles.emptyIcon} />
                    <p>Bạn chưa thả tim cho cuốn sách nào!</p>
                  </div>
                ) : (
                  <div className={styles.favoritesGrid}>
                    <AnimatePresence>
                      {favorites.map((book) => (
                        <motion.div 
                          key={book._id} 
                          className={styles.favCard}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8, y: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img 
                            src={book.images?.[0] || "/placeholder-book.png"} 
                            alt={book.title} 
                            className={styles.favImage}
                            onClick={() => router.push(`/books/${book._id}`)}
                          />
                          <div className={styles.favInfo}>
                            <h4 
                              className={styles.favTitle} 
                              onClick={() => router.push(`/books/${book._id}`)}
                            >
                              {book.title}
                            </h4>
                            <p className={styles.favAuthor}>{book.author}</p>
                            
                            {book.owner && (
                              <div className={styles.favOwner}>
                                <img 
                                  src={book.owner.avatar || "https://ui-avatars.com/api/?name=" + book.owner.fullName} 
                                  alt={book.owner.fullName} 
                                  className={styles.ownerAvatar} 
                                />
                                <span className={styles.ownerName}>{book.owner.fullName}</span>
                              </div>
                            )}

                            <button 
                              onClick={() => handleUnlike(book._id)}
                              className={styles.unlikeBtn}
                              title="Bỏ thích"
                            >
                              <HeartOff size={14} /> Bỏ thích
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. PASSWORD TAB */}
            {activeTab === "password" && (
              <motion.form 
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmitPassword} 
                className={styles.form}
              >
                <h3 className={styles.sectionTitle}>Thay đổi mật khẩu đăng nhập</h3>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Mật khẩu hiện tại</label>
                  <div className={styles.inputWrapper}>
                    <Key className={styles.inputIcon} size={18} />
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Mật khẩu mới</label>
                  <div className={styles.inputWrapper}>
                    <Key className={styles.inputIcon} size={18} />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="•••••••• (Tối thiểu 6 ký tự)"
                      className={styles.input}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Xác nhận mật khẩu mới</label>
                  <div className={styles.inputWrapper}>
                    <Key className={styles.inputIcon} size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" disabled={changingPassword} className={styles.submitBtn}>
                    <Save size={18} />
                    {changingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </motion.form>
            )}

            {/* 4. TRANSACTIONS TAB */}
            {activeTab === "transactions" && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.transactionsSection}
              >
                <h3 className={styles.sectionTitle}>Lịch sử giao dịch</h3>
                {exchangesLoading ? (
                  <div className={styles.subLoading}>Đang tải lịch sử giao dịch...</div>
                ) : exchanges.length === 0 ? (
                  <div className={styles.emptyState}>
                    <History size={40} className={styles.emptyIcon} />
                    <p>Bạn chưa thực hiện giao dịch nào!</p>
                  </div>
                ) : (
                  <div className={styles.exchangesList}>
                    {exchanges.map((ex) => {
                      const isOwner = ex.owner?._id === authData?.id;
                      const partner = isOwner ? ex.requester : ex.owner;
                      const roleLabel = isOwner ? "Tặng sách" : "Nhận sách";
                      const dateStr = new Date(ex.createdAt).toLocaleDateString("vi-VN");
                      
                      return (
                        <div key={ex._id} className={styles.exchangeCard}>
                          <img 
                            src={ex.book?.images?.[0] || "/placeholder-book.png"} 
                            alt={ex.book?.title} 
                            className={styles.bookImg}
                          />
                          <div className={styles.exchangeInfo}>
                            <h4 className={styles.bookTitle}>{ex.book?.title || "Sách đã bị xóa"}</h4>
                            <p className={styles.partnerName}>
                              {isOwner ? "Người nhận: " : "Người tặng: "}
                              <strong>{partner?.fullName || "Người dùng ẩn danh"}</strong>
                            </p>
                            <span className={`${styles.roleBadge} ${isOwner ? styles.giver : styles.receiver}`}>
                              {roleLabel}
                            </span>
                          </div>
                          <div className={styles.exchangeStatusDate}>
                            <span className={`${styles.statusBadge} ${styles[ex.status]}`}>
                              {ex.status === "PENDING" && "Đang chờ"}
                              {ex.status === "ACCEPTED" && "Đã chấp nhận"}
                              {ex.status === "REJECTED" && "Đã từ chối"}
                              {ex.status === "CANCELED" && "Đã hủy"}
                              {ex.status === "COMPLETED" && "Thành công"}
                            </span>
                            <span className={styles.exchangeDate}>{dateStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.loading}>Đang tải trang cá nhân...</div></div>}>
      <ProfileComponent />
    </Suspense>
  );
}
