"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { BookOpen, KeyRound } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import styles from "../login/page.module.scss";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email,
      });

      if (response.data && response.data.message) {
        setMessage(response.data.message);
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
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
          <h1 className={styles.title}>Khôi phục mật khẩu</h1>
          <p className={styles.subtitle}>Nhập email của bạn để nhận liên kết khôi phục</p>
        </div>

        <form className={styles.form} onSubmit={handleResetPassword}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.error} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)' }}>{message}</div>}
          
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

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Đang gửi..." : (
              <>
                <KeyRound size={18} /> Gửi liên kết
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Nhớ lại mật khẩu?
          <Link href="/login" className={styles.link}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
