"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import axios from "axios";
import { API_URL } from "@/config/api";
import styles from "./page.module.scss";

export default function TestGetDotEnvPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);

      const res = await axios.get(`${API_URL}/membership/env-config`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      setConfig(res.data);
    } catch (err: any) {
      console.error("Lỗi khi tải cấu hình:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      } else {
        setError(err.response?.data?.message || err.message || "Không thể kết nối với server.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConfig(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu cấu hình .env...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/rewards")}>
          <ArrowLeft size={16} /> Quay lại trang Rewards
        </button>
        <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : ""} /> Làm mới
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <ShieldAlert size={28} className={styles.headerIcon} />
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Kiểm tra cấu hình .env (Backend)</h1>
            <p className={styles.subtitle}>Hiển thị trực tiếp các biến môi trường thực tế đang chạy trên Render</p>
          </div>
        </div>

        {error ? (
          <div className={styles.errorBox}>
            <AlertCircle size={20} />
            <div className={styles.errorText}>
              <strong>Lỗi tải cấu hình:</strong> {error}
              <p className={styles.errorHelp}>Hãy đảm bảo bạn đã đẩy code backend mới lên Render và server đã chạy thành công.</p>
            </div>
          </div>
        ) : config ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên biến (Key)</th>
                  <th>Giá trị cấu hình (Value)</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(config).map(([key, val]: any) => {
                  const isUndefined = String(val).includes("Chưa") || String(val).includes("UNDEFINED");
                  return (
                    <tr key={key} className={isUndefined ? styles.rowError : ""}>
                      <td className={styles.keyCol}>{key}</td>
                      <td className={styles.valCol}>
                        <code className={styles.code}>{val}</code>
                      </td>
                      <td className={styles.statusCol}>
                        {isUndefined ? (
                          <span className={styles.badgeError}>Thiếu / Lỗi</span>
                        ) : (
                          <span className={styles.badgeSuccess}>
                            <CheckCircle size={12} /> Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>Không tìm thấy dữ liệu cấu hình.</p>
        )}

        <div className={styles.footerNote}>
          <p>⚠️ <strong>Lưu ý bảo mật:</strong> Các biến môi trường nhạy cảm như MONGODB_URI và SEPAY_MERCHANT_SECRET_KEY đã được mã hóa tự động để đảm bảo an toàn.</p>
        </div>
      </div>
    </div>
  );
}
