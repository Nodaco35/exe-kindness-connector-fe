"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Upload, Search, X, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import bookCategories from "../../book_categories.json";
import styles from "./page.module.scss";
import CustomSelect from "@/components/CustomSelect";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function PostBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [isbnQuery, setIsbnQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    codition: "", 
    images: [] as string[],
    category: "",
    advancedCategory: "",
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
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update subcategory if main category changes
      if (name === "category") {
        const newGroup = bookCategories.find(c => c.slug === value);
        if (newGroup && newGroup.subcategories.length > 0) {
          newData.advancedCategory = newGroup.subcategories[0].slug;
        } else {
          newData.advancedCategory = "";
        }
      }
      return newData;
    });
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

  const fetchBookInfo = async () => {
    if (!isbnQuery) {
      setError("Vui lòng nhập mã ISBN để tìm kiếm");
      return;
    }
    
    // Xóa các dấu gạch ngang nếu có
    const cleanIsbn = isbnQuery.replace(/-/g, '');
    
    setFetchingInfo(true);
    setError("");
    
    try {
      // 1. Thử Google Books API
      const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      if (res.data.items && res.data.items.length > 0) {
        const bookInfo = res.data.items[0].volumeInfo;
        setFormData(prev => ({
          ...prev,
          title: bookInfo.title || prev.title,
          author: bookInfo.authors ? bookInfo.authors.join(", ") : prev.author,
          description: bookInfo.description || prev.description,
          images: bookInfo.imageLinks?.thumbnail && !prev.images.includes(bookInfo.imageLinks.thumbnail.replace("http:", "https:"))
            ? [...prev.images, bookInfo.imageLinks.thumbnail.replace("http:", "https:")] 
            : prev.images
        }));
        setFetchingInfo(false);
        return; // Thành công thì thoát
      }
    } catch (err) {
      console.warn("Google Books API bị lỗi hoặc quá giới hạn, chuyển sang OpenLibrary...");
    }

    try {
      // 2. Dự phòng: OpenLibrary API
      const olRes = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      const olBook = olRes.data[`ISBN:${cleanIsbn}`];
      
      if (olBook) {
        const authorStr = olBook.authors ? olBook.authors.map((a: any) => a.name).join(", ") : "";
        const coverUrl = olBook.cover?.large || olBook.cover?.medium;
        
        setFormData(prev => ({
          ...prev,
          title: olBook.title || prev.title,
          author: authorStr || prev.author,
          images: coverUrl && !prev.images.includes(coverUrl)
            ? [...prev.images, coverUrl]
            : prev.images
        }));
      } else {
        setError("Không tìm thấy sách với mã ISBN này (đã thử cả Google Books và OpenLibrary)");
      }
    } catch (err) {
      setError("Hệ thống tìm kiếm sách đang quá tải, vui lòng nhập tay thông tin.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      setError("Một số ảnh có dung lượng vượt quá 5MB và đã bị bỏ qua.");
    }
    if (!validFiles.length) return;

    setUploadingImage(true);
    setError("");

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const res = await axios.post(`${API_URL}/upload/image`, uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data?.url;
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => Boolean(url));
      
      if (validUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validUrls]
        }));
      }
    } catch (err) {
      setError("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  };

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
        categories: formData.category ? [formData.category] : [],
        advancedCategories: formData.advancedCategory ? [formData.advancedCategory] : [],
        images: formData.images,
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
      <div className={styles.postCard}>
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
            <label className={styles.label}>Tự động điền thông tin (Nhập mã ISBN)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={isbnQuery}
                onChange={(e) => setIsbnQuery(e.target.value)}
                placeholder="VD: 9786043825827"
                className={styles.input}
              />
              <BarcodeScanner 
                onResult={(code) => {
                  setIsbnQuery(code);
                  // Optional: Automatically fetch when scanned
                  // setTimeout(fetchBookInfo, 100); 
                }}
                onError={(msg) => setError(msg)}
              />
              <button 
                type="button" 
                onClick={fetchBookInfo}
                disabled={fetchingInfo}
                style={{ 
                  flexShrink: 0, 
                  padding: "0 1rem", 
                  backgroundColor: "var(--primary-light-bg)", 
                  color: "var(--primary)", 
                  border: "1px solid var(--primary-light)",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer"
                }}
              >
                {fetchingInfo ? "Đang tìm..." : <><Search size={16}/> Tìm theo ISBN</>}
              </button>
            </div>
          </div>

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
            <label className={styles.label}>Ảnh sách (Có thể chọn nhiều ảnh, tối đa 5MB/ảnh)</label>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              {formData.images.map((imgUrl, idx) => (
                <div key={idx} style={{ position: "relative", width: "100px", height: "135px", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                  <img src={imgUrl} alt={`Preview ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", padding: "4px", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--primary)", color: "white", fontSize: "0.6875rem", fontWeight: 700, textAlign: "center", padding: "0.25rem" }}>
                      Ảnh bìa
                    </div>
                  )}
                </div>
              ))}
              
              <div style={{ position: "relative", width: "100px", height: "135px", flexShrink: 0 }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{
                    opacity: 0,
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    zIndex: 10
                  }}
                />
                <div style={{ 
                  width: "100%", 
                  height: "100%",
                  border: "2px dashed var(--border-color)", 
                  borderRadius: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "var(--bg-color-alt)",
                  color: "var(--text-muted)",
                  transition: "all 0.2s"
                }}>
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ImageIcon size={24} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center", padding: "0 0.5rem" }}>Thêm ảnh</span>
                    </>
                  )}
                </div>
              </div>
            </div>
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
