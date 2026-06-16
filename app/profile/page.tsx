"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Camera, Save, LogOut } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    avatar: "",
    district: "Cầu Giấy",
    city: "Hà Nội",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

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
        district: addr?.district || "Cầu Giấy",
        city: addr?.city || "Hà Nội"
      });
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      
      const payload = {
        fullName: formData.fullName,
        avatar: formData.avatar,
        address: {
          city: formData.city,
          district: formData.district
        }
      };

      const res = await axios.patch(`${API_URL}/user/me`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      // Update local storage avatar and name if needed
      auth.avatar = res.data.avatar;
      localStorage.setItem("bookshare_auth_v3", JSON.stringify(auth));
      window.dispatchEvent(new Event("auth-updated"));

      alert("Cập nhật thông tin thành công!");
    } catch (err) {
      alert("Đã xảy ra lỗi khi cập nhật!");
    } finally {
      setSaving(false);
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
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <img src={avatarSrc} alt="Avatar" className={styles.avatar} />
              <div className={styles.avatarOverlay}>
                <Camera size={20} />
              </div>
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>Hồ sơ cá nhân</h1>
              <p className={styles.subtitle}>Quản lý thông tin và cài đặt tài khoản của bạn</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
                  <option value="Cầu Giấy">Cầu Giấy</option>
                  <option value="Đống Đa">Đống Đa</option>
                  <option value="Hai Bà Trưng">Hai Bà Trưng</option>
                  <option value="Hà Đông">Hà Đông</option>
                  <option value="Thanh Xuân">Thanh Xuân</option>
                  <option value="Tây Hồ">Tây Hồ</option>
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
        </form>
      </div>
    </div>
  );
}
