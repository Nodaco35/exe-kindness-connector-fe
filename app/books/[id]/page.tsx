"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState, use } from "react";
import { BookOpen, MapPin, Users, Heart, Share2, ChevronLeft, ChevronRight, X, History, Award } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import styles from "./page.module.scss";

const getDurationText = (start: string, end?: string) => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffTime = endDate.getTime() - startDate.getTime();
  
  if (diffTime <= 0) return "";
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) return "vài phút";
    return `${diffHours} giờ`;
  }
  
  if (diffDays < 30) {
    return `${diffDays} ngày`;
  }
  
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  
  if (remainingDays === 0) {
    return `${months} tháng`;
  }
  return `${months} tháng ${remainingDays} ngày`;
};

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

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const pathname = usePathname();
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [donorExchanges, setDonorExchanges] = useState<any[]>([]);
  const [loadingDonorData, setLoadingDonorData] = useState(false);

  const handleOpenDonorModal = async () => {
    if (!book?.owner?._id) return;
    setIsDonorModalOpen(true);
    setLoadingDonorData(true);
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const headers = authStr ? { Authorization: `Bearer ${JSON.parse(authStr).token}` } : {};

      // Fetch public profile
      const profileRes = await axios.get(`${API_URL}/user/${book.owner._id}/public-profile`, { headers });
      setDonorProfile(profileRes.data);

      // Fetch exchange history (requires auth)
      if (authStr) {
        const exchangesRes = await axios.get(`${API_URL}/exchange/user/${book.owner._id}`, { headers });
        setDonorExchanges(exchangesRes.data);
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin người cho sách:", err);
    } finally {
      setLoadingDonorData(false);
    }
  };

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
      setLikesCount(res.data.likes?.length || 0);

      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (authStr) {
        const authData = JSON.parse(authStr);
        setIsLiked(res.data.likes?.includes(authData.id) || false);
      }

      // Fetch comments too
      const commentsRes = await axios.get(`${API_URL}/comment/book/${id}`);
      setComments(commentsRes.data);
    } catch (err: any) {
      setError("Không tìm thấy sách hoặc đã bị xóa.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const authStr = localStorage.getItem("bookshare_auth_v3");
    if (!authStr) {
      alert("Bạn cần đăng nhập để like!");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const authData = JSON.parse(authStr);
    
    // Optimistic Update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      await axios.post(`${API_URL}/book/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
    } catch (err) {
      // Revert if error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      alert("Lỗi khi like sách.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Đã copy đường dẫn!");
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const authStr = localStorage.getItem("bookshare_auth_v3");
    if (!authStr) {
      alert("Bạn cần đăng nhập để bình luận!");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const authData = JSON.parse(authStr);
    
    try {
      setSubmittingComment(true);
      const res = await axios.post(`${API_URL}/comment/book/${id}`, { content: commentText }, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      setComments(prev => [res.data, ...prev]);
      setCommentText("");
    } catch (err) {
      alert("Lỗi khi gửi bình luận.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRequest = async () => {
    try {
      setRequesting(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        alert("Bạn cần đăng nhập để nhận sách!");
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
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

          <div className={styles.ownerInfo} onClick={handleOpenDonorModal} title="Xem trang cá nhân người cho sách" style={{ cursor: "pointer" }}>
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

          {/* Vòng đời của sách (Lịch sử sở hữu) */}
          {book.ownershipHistory && book.ownershipHistory.length > 0 && (
            <div className={styles.lifecycleSection}>
              <h3>Vòng đời của sách</h3>
              <div className={styles.timeline}>
                {book.ownershipHistory.map((item: any, idx: number) => {
                  const isCurrent = idx === book.ownershipHistory.length - 1;
                  const duration = getDurationText(item.acquiredAt, item.releasedAt);
                  
                  return (
                    <div key={idx} className={`${styles.timelineItem} ${isCurrent ? styles.active : ""}`}>
                      <div className={styles.timelinePoint} />
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <div className={styles.timelineOwner}>
                            <img 
                              src={item.owner?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
                              alt={item.owner?.fullName || "Chủ cũ"} 
                              className={styles.timelineAvatar}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=User&background=random";
                              }}
                            />
                            <strong>{item.owner?.fullName || "Người dùng ẩn danh"}</strong>
                          </div>
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {idx === 0 && <span className={styles.firstOwnerBadge}>Chủ sở hữu đầu tiên</span>}
                            {isCurrent && <span className={styles.currentBadge}>Chủ sở hữu hiện tại</span>}
                          </div>
                        </div>
                        <p className={styles.timelineTime}>
                          Sở hữu từ: {new Date(item.acquiredAt).toLocaleDateString("vi-VN")}
                          {item.releasedAt ? ` - ${new Date(item.releasedAt).toLocaleDateString("vi-VN")}` : " - Hiện tại"}
                          {duration && <span className={styles.timelineDuration}> ({duration})</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            <button className={styles.iconButton} onClick={handleLike}>
              <Heart size={20} fill={isLiked ? "red" : "none"} color={isLiked ? "red" : "currentColor"} />
              <span className={styles.count}>{likesCount}</span>
            </button>
            <button className={styles.iconButton} onClick={handleShare}>
              <Share2 size={20} />
            </button>
          </div>

          <div className={styles.commentsSection}>
            <h3>Bình luận ({comments.length})</h3>
            <form className={styles.commentForm} onSubmit={handleSubmitComment}>
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                disabled={submittingComment}
              />
              <button type="submit" disabled={submittingComment || !commentText.trim()}>
                {submittingComment ? "Đang gửi..." : "Gửi"}
              </button>
            </form>
            <div className={styles.commentList}>
              {comments.map((cmt) => (
                <div key={cmt._id} className={styles.commentItem}>
                  <img src={cmt.userId?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" className={styles.cmtAvatar} />
                  <div className={styles.cmtContent}>
                    <div className={styles.cmtHeader}>
                      <strong>{cmt.userId?.fullName || "Người dùng ẩn danh"}</strong>
                      <span>{new Date(cmt.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{cmt.content}</p>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Modal Người cho sách */}
      <AnimatePresence>
        {isDonorModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsDonorModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className={styles.donorModal}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeModalBtn} onClick={() => setIsDonorModalOpen(false)}>
                <X size={20} />
              </button>

              <div className={styles.donorHeader}>
                <img 
                  src={donorProfile?.avatar || book.owner?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
                  alt={donorProfile?.fullName || book.owner?.fullName} 
                  className={styles.donorAvatar}
                />
                <div className={styles.donorMeta}>
                  <h2>{donorProfile?.fullName || book.owner?.fullName}</h2>
                  <div className={styles.reputationScore}>
                    <Award size={16} className={styles.scoreIcon} />
                    <span>Điểm uy tín: <strong>{donorProfile?.reputationScore || 0}</strong></span>
                  </div>
                </div>
              </div>

              {donorProfile?.bio && (
                <div className={styles.donorBio}>
                  <h3>Tiểu sử</h3>
                  <p>{donorProfile.bio}</p>
                </div>
              )}

              <div className={styles.donorHistorySection}>
                <h3>Lịch sử giao dịch</h3>
                {!auth ? (
                  <p className={styles.authPrompt}>
                    Bạn phải <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className={styles.loginLink}>Đăng nhập</Link> để xem lịch sử giao dịch.
                  </p>
                ) : loadingDonorData ? (
                  <p className={styles.loadingText}>Đang tải lịch sử giao dịch...</p>
                ) : donorExchanges.length === 0 ? (
                  <p className={styles.emptyText}>Chưa thực hiện giao dịch nào trên hệ thống.</p>
                ) : (
                  <div className={styles.donorExchangesList}>
                    {donorExchanges.map((ex) => {
                      const isOwner = ex.owner?._id === book.owner._id;
                      const partnerName = isOwner ? ex.requester?.fullName : ex.owner?.fullName;
                      const roleLabel = isOwner ? "Tặng sách" : "Xin sách";
                      const dateStr = new Date(ex.createdAt).toLocaleDateString("vi-VN");

                      return (
                        <div key={ex._id} className={styles.donorExchangeCard}>
                          <div className={styles.donorExchangeInfo}>
                            <h4>{ex.book?.title || "Sách đã bị xóa"}</h4>
                            <p>
                              {roleLabel} • {isOwner ? "Người nhận: " : "Người tặng: "} <strong>{partnerName || "Người dùng ẩn danh"}</strong>
                            </p>
                          </div>
                          <div className={styles.donorExchangeStatusDate}>
                            <span className={`${styles.statusBadge} ${styles[ex.status]}`}>
                              {ex.status === "PENDING" && "Đang chờ"}
                              {ex.status === "ACCEPTED" && "Đã chấp nhận"}
                              {ex.status === "REJECTED" && "Đã từ chối"}
                              {ex.status === "CANCELED" && "Đã hủy"}
                              {ex.status === "COMPLETED" && "Thành công"}
                            </span>
                            <span className={styles.date}>{dateStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
