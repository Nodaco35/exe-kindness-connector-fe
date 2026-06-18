"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Upload } from "lucide-react";
import axios from "axios";
import styles from "../login/page.module.scss";

export default function PostBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    codition: "USED", 
    images: "",
    location: {
      district: "Cầu Giấy",
      city: "Hà Nội"
    }
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        throw new Error("Bạn cần đăng nhập để đăng sách!");
      }
      const auth = JSON.parse(authStr);

      const payload = {
        ...formData,
        categories: [],
        advancedCategories: [],
        images: formData.images ? [formData.images] : [],
        status: "AVAILABLE",
        viewCount: 0
      };

      await axios.post(`${API_URL}/book`, payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });

      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đã xảy ra lỗi");
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
          <h1 className={styles.title}>Đăng sách trao đổi</h1>
          <p className={styles.subtitle}>Chia sẻ tri thức với cộng đồng</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tên sách</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Đắc Nhân Tâm"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tác giả</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="VD: Dale Carnegie"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Tình trạng</label>
              <select 
                name="codition" 
                value={formData.codition} 
                onChange={handleChange}
                className={styles.select}
              >
                <option value="NEW">Mới</option>
                <option value="LIKE_NEW">Như Mới</option>
                <option value="USED">Cũ/Đã sử dụng</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Khu vực (Quận)</label>
              <select 
                name="district" 
                value={formData.location.district} 
                onChange={handleLocationChange}
                className={styles.select}
              >
                <option value="Cầu Giấy">Cầu Giấy</option>
                <option value="Đống Đa">Đống Đa</option>
                <option value="Hai Bà Trưng">Hai Bà Trưng</option>
                <option value="Hà Đông">Hà Đông</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nội dung, lý do muốn trao đổi..."
              className={styles.textarea}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Link ảnh bìa sách (Tùy chọn)</label>
            <input
              type="url"
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Đang xử lý..." : (
              <>
                <Upload size={18} /> Đăng sách ngay
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
