"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function AdminLogin() {
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
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user, access_token } = res.data;

      if (user.role !== "ADMIN") {
        setError("Tài khoản này không có quyền truy cập Admin Dashboard.");
        setLoading(false);
        return;
      }

      const authData = {
        token: access_token,
        userId: user._id,
        role: user.role,
        fullName: user.fullName,
      };

      localStorage.setItem("bookshare_auth_v3", JSON.stringify(authData));
      router.push("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.iconWrapper}>
          <ShieldAlert size={32} />
        </div>
        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.subtitle}>Đăng nhập để quản trị hệ thống</p>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Mật khẩu</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div className={styles.footer}>
          Chưa có tài khoản Admin? 
          <a href="/admin/register">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  );
}
