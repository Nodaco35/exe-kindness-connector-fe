"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function AdminRegister() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        fullName,
        email,
        password,
        role: "ADMIN" // Ensure the created user is an admin
      });

      setSuccess("Tạo tài khoản Admin thành công! Chuyển hướng tới đăng nhập...");
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.iconWrapper}>
          <ShieldCheck size={32} />
        </div>
        <h1 className={styles.title}>Admin Registration</h1>
        <p className={styles.subtitle}>Tạo tài khoản quản trị viên mới</p>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Họ và tên</label>
            <input 
              type="text" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading || !!success}>
            {loading ? "Đang xử lý..." : "Đăng ký Admin"}
          </button>
        </form>

        <div className={styles.footer}>
          Đã có tài khoản? 
          <a href="/admin/login">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}
