"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Star, ArrowRight, BookOpen, Gift, ShieldCheck } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [points, setPoints] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  
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

      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      setPoints(res.data.points || 0);
      setIsPremium(res.data.isPremium || false);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMembership = async () => {
    try {
      setBuying(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      
      await axios.post(`${API_URL}/user/membership`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      alert("Chúc mừng! Bạn đã trở thành thành viên PRO!");
      fetchProfile(); // Refresh points and status
      window.dispatchEvent(new Event("auth-updated")); // Trigger header update
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi mua gói!");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Đổi Điểm Thưởng</h1>
          <p className={styles.subtitle}>Tích lũy điểm khi chia sẻ sách để nhận các đặc quyền đặc biệt.</p>
          
          <div className={styles.pointsPill}>
            <Star className={styles.pointsIcon} size={24} />
            <span className={styles.pointsValue}>{points}</span>
            <span className={styles.pointsLabel}>Điểm hiện tại</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          <div className={styles.rulesCard}>
            <h3>Cách tích lũy điểm</h3>
            <ul className={styles.rulesList}>
              <li>
                <div className={styles.ruleIconWrapper} style={{ backgroundColor: "var(--success-bg)", color: "var(--success-text)" }}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Đăng sách mới</strong>
                  <p>Mỗi cuốn sách bạn đăng lên hệ thống.</p>
                </div>
                <span className={styles.rulePoints}>+10</span>
              </li>
              <li>
                <div className={styles.ruleIconWrapper} style={{ backgroundColor: "var(--primary-light-bg)", color: "var(--primary)" }}>
                  <Gift size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Tặng sách thành công</strong>
                  <p>Khi bạn chấp nhận yêu cầu xin sách.</p>
                </div>
                <span className={styles.rulePoints}>+50</span>
              </li>
              <li>
                <div className={styles.ruleIconWrapper} style={{ backgroundColor: "var(--amber-bg)", color: "var(--amber-text)" }}>
                  <Star size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Nhận sách thành công</strong>
                  <p>Khi yêu cầu xin sách của bạn được chấp nhận.</p>
                </div>
                <span className={styles.rulePoints}>+25</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={`${styles.membershipCard} ${isPremium ? styles.premiumActive : ""}`}>
            <div className={styles.cardHeader}>
              <Crown className={styles.crownIcon} size={32} />
              <h2>Gói Tháng PRO</h2>
              {isPremium && <span className={styles.activeBadge}>Đang kích hoạt</span>}
            </div>
            
            <p className={styles.cardDesc}>Tận hưởng tất cả các tính năng cao cấp của Kindness Connector không giới hạn.</p>
            
            <ul className={styles.featuresList}>
              <li><ShieldCheck size={18} /> Nhắn tin ưu tiên</li>
              <li><ShieldCheck size={18} /> Huy hiệu PRO nổi bật</li>
              <li><ShieldCheck size={18} /> Được đề xuất sách tự động</li>
            </ul>

            <div className={styles.cardAction}>
              <div className={styles.cost}>
                <strong>2000</strong>
                <span>điểm / tháng</span>
              </div>
              <button 
                className={styles.buyBtn} 
                onClick={handleBuyMembership}
                disabled={buying || points < 2000 || isPremium}
              >
                {buying ? "Đang xử lý..." : isPremium ? "Đang sử dụng" : "Đổi ngay"}
                {!isPremium && <ArrowRight size={18} />}
              </button>
            </div>
            
            {points < 2000 && !isPremium && (
              <p className={styles.errorText}>Bạn cần thêm {2000 - points} điểm để đổi gói này.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
