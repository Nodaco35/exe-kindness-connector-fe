"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Star, ArrowRight, BookOpen, Gift, ShieldCheck, Copy, Check } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [points, setPoints] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"points" | "sepay">("points");
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);

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
      const premiumStatus = res.data.isPremium || false;
      setIsPremium(premiumStatus);

      // Fetch QR info
      await fetchQrInfo(auth.token);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQrInfo = async (token: string) => {
    try {
      setLoadingQr(true);
      const res = await axios.get(`${API_URL}/membership/qr-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrInfo(res.data);
    } catch (err) {
      console.error("Lỗi khi tải thông tin QR SePay:", err);
    } finally {
      setLoadingQr(false);
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

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleCheckPayment = async () => {
    try {
      setCheckingPayment(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) return;
      const auth = JSON.parse(authStr);

      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      const updatedPremium = res.data.isPremium || false;
      setIsPremium(updatedPremium);
      
      if (updatedPremium) {
        alert("Chúc mừng! Hệ thống đã nhận được giao dịch. Tài khoản của bạn đã được nâng cấp lên PRO!");
        window.dispatchEvent(new Event("auth-updated"));
      } else {
        alert("Hệ thống chưa nhận được giao dịch. Bạn vui lòng đợi 1-2 phút hoặc kiểm tra lại thông tin chuyển khoản.");
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán!");
    } finally {
      setCheckingPayment(false);
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

            <div className={styles.tabsContainer}>
              <button 
                type="button"
                className={`${styles.tabBtn} ${activeTab === "points" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("points")}
              >
                🪙 Đổi bằng điểm
              </button>
              <button 
                type="button"
                className={`${styles.tabBtn} ${activeTab === "sepay" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("sepay")}
              >
                💳 Chuyển khoản QR
              </button>
            </div>

            {activeTab === "points" ? (
              <div className={styles.tabContent}>
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
            ) : (
              <div className={styles.tabContent}>
                {isPremium ? (
                  <div className={styles.premiumSuccess}>
                    <ShieldCheck className={styles.successIcon} size={48} />
                    <h3>Bạn đã là thành viên PRO!</h3>
                    <p>Cảm ơn bạn đã đồng hành và hỗ trợ cộng đồng Kindness Connector.</p>
                  </div>
                ) : loadingQr ? (
                  <div className={styles.qrLoader}>Đang tạo mã thanh toán QR...</div>
                ) : (qrInfo && typeof qrInfo === "object" && qrInfo.qrUrl && qrInfo.bankAccount) ? (
                  <div className={styles.sepayContainer}>
                    <div className={styles.qrWrapper}>
                      {qrInfo.qrUrl && (
                        <img src={qrInfo.qrUrl} alt="SePay VietQR" className={styles.qrImage} />
                      )}
                    </div>
                    
                    <div className={styles.paymentDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Ngân hàng</span>
                        <strong className={styles.detailVal}>{qrInfo?.bankName || ""}</strong>
                      </div>
                      
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Số tài khoản</span>
                        <div className={styles.detailValWithCopy}>
                          <strong>{qrInfo?.bankAccount || ""}</strong>
                          <button 
                            type="button" 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy(qrInfo?.bankAccount || "", "account")}
                          >
                            {copiedText === "account" ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Số tiền</span>
                        <strong className={styles.detailVal} style={{ color: "var(--primary)" }}>
                          {(qrInfo?.amount ?? 5000).toLocaleString("vi-VN")} đ
                        </strong>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Nội dung chuyển khoản</span>
                        <div className={styles.detailValWithCopy}>
                          <strong className={styles.highlightText}>{qrInfo?.description || ""}</strong>
                          <button 
                            type="button" 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy(qrInfo?.description || "", "desc")}
                          >
                            {copiedText === "desc" ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={styles.warningAlert}>
                      <p>⚠️ <strong>LƯU Ý QUAN TRỌNG:</strong> Bạn phải điền đúng 100% nội dung chuyển khoản <strong>{qrInfo?.description || ""}</strong> để hệ thống tự động nhận diện và kích hoạt PRO trong 1-2 phút.</p>
                    </div>

                    <button 
                      type="button" 
                      className={styles.checkPaymentBtn} 
                      onClick={handleCheckPayment}
                      disabled={checkingPayment}
                    >
                      {checkingPayment ? "Đang kiểm tra..." : "Tôi đã chuyển khoản thành công"}
                    </button>
                  </div>
                ) : (
                  <p className={styles.errorText}>Không thể kết nối với cổng thanh toán SePay. Vui lòng tải lại trang hoặc thử lại sau!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
