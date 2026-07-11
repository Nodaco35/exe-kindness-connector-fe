"use client";

import { API_URL } from "@/config/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import styles from "./page.module.scss";

export default function MyBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      setError("");
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);

      const res = await axios.get(`${API_URL}/book/my-books`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setBooks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách sách.");
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${title}" khỏi hệ thống?`)) {
      return;
    }

    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.delete(`${API_URL}/book/${bookId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      alert("Xóa sách thành công!");
      setBooks(prev => prev.filter(b => b._id !== bookId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa sách!");
    }
  };

  const handleToggleStatus = async (bookId: string, currentStatus: string) => {
    const newStatus = currentStatus === "HIDDEN" ? "AVAILABLE" : "HIDDEN";
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.patch(`${API_URL}/book/${bookId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      setBooks(prev => prev.map(b => b._id === bookId ? { ...b, status: newStatus } : b));
      alert(`Đã ${newStatus === "AVAILABLE" ? "hiển thị" : "ẩn"} sách thành công!`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleReup = async (bookId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn đăng lại cuốn sách "${title}" lên cộng đồng để tiếp tục cho đi?`)) {
      return;
    }

    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.patch(`${API_URL}/book/${bookId}/reup`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      alert("Đăng lại sách thành công!");
      setBooks(prev => prev.map(b => b._id === bookId ? { ...b, status: "AVAILABLE" } : b));
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi đăng lại sách!");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return styles.badgeAvailable;
      case "REQUESTED":
        return styles.badgeRequested;
      case "EXCHANGED":
        return styles.badgeExchanged;
      case "HIDDEN":
        return styles.badgeHidden;
      default:
        return styles.badgeDefault;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Đang hiển thị";
      case "REQUESTED":
        return "Có yêu cầu";
      case "EXCHANGED":
        return "Đã trao đổi";
      case "HIDDEN":
        return "Đang ẩn (Nháp)";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải danh sách sách...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý sách của tôi</h1>
            <p className={styles.subtitle}>Danh sách toàn bộ sách bạn đã đăng lên hệ thống</p>
          </div>
          <Link href="/post" className={styles.addBtn}>
            <Plus size={18} /> Đăng sách mới
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {books.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p>Bạn chưa đăng tải cuốn sách nào.</p>
            <Link href="/post" className={styles.emptyLink}>
              Đăng cuốn sách đầu tiên ngay!
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sách</th>
                  <th>Thể loại / Tình trạng</th>
                  <th>Trạng thái</th>
                  <th>Ngày đăng</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <div className={styles.bookCell}>
                        <img 
                          src={book.images?.[0] || "/placeholder-book.png"} 
                          alt={book.title} 
                          className={book.status === "HIDDEN" ? `${styles.bookImg} ${styles.imgHidden}` : styles.bookImg}
                        />
                        <div className={styles.bookInfo}>
                          <div 
                            className={styles.bookTitle} 
                            onClick={() => router.push(`/books/${book._id}`)}
                          >
                            {book.title}
                          </div>
                          <div className={styles.bookAuthor}>{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.categoriesCell}>
                        <span className={styles.categoryBadge}>{book.categories?.[0] || "Khác"}</span>
                        <span className={styles.conditionBadge}>{book.codition === "NEW" ? "Mới" : book.codition === "LIKE_NEW" ? "Như mới" : "Cũ"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(book.status)}`}>
                        {getStatusLabel(book.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={14} className={styles.dateIcon} />
                        {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {/* Nút Ẩn/Hiện nhanh */}
                        {book.status !== "EXCHANGED" && book.status !== "REQUESTED" && (
                          <button 
                            onClick={() => handleToggleStatus(book._id, book.status)}
                            className={styles.actionBtn}
                            title={book.status === "HIDDEN" ? "Hiển thị công khai" : "Ẩn sách"}
                          >
                            {book.status === "HIDDEN" ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        )}

                        {/* Nút Đăng lại (Re-up) */}
                        {book.status === "EXCHANGED" && (
                          <button 
                            onClick={() => handleReup(book._id, book.title)}
                            className={`${styles.actionBtn} ${styles.reupBtn}`}
                            title="Đăng lại sách lên cộng đồng (Re-up)"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        
                        {/* Nút Sửa */}
                        <button 
                          onClick={() => router.push(`/post?edit=${book._id}`)}
                          className={styles.actionBtn}
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit size={16} />
                        </button>
                        
                        {/* Nút Xóa */}
                        <button 
                          onClick={() => handleDelete(book._id, book.title)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Xóa sách"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
