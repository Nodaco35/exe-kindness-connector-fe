"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Star, ArrowRight, BookOpen, Gift, ShieldCheck, X, Copy, Check, Sparkles } from "lucide-react";
import axios from "axios";
import { API_URL } from "@/config/api";
import styles from "./page.module.scss";

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [points, setPoints] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    bankAccount: string;
    bankName: string;
    amount: number;
    orderInvoiceNumber: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    let interval: any;
    if (showModal && !isPremium) {
      interval = setInterval(async () => {
        await fetchProfile(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showModal, isPremium]);

  useEffect(() => {
    if (isPremium && showModal) {
      setShowModal(false);
      alert("Kích hoạt Premium thành công! Chúc mừng bạn đã trở thành thành viên PRO.");
    }
  }, [isPremium, showModal]);

  const fetchProfile = async (isSilent: boolean = false) => {
    try {
      if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  };

  const handleBuyMembershipByPoints = async () => {
    try {
      setBuying(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.post(`${API_URL}/user/membership`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      alert("Chúc mừng! Bạn đã đổi điểm thành công và trở thành thành viên PRO!");
      await fetchProfile();
      window.dispatchEvent(new Event("auth-updated"));
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi đổi điểm!");
    } finally {
      setBuying(false);
    }
  };

  const handleBuyMembershipByMoney = async () => {
    try {
      setPaying(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      const response = await axios.post(
        `${API_URL}/membership/checkout`,
        {
          successUrl: `${window.location.origin}/rewards?payment=success`,
          errorUrl: `${window.location.origin}/rewards?payment=error`,
          cancelUrl: `${window.location.origin}/rewards?payment=cancel`,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` }
        }
      );

      const { qrUrl, bankAccount, bankName, amount, orderInvoiceNumber } = response.data;
      setQrData({ qrUrl, bankAccount, bankName, amount, orderInvoiceNumber });
      setShowModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi tạo thanh toán SePay!");
    } finally {
      setPaying(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!qrData) return;
    try {
      const mockPayload = {
        id: Math.floor(Math.random() * 10000000) + 100000,
        gateway: qrData.bankName,
        transactionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
        accountNumber: qrData.bankAccount,
        code: null,
        content: qrData.orderInvoiceNumber,
        transferType: "in",
        transferAmount: qrData.amount,
        accumulated: 10000000,
        subAccount: null,
        referenceCode: "MOCKREF" + Date.now(),
        description: `Mock payment for ${qrData.orderInvoiceNumber}`
      };

      // Call our simple webhook handler endpoint
      await axios.post(`${API_URL}/membership/webhook/sepay`, mockPayload);
      await fetchProfile();
    } catch (err: any) {
      alert("Lỗi khi giả lập thanh toán: " + (err.response?.data?.message || err.message));
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải...</div></div>;
  }

  const membershipPrice = qrData?.amount || 50000;

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroDotGrid} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Đổi Điểm Thưởng</h1>
          <p className={styles.subtitle}>Tích lũy điểm khi chia sẻ sách để nhận các đặc quyền đặc biệt.</p>

          <div className={styles.pointsPill}>
            <div className={styles.pointsPillGlow} />
            <Star className={styles.pointsIcon} size={28} />
            <span className={styles.pointsValue}>{points}</span>
            <span className={styles.pointsLabel}>Điểm hiện tại</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          <div className={styles.exchangeCard}>
            <div className={styles.cardGlow} />
            <div className={styles.cardDotGrid} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleTopLeft}`} size={20} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleBottomRight}`} size={20} />

            <h3>Cách tích lũy điểm</h3>
            <ul className={styles.rulesList}>
              <li className={styles.ruleItem}>
                <div className={`${styles.ruleIconWrapper} ${styles.ruleIconSuccess}`}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Đăng sách mới</strong>
                  <p>Mỗi cuốn sách bạn đăng lên hệ thống.</p>
                </div>
                <span className={`${styles.rulePoints} ${styles.pointsSuccess}`}>+10</span>
              </li>
              <li className={styles.ruleItem}>
                <div className={`${styles.ruleIconWrapper} ${styles.ruleIconPrimary}`}>
                  <Gift size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Tặng sách thành công</strong>
                  <p>Khi bạn chấp nhận yêu cầu xin sách.</p>
                </div>
                <span className={`${styles.rulePoints} ${styles.pointsPrimary}`}>+50</span>
              </li>
              <li className={styles.ruleItem}>
                <div className={`${styles.ruleIconWrapper} ${styles.ruleIconAmber}`}>
                  <Star size={20} />
                </div>
                <div className={styles.ruleInfo}>
                  <strong>Nhận sách thành công</strong>
                  <p>Khi yêu cầu xin sách của bạn được chấp nhận.</p>
                </div>
                <span className={`${styles.rulePoints} ${styles.pointsAmber}`}>+25</span>
              </li>
            </ul>
          </div>

          <div className={styles.exchangeCard}>
            <div className={styles.cardGlow} />
            <div className={styles.cardDotGrid} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleTopLeft}`} size={20} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleBottomRight}`} size={20} />
            
            <h3>Đổi điểm lấy membership</h3>
            <p>Bạn có thể dùng điểm để đổi nhanh membership nếu đủ 2.000 điểm.</p>
            <div className={styles.cardAction}>
              <div className={styles.cost}>
                <strong>2.000</strong>
                <span>điểm</span>
              </div>
              <button
                className={styles.buyBtn}
                onClick={handleBuyMembershipByPoints}
                disabled={buying || points < 2000 || isPremium}
              >
                {buying ? "Đang xử lý..." : isPremium ? "Đang sử dụng" : "Đổi bằng điểm"}
                {!isPremium && <ArrowRight size={18} />}
              </button>
            </div>
            {points < 2000 && !isPremium && (
              <p className={styles.errorText}>Bạn cần thêm {2000 - points} điểm để đổi gói này.</p>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={`${styles.membershipCard} ${isPremium ? styles.premiumActive : ""}`}>
            {isPremium && <div className={styles.shimmerSweep} />}
            <div className={styles.cardGlow} />
            <div className={styles.cardDotGrid} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleTopLeft}`} size={20} />
            <Sparkles className={`${styles.sparkleDecor} ${styles.sparkleBottomRight}`} size={20} />

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
                <strong>{membershipPrice.toLocaleString("vi-VN")}</strong>
                <span>VND / tháng</span>
              </div>
              <button
                className={styles.buyBtn}
                onClick={handleBuyMembershipByMoney}
                disabled={paying || isPremium}
              >
                {paying ? "Đang xử lý..." : isPremium ? "Đang sử dụng" : "Thanh toán"}
                {!isPremium && <ArrowRight size={18} />}
              </button>
            </div>

            <p className={styles.errorText}>Thanh toán qua chuyển khoản ngân hàng. Membership sẽ được kích hoạt sau khi giao dịch được xác nhận.</p>
          </div>
        </div>
      </div>

      {/* Modal QR Code Thanh Toán */}
      {showModal && qrData && typeof qrData === "object" && qrData.qrUrl && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <div className={styles.modalHeader}>
              <Crown className={styles.crownIcon} size={28} />
              <h3>Thanh toán Membership PRO</h3>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.qrSection}>
                <div className={styles.qrWrapper}>
                  {qrData.qrUrl && (
                    <img src={qrData.qrUrl} alt="VietQR SePay" className={styles.qrImage} />
                  )}
                </div>
                <p className={styles.qrHelpText}>Quét mã QR bằng ứng dụng Ngân hàng của bạn để thanh toán tự động</p>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>Thông tin chuyển khoản</h4>

                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Ngân hàng</span>
                    <span className={styles.infoValue}>{qrData?.bankName || ""}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Số tài khoản</span>
                    <div className={styles.copyableValue}>
                      <span className={styles.infoValue}>{qrData?.bankAccount || ""}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(qrData?.bankAccount || "", 'bankAccount')}
                      >
                        {copiedField === 'bankAccount' ? <Check size={16} className={styles.checkIcon} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Số tiền</span>
                    <span className={`${styles.infoValue} ${styles.priceAmount}`}>
                      {(qrData?.amount ?? 50000).toLocaleString("vi-VN")} VND
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nội dung</span>
                    <div className={styles.copyableValue}>
                      <span className={`${styles.infoValue} ${styles.invoiceCode}`}>
                        {qrData?.orderInvoiceNumber || ""}
                      </span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(qrData?.orderInvoiceNumber || "", 'invoice')}
                      >
                        {copiedField === 'invoice' ? <Check size={16} className={styles.checkIcon} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.statusBox}>
                  <div className={styles.statusSpinner}></div>
                  <span>Hệ thống đang tự động kiểm tra giao dịch của bạn...</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
