"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Star, ArrowLeft } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import styles from "./page.module.scss";

export default function PublicProfilePage() {
  const router = useRouter();
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Tải thông tin cá nhân công khai
      const userRes = await axios.get(`${API_URL}/user/${userId}/public-profile`);
      setProfile(userRes.data);

      // 2. Tải danh sách sách công khai của người dùng này (đã loại bỏ HIDDEN)
      const booksRes = await axios.get(`${API_URL}/book?owner=${userId}`);
      setBooks(booksRes.data);
    } catch (err: any) {
      console.error("Lỗi lấy thông tin công khai", err);
      setError(err.response?.data?.message || "Không thể tải hồ sơ người dùng này.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải hồ sơ...</div></div>;
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <p>{error || "Không tìm thấy người dùng!"}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.avatar || "https://ui-avatars.com/api/?name=" + (profile.fullName || "User");

  return (
    <div className={styles.container}>
      {/* Nút Quay Lại */}
      <button onClick={() => router.back()} className={styles.backLink}>
        <ArrowLeft size={16} /> Quay lại trang trước
      </button>

      {/* Thẻ Hồ Sơ */}
      <div className={styles.profileCard}>
        <div className={styles.profileInfo}>
          <img 
            src={avatarSrc} 
            alt={profile.fullName} 
            className={styles.avatar} 
          />
          <div className={styles.details}>
            <h1 className={styles.name}>{profile.fullName}</h1>
            <div className={styles.reputation}>
              <Star size={16} className={styles.starIcon} />
              <span>Điểm uy tín: <strong>{profile.reputationScore || 0}</strong></span>
            </div>
            <p className={styles.bio}>
              {profile.bio || "Người dùng này chưa cập nhật tiểu sử."}
            </p>
          </div>
        </div>
      </div>

      {/* Sách Đang Đăng */}
      <div className={styles.booksSection}>
        <h2 className={styles.sectionTitle}>
          <BookOpen size={22} />
          Sách đang chia sẻ ({books.length})
        </h2>

        {books.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Người dùng này hiện không chia sẻ cuốn sách công khai nào.</p>
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {books.map((book) => (
              <motion.div 
                key={book._id} 
                className={styles.bookCard}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/books/${book._id}`)}
              >
                <img 
                  src={book.images?.[0] || "/placeholder-book.png"} 
                  alt={book.title} 
                  className={styles.bookImage}
                />
                <div className={styles.bookDetails}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                  <span className={`${styles.statusBadge} ${book.status === "AVAILABLE" ? styles.available : styles.requested}`}>
                    {book.status === "AVAILABLE" ? "Sẵn sàng" : "Đang yêu cầu"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
