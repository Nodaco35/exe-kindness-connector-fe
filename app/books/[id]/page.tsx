"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState, use } from "react";
import { BookOpen, MapPin, Users, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import styles from "./page.module.scss";

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [auth, setAuth] = useState<any>(null);
  const [bookRequests, setBookRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const authStr = localStorage.getItem("bookshare_auth_v3");
    if (authStr) {
      setAuth(JSON.parse(authStr));
    }
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (!book || !book.images || book.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % book.images.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [book, currentImageIndex]);

  const handlePrevImage = () => {
    if (!book || !book.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? book.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!book || !book.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % book.images.length);
  };

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/book/${id}`);
      setBook(res.data);
    } catch (err: any) {
      setError("Không tìm thấy sách hoặc đã bị xóa.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    try {
      setRequesting(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        alert("Bạn cần đăng nhập để nhận sách!");
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);
      
      await axios.post(`${API_URL}/exchange`, {
        bookId: book._id,
        ownerId: book.owner._id
      }, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      alert("Đã gửi yêu cầu nhận sách thành công!");
      router.push("/requests");
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setRequesting(false);
    }
  };

  const handleManageRequests = async () => {
    if (showRequests) {
      setShowRequests(false);
      return;
    }
    
    try {
      setLoadingRequests(true);
      setShowRequests(true);
      const res = await axios.get(`${API_URL}/exchange/book/${book._id}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setBookRequests(res.data);
    } catch (err) {
      alert("Không thể tải danh sách lượt xin.");
      setShowRequests(false);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateStatus = async (exchangeId: string, status: string) => {
    try {
      await axios.patch(`${API_URL}/exchange/${exchangeId}/status`, { status }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      
      // Update local state
      setBookRequests(prev => prev.map(req => 
        req._id === exchangeId ? { ...req, status } : req
      ));

      if (status === "ACCEPTED") {
        alert("Đã chấp nhận yêu cầu!");
        router.push(`/chat`); // Route to chat
      } else {
        alert("Đã từ chối yêu cầu.");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải...</div></div>;
  }

  if (error || !book) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>{error}</h2>
          <Link href="/" className={styles.backButton}>Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const images = book.images && book.images.length > 0 ? book.images : ["https://ui-avatars.com/api/?name=Book&background=random"];

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.navBack}>
        <ChevronLeft size={20} /> Quay lại
      </button>

      <div className={styles.card}>
        <div className={styles.imageSection}>
          <div className={styles.carouselContainer} style={{ overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                src={images[currentImageIndex]}
                alt={`${book.title} - ảnh ${currentImageIndex + 1}`}
                className={styles.image}
                onError={(e: any) => {
                  e.target.src = "https://ui-avatars.com/api/?name=Book&background=random";
                }}
              />
            </AnimatePresence>
            
            {images.length > 1 && (
              <>
                <button onClick={handlePrevImage} className={`${styles.carouselBtn} ${styles.prev}`}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextImage} className={`${styles.carouselBtn} ${styles.next}`}>
                  <ChevronRight size={20} />
                </button>
                <div className={styles.carouselDots}>
                  {images.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`${styles.dot} ${idx === currentImageIndex ? styles.dotActive : ""}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.badgeGroup}>
            <span className={styles.conditionBadge}>
              {book.codition === "NEW" ? "MỚI" : book.codition === "LIKE_NEW" ? "NHƯ MỚI" : "CŨ"}
            </span>
            <span className={styles.statusBadge}>{book.status || "AVAILABLE"}</span>
          </div>

          <h1 className={styles.title}>{book.title}</h1>
          <p className={styles.author}>Tác giả: {book.author}</p>

          <div className={styles.ownerInfo}>
            <img
              src={book.owner?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
              alt="Owner"
              className={styles.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=User&background=random";
              }}
            />
            <div className={styles.ownerMeta}>
              <p className={styles.ownerName}>{book.owner?.fullName || "Người dùng ẩn danh"}</p>
              <p className={styles.location}>
                <MapPin size={12} className={styles.icon} />
                {book.location?.district || "Hà Nội"}
              </p>
            </div>
          </div>

          <div className={styles.description}>
            <h3>Mô tả</h3>
            <p>{book.description || "Chưa có mô tả chi tiết."}</p>
          </div>

          <div className={styles.actionGroup}>
            {auth?.id === book.owner?._id ? (
              <button 
                className={styles.manageButton}
                onClick={handleManageRequests}
              >
                <Users size={18} /> {showRequests ? "Đóng danh sách" : "Quản lý lượt xin"}
              </button>
            ) : (
              <button 
                className={styles.requestButton}
                onClick={handleRequest}
                disabled={requesting}
              >
                <Users size={18} /> {requesting ? "Đang gửi..." : "Nhận sách này"}
              </button>
            )}
            <button className={styles.iconButton}>
              <Heart size={20} />
            </button>
            <button className={styles.iconButton}>
              <Share2 size={20} />
            </button>
          </div>

          {showRequests && auth?.id === book.owner?._id && (
            <div className={styles.requestsSection}>
              <h3>Danh sách người xin sách</h3>
              {loadingRequests ? (
                <p>Đang tải...</p>
              ) : bookRequests.length === 0 ? (
                <p className={styles.empty}>Chưa có ai xin cuốn sách này.</p>
              ) : (
                <div className={styles.requestList}>
                  {bookRequests.map((req) => (
                    <div key={req._id} className={styles.requestItem}>
                      <img src={req.requester.avatar || "https://ui-avatars.com/api/?name=U"} alt="" className={styles.reqAvatar} />
                      <div className={styles.reqInfo}>
                        <strong>{req.requester.fullName}</strong>
                        <span>{req.status}</span>
                      </div>
                      <div className={styles.reqActions}>
                        {req.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleUpdateStatus(req._id, "ACCEPTED")} className={styles.acceptBtn}>Chấp nhận</button>
                            <button onClick={() => handleUpdateStatus(req._id, "REJECTED")} className={styles.rejectBtn}>Từ chối</button>
                          </>
                        )}
                        {req.status === 'ACCEPTED' && (
                          <button onClick={() => router.push(`/chat?room=${req.chatRoomId}`)} className={styles.chatBtn}>Nhắn tin</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
