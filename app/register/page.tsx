"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, UserPlus } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import styles from "../login/page.module.scss";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        fullName,
        role: "GUEST", // Default role
        status: "ACTIVE", // Default status
      });

      // Auto login after register
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (loginRes.data && loginRes.data.access_token) {
        localStorage.setItem(
          "bookshare_auth_v3",
          JSON.stringify({
            isLoggedIn: true,
            id: loginRes.data.user._id,
            email: loginRes.data.user.email,
            role: loginRes.data.user.role,
            avatar: loginRes.data.user.avatar || ("https://ui-avatars.com/api/?name=" + (loginRes.data.user.fullName || loginRes.data.user.email || "User")),
            token: loginRes.data.access_token,
          })
        );
        window.dispatchEvent(new Event("auth-updated"));
        router.push("/");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Email đã tồn tại trong hệ thống.");
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
          <h1 className={styles.title}>Tạo tài khoản</h1>
          <p className={styles.subtitle}>Bắt đầu hành trình trao đổi tri thức</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={styles.input}
              required
            />
          </div>

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
            <label className={styles.label}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Đang xử lý..." : (
              <>
                <UserPlus size={18} /> Đăng ký
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Đã có tài khoản?
          <Link href="/login" className={styles.link}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
