"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Upload } from "lucide-react";
import axios from "axios";
import bookCategories from "../../book_categories.json";
import styles from "./page.module.scss";
import CustomSelect from "@/components/CustomSelect";

export default function PostBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    codition: "USED", 
    category: "",
    advancedCategory: "",
    images: "",
    location: {
      district: "Cầu Giấy",
      city: "Hà Nội"
    }
  });

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const authStr = localStorage.getItem("bookshare_auth_v3");
        if (!authStr) return;
        const auth = JSON.parse(authStr);
        
        const res = await axios.get(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        
        const user = res.data;
        const addr = user.address && user.address.length > 0 ? user.address[0] : null;
        if (addr?.district) {
          setFormData(prev => ({
            ...prev,
            location: {
              district: addr.district,
              city: addr.city || "Hà Nội"
            }
          }));
        }
      } catch (err) {
        console.error("Lỗi khi tải vị trí người dùng:", err);
      }
    };
    
    fetchUserLocation();
  }, []);

  const activeCategoryGroup = bookCategories.find(c => c.slug === formData.category);

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
              <CustomSelect
                value={formData.codition}
                onChange={(val) => handleChange({ target: { name: "codition", value: val } })}
                options={[
                  { value: "NEW", label: "Mới" },
                  { value: "LIKE_NEW", label: "Như Mới" },
                  { value: "USED", label: "Cũ/Đã sử dụng" }
                ]}
                placeholder="Vui lòng chọn Tình trạng..."
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Khu vực (Quận)</label>
              <CustomSelect
                value={formData.location.district}
                onChange={(val) => handleLocationChange({ target: { name: "district", value: val } })}
                options={((): { value: string; label: string }[] => {
                  const baseOptions = [
                    { value: "Cầu Giấy", label: "Cầu Giấy" },
                    { value: "Đống Đa", label: "Đống Đa" },
                    { value: "Hai Bà Trưng", label: "Hai Bà Trưng" },
                    { value: "Hà Đông", label: "Hà Đông" }
                  ];
                  const currentDist = formData.location.district;
                  if (currentDist && !baseOptions.some(opt => opt.value === currentDist)) {
                    return [...baseOptions, { value: currentDist, label: currentDist }];
                  }
                  return baseOptions;
                })()}
              />
            </div>
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Thể loại chính</label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => handleChange({ target: { name: "category", value: val } })}
                options={bookCategories.map(cat => ({ value: cat.slug, label: cat.name }))}
                placeholder="Vui lòng chọn Thể loại chính..."
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Thể loại phụ</label>
              <CustomSelect
                value={formData.advancedCategory}
                onChange={(val) => handleChange({ target: { name: "advancedCategory", value: val } })}
                options={activeCategoryGroup?.subcategories.map(sub => ({ value: sub.slug, label: sub.name })) || []}
                placeholder="Vui lòng chọn Thể loại phụ..."
                disabled={!activeCategoryGroup || activeCategoryGroup.subcategories.length === 0}
                required
              />
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
