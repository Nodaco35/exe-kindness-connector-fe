"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Ban, CheckCircle, ShieldAlert } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, totalBooks: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("USERS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);
      
      if (auth.role !== "ADMIN") {
        alert("Bạn không có quyền truy cập trang này!");
        router.push("/");
        return;
      }

      const headers = { Authorization: `Bearer ${auth.token}` };
      
      const [statsRes, usersRes, booksRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/books`, { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBooks(booksRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert("Bạn không có quyền truy cập trang này!");
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.patch(`${API_URL}/admin/users/${userId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      fetchAdminData();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleUpdateBookStatus = async (bookId: string, newStatus: string) => {
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.patch(`${API_URL}/admin/books/${bookId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      fetchAdminData();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <ShieldAlert size={24} className={styles.icon} />
          <h2>Admin Panel</h2>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === "USERS" ? styles.active : ""}`}
            onClick={() => setActiveTab("USERS")}
          >
            <Users size={18} /> Quản lý Người Dùng
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === "BOOKS" ? styles.active : ""}`}
            onClick={() => setActiveTab("BOOKS")}
          >
            <BookOpen size={18} /> Quản lý Sách
          </button>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>{activeTab === "USERS" ? "Quản lý Người Dùng" : "Quản lý Sách"}</h1>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span>Tổng Users</span>
              <strong>{stats.totalUsers}</strong>
            </div>
            <div className={styles.statCard}>
              <span>Tổng Sách</span>
              <strong>{stats.totalBooks}</strong>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === "USERS" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td><span className={styles.badge}>{user.role}</span></td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        {user.status === "ACTIVE" ? (
                          <button onClick={() => handleUpdateUserStatus(user._id, "LOCKED")} className={styles.actionBtnLock}>
                            <Ban size={14} /> Khóa
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateUserStatus(user._id, "ACTIVE")} className={styles.actionBtnUnlock}>
                            <CheckCircle size={14} /> Mở khóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "BOOKS" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên Sách</th>
                    <th>Người đăng</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái hiển thị</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book._id}>
                      <td>{book.title}</td>
                      <td>{book.owner?.email || 'N/A'}</td>
                      <td>{book.codition}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[book.status]}`}>
                          {book.status}
                        </span>
                      </td>
                      <td>
                        {book.status !== "HIDDEN" ? (
                          <button onClick={() => handleUpdateBookStatus(book._id, "HIDDEN")} className={styles.actionBtnLock}>
                            <Ban size={14} /> Ẩn sách
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateBookStatus(book._id, "AVAILABLE")} className={styles.actionBtnUnlock}>
                            <CheckCircle size={14} /> Hiện sách
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
