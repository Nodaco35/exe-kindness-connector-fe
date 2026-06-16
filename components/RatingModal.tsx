"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import styles from "./RatingModal.module.scss";

interface RatingModalProps {
  exchangeId: string;
  reviewedUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatingModal({ exchangeId, reviewedUserId, onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Vui lòng chọn số sao đánh giá");
    if (!comment.trim()) return alert("Vui lòng nhập nhận xét");

    setLoading(true);
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.post(
        `${API_URL}/review`,
        {
          exchangeId,
          reviewedUserId,
          ratingScore: rating,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      alert("Đánh giá thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Đã xảy ra lỗi khi gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Đánh giá người dùng</h2>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= (hoverRating || rating) ? styles.active : ""}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star fill={star <= (hoverRating || rating) ? "currentColor" : "none"} size={32} />
            </button>
          ))}
        </div>
        <textarea
          className={styles.comment}
          placeholder="Nhập nhận xét của bạn về trải nghiệm với người này..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading || rating === 0 || !comment.trim()}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
