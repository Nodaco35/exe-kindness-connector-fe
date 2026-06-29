"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogIn } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import styles from "./page.module.scss";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data && response.data.access_token) {
        // Save to localStorage
        localStorage.setItem(
          "bookshare_auth_v3",
          JSON.stringify({
            isLoggedIn: true,
            id: response.data.user._id,
            email: response.data.user.email,
            role: response.data.user.role,
            avatar: response.data.user.avatar || ("https://ui-avatars.com/api/?name=" + (response.data.user.fullName || response.data.user.email || "User")),
            token: response.data.access_token,
          })
        );
        window.dispatchEvent(new Event("auth-updated"));
        
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl") || "/";
        router.push(callbackUrl);
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <BookOpen size={24} />
          </div>
          <h1 className={styles.title}>Chào mừng trở lại</h1>
          <p className={styles.subtitle}>Đăng nhập để tiếp tục trao đổi sách</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@example.com"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className="flex justify-between items-center w-full">
              <label className={styles.label}>Mật khẩu</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
              required
            />
            <Link href="/forgot-password" className={styles.forgotPassword}>
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Đang xử lý..." : (
              <>
                <LogIn size={18} /> Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Chưa có tài khoản?
          <Link href="/register" className={styles.link}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
