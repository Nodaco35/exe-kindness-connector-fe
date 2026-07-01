"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Ban, CheckCircle, ShieldAlert, User, LogOut, Pencil, X, Upload, Search, Image as ImageIcon, CreditCard, TrendingUp } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";
import CustomSelect from "@/components/CustomSelect";
import bookCategories from "../../book_categories.json";

const USER_STATUS_MAP: Record<string, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Bị khóa",
};

const BOOK_CONDITION_MAP: Record<string, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  USED: "Đã sử dụng",
};

const BOOK_STATUS_MAP: Record<string, string> = {
  AVAILABLE: "Sẵn có",
  REQUESTED: "Đang yêu cầu",
  EXCHANGED: "Đã trao đổi",
  HIDDEN: "Đã ẩn",
};

const MEMBERSHIP_STATUS_MAP: Record<string, string> = {
  ACTIVE: "Hoạt động",
  EXPIRED: "Hết hạn",
  CANCELED: "Đã hủy",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalBooks: 0,
    totalExchanges: 0,
    totalPremiumUsers: 0,
    totalRevenue: 0,
    userStatus: { active: 0, locked: 0 },
    bookStatus: { available: 0, requested: 0, exchanged: 0, hidden: 0 },
    topViewedBooks: [],
    categoryBreakdown: []
  });
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', avatar: '' });
  const [searchQuery, setSearchQuery] = useState("");
  const [bookStatusFilter, setBookStatusFilter] = useState("ALL");
  const [usersPage, setUsersPage] = useState(1);
  const [booksPage, setBooksPage] = useState(1);
  const [membershipsPage, setMembershipsPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const BOOKS_PER_PAGE = 10;
  const USERS_PER_PAGE = 10;

  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
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
    },
    createdAt: "",
    status: ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingBook, setSavingBook] = useState(false);
  const [modalError, setModalError] = useState("");

  const activeCategoryGroup = bookCategories.find(c => c.slug === editFormData.category);

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const newData = { ...prev, [name]: value };
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

  const handleEditLocationChange = (e: any) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleOpenEditModal = (book: any) => {
    setEditingBook(book);
    setEditFormData({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      codition: book.codition || "",
      images: book.images || [],
      category: book.categories?.[0] || "",
      advancedCategory: book.advancedCategories?.[0] || "",
      location: {
        district: book.location?.district || "Cầu Giấy",
        city: book.location?.city || "Hà Nội"
      },
      createdAt: book.createdAt ? new Date(book.createdAt).toISOString().split('T')[0] : "",
      status: book.status || "AVAILABLE"
    });
    setModalError("");
  };

  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      setModalError("Một số ảnh có dung lượng vượt quá 5MB và đã bị bỏ qua.");
    }
    if (!validFiles.length) return;

    setUploadingImage(true);
    setModalError("");

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
        setEditFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validUrls]
        }));
      }
    } catch (err) {
      setModalError("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    setSavingBook(true);
    setModalError("");

    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      const payload = {
        title: editFormData.title,
        author: editFormData.author,
        description: editFormData.description,
        codition: editFormData.codition,
        images: editFormData.images,
        categories: editFormData.category ? [editFormData.category] : [],
        advancedCategories: editFormData.advancedCategory ? [editFormData.advancedCategory] : [],
        location: editFormData.location,
        status: editFormData.status,
        ...(editFormData.createdAt ? { createdAt: new Date(editFormData.createdAt).toISOString() } : {})
      };

      await axios.patch(`${API_URL}/book/${editingBook._id}`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      alert("Cập nhật thông tin sách thành công!");
      setEditingBook(null);
      fetchAdminData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || "Lỗi khi cập nhật sách");
    } finally {
      setSavingBook(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setBookStatusFilter("ALL");
    setUsersPage(1);
    setBooksPage(1);
    setMembershipsPage(1);
  }, [activeTab]);

  useEffect(() => {
    setUsersPage(1);
    setBooksPage(1);
    setMembershipsPage(1);
  }, [searchQuery]);

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooks = books.filter(book =>
    (bookStatusFilter === "ALL" || book.status === bookStatusFilter)
  ).sort((a, b) => {
    const statusOrder: Record<string, number> = {
      "AVAILABLE": 1,
      "REQUESTED": 2,
      "EXCHANGED": 3,
      "HIDDEN": 4
    };
    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const filteredMemberships = memberships.filter(m =>
    m.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={styles.pageBtn}
        >
          Trang trước
        </button>
        <span className={styles.pageInfo}>
          Trang <strong>{currentPage}</strong> / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={styles.pageBtn}
        >
          Trang sau
        </button>
      </div>
    );
  };

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

      const [statsRes, usersRes, booksRes, profileRes, membershipsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/books`, { headers }),
        axios.get(`${API_URL}/user/me`, { headers }),
        axios.get(`${API_URL}/admin/memberships`, { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBooks(booksRes.data);
      setAdminProfile(profileRes.data);
      setMemberships(membershipsRes.data);
      if (!profileForm.fullName && !profileForm.avatar) {
        setProfileForm({ fullName: profileRes.data.fullName || '', avatar: profileRes.data.avatar || '' });
      }
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.patch(`${API_URL}/user/profile`, profileForm, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      alert("Cập nhật thông tin thành công!");
      fetchAdminData();
    } catch (err) {
      alert("Cập nhật thất bại");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bookshare_auth_v3");
    router.push("/admin/login");
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
            className={`${styles.navItem} ${activeTab === "DASHBOARD" ? styles.active : ""}`}
            onClick={() => setActiveTab("DASHBOARD")}
          >
            <TrendingUp size={18} /> Tổng Quan Hệ Thống
          </button>
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
          <button
            className={`${styles.navItem} ${activeTab === "MEMBERSHIPS" ? styles.active : ""}`}
            onClick={() => setActiveTab("MEMBERSHIPS")}
          >
            <CreditCard size={18} /> Quản lý Premium
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "PROFILE" ? styles.active : ""}`}
            onClick={() => setActiveTab("PROFILE")}
          >
            <User size={18} /> Trang cá nhân
          </button>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>
            {activeTab === "USERS" && "Quản lý Người Dùng"}
            {activeTab === "BOOKS" && "Quản lý Sách"}
            {activeTab === "MEMBERSHIPS" && "Quản lý Premium & Doanh thu"}
            {activeTab === "PROFILE" && "Trang Cá Nhân"}
          </h1>
          <div className={styles.stats}>
            <div className={`${styles.statCard} ${styles.usersCard}`}>
              <div className={styles.statIconWrapper}>
                <Users size={20} />
              </div>
              <div className={styles.statText}>
                <span>Tổng Users</span>
                <strong>{stats.totalUsers}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.booksCard}`}>
              <div className={styles.statIconWrapper}>
                <BookOpen size={20} />
              </div>
              <div className={styles.statText}>
                <span>Sách (Sẵn có/Giao dịch)</span>
                <strong>{stats.bookStatus?.available || 0} / {stats.bookStatus?.requested || 0}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.premiumCard}`}>
              <div className={styles.statIconWrapper}>
                <CheckCircle size={20} />
              </div>
              <div className={styles.statText}>
                <span>Tổng Giao Dịch</span>
                <strong>{stats.totalExchanges || 0}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.revenueCard}`}>
              <div className={styles.statIconWrapper}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.statText}>
                <span>Doanh Thu & Premium</span>
                <strong>{(stats.totalRevenue || 0).toLocaleString('vi-VN')} đ / {stats.totalPremiumUsers || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === "DASHBOARD" && (
            <div className={styles.dashboardGrid}>
              {/* Row 1: Left Card (Book Status) & Right Card (User Status) */}
              <div className={styles.dashboardRow}>
                <div className={styles.dashboardCard}>
                  <h3>Trạng Thái Sách</h3>
                  <div className={styles.metricList}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Sách sẵn có</span>
                        <strong>{stats.bookStatus?.available || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.availableBar}`} style={{ width: `${(stats.bookStatus?.available / (stats.totalBooks || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Đang được yêu cầu</span>
                        <strong>{stats.bookStatus?.requested || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.requestedBar}`} style={{ width: `${(stats.bookStatus?.requested / (stats.totalBooks || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Đã trao đổi thành công</span>
                        <strong>{stats.bookStatus?.exchanged || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.exchangedBar}`} style={{ width: `${(stats.bookStatus?.exchanged / (stats.totalBooks || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Đã ẩn</span>
                        <strong>{stats.bookStatus?.hidden || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.hiddenBar}`} style={{ width: `${(stats.bookStatus?.hidden / (stats.totalBooks || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.dashboardCard}>
                  <h3>Trạng Thái Người Dùng</h3>
                  <div className={styles.metricList}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Người dùng hoạt động</span>
                        <strong>{stats.userStatus?.active || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.availableBar}`} style={{ width: `${(stats.userStatus?.active / (stats.totalUsers || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Người dùng bị khóa</span>
                        <strong>{stats.userStatus?.locked || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.hiddenBar}`} style={{ width: `${(stats.userStatus?.locked / (stats.totalUsers || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '2rem' }}>Thành Viên Premium</h3>
                  <div className={styles.metricList}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricHeader}>
                        <span>Tỷ lệ Premium</span>
                        <strong>{stats.totalPremiumUsers || 0} / {stats.totalUsers || 0}</strong>
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div className={`${styles.progressBar} ${styles.premiumBar}`} style={{ width: `${(stats.totalPremiumUsers / (stats.totalUsers || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Left Card (Top Categories) & Right Card (Top Viewed Books) */}
              <div className={styles.dashboardRow}>
                <div className={styles.dashboardCard}>
                  <h3>Thể Loại Sách Phổ Biến</h3>
                  <div className={styles.categoryList}>
                    {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                      stats.categoryBreakdown.map((cat: any, idx: number) => {
                        const total = stats.categoryBreakdown[0]?.count || 1;
                        return (
                          <div key={idx} className={styles.categoryItem}>
                            <div className={styles.categoryHeader}>
                              <span>{cat._id}</span>
                              <strong>{cat.count} cuốn</strong>
                            </div>
                            <div className={styles.progressBarWrapper}>
                              <div className={`${styles.progressBar} ${styles.categoryBar}`} style={{ width: `${(cat.count / total) * 100}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có dữ liệu thống kê thể loại.</p>
                    )}
                  </div>
                </div>

                <div className={styles.dashboardCard}>
                  <h3>Bài Đăng Xem Nhiều Nhất</h3>
                  <div className={styles.topBooksList}>
                    {stats.topViewedBooks && stats.topViewedBooks.length > 0 ? (
                      stats.topViewedBooks.map((book: any, idx: number) => (
                        <div key={idx} className={styles.topBookItem}>
                          <div className={styles.topBookRank}>{idx + 1}</div>
                          <div className={styles.topBookInfo}>
                            <h4>{book.title}</h4>
                            <span>Người đăng: {book.owner?.fullName || book.owner?.email || 'N/A'}</span>
                          </div>
                          <div className={styles.topBookViews}>
                            <strong>{book.viewCount || 0}</strong>
                            <span>lượt xem</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có dữ liệu lượt xem sách.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "PROFILE" && activeTab !== "DASHBOARD" && (
            <div className={styles.tableHeaderActions}>
              {activeTab !== "BOOKS" && (
                <div className={styles.searchWrapper}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder={
                      activeTab === "USERS" ? "Tìm người dùng theo tên hoặc email..." :
                        activeTab === "MEMBERSHIPS" ? "Tìm theo tên, email hoặc mã giao dịch..." :
                          "Tìm kiếm..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className={styles.clearSearchBtn}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
              {activeTab === "BOOKS" && (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <select
                    value={bookStatusFilter}
                    onChange={(e) => setBookStatusFilter(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', marginLeft: '1rem', background: 'var(--card-bg)' }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="AVAILABLE">AVAILABLE (Sẵn có)</option>
                    <option value="REQUESTED">REQUESTED (Đang giao dịch)</option>
                    <option value="EXCHANGED">EXCHANGED (Đã trao đổi)</option>
                    <option value="HIDDEN">HIDDEN (Đã ẩn)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === "USERS" && (
            <>
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
                    {filteredUsers.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE).map(user => (
                      <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td><span className={styles.badge}>{user.role}</span></td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                            {USER_STATUS_MAP[user.status] || user.status}
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
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                          Không tìm thấy người dùng nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(usersPage, Math.ceil(filteredUsers.length / USERS_PER_PAGE), setUsersPage)}
            </>
          )}

          {activeTab === "BOOKS" && (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên Sách</th>
                      <th>Người đăng</th>
                      <th>Tình trạng</th>
                      <th>Trạng thái hiển thị</th>
                      <th>Ngày đăng</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.slice((booksPage - 1) * BOOKS_PER_PAGE, booksPage * BOOKS_PER_PAGE).map(book => (
                      <tr key={book._id}>
                        <td style={{ fontWeight: 600 }}>{book.title}</td>
                        <td>{book.owner?.email || 'N/A'}</td>
                        <td>
                          <span className={`${styles.conditionBadge} ${styles[book.codition]}`}>
                            {BOOK_CONDITION_MAP[book.codition] || book.codition}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[book.status]}`}>
                            {BOOK_STATUS_MAP[book.status] || book.status}
                          </span>
                        </td>
                        <td>
                          {book.createdAt ? new Date(book.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => handleOpenEditModal(book)} className={styles.actionBtnEdit}>
                              <Pencil size={14} /> Sửa
                            </button>
                            {book.status !== "HIDDEN" ? (
                              <button onClick={() => handleUpdateBookStatus(book._id, "HIDDEN")} className={styles.actionBtnLock}>
                                <Ban size={14} /> Ẩn sách
                              </button>
                            ) : (
                              <button onClick={() => handleUpdateBookStatus(book._id, "AVAILABLE")} className={styles.actionBtnUnlock}>
                                <CheckCircle size={14} /> Hiện sách
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBooks.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                          Không tìm thấy cuốn sách nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(booksPage, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE), setBooksPage)}
            </>
          )}

          {activeTab === "MEMBERSHIPS" && (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên Người dùng</th>
                      <th>Email</th>
                      <th>Số tiền nạp</th>
                      <th>Mã giao dịch</th>
                      <th>Phương thức</th>
                      <th>Ngày bắt đầu</th>
                      <th>Ngày hết hạn</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMemberships.slice((membershipsPage - 1) * ITEMS_PER_PAGE, membershipsPage * ITEMS_PER_PAGE).map((m: any) => (
                      <tr key={m._id}>
                        <td>{m.user?.fullName || 'N/A'}</td>
                        <td>{m.user?.email || 'N/A'}</td>
                        <td style={{ fontWeight: 600, color: "#10B981" }}>{(m.amount || 0).toLocaleString('vi-VN')} đ</td>
                        <td><code style={{ background: "rgba(0,0,0,0.05)", padding: "0.2rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>{m.transactionId || 'N/A'}</code></td>
                        <td><span className={styles.badge}>{m.method}</span></td>
                        <td>{new Date(m.startDate).toLocaleDateString('vi-VN')}</td>
                        <td>{new Date(m.endDate).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${m.status === 'ACTIVE' ? styles.AVAILABLE : styles.HIDDEN}`}>
                            {MEMBERSHIP_STATUS_MAP[m.status] || m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredMemberships.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                          Không tìm thấy giao dịch nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(membershipsPage, Math.ceil(filteredMemberships.length / ITEMS_PER_PAGE), setMembershipsPage)}
            </>
          )}

          {activeTab === "PROFILE" && adminProfile && (
            <div className={styles.profileSection}>
              <form onSubmit={handleUpdateProfile} className={styles.profileForm}>
                <div className={styles.profileHeader}>
                  <img src={profileForm.avatar || "https://ui-avatars.com/api/?name=Admin&background=random"} alt="Avatar" className={styles.avatarLarge} />
                  <div>
                    <h2>{adminProfile.email}</h2>
                    <span className={styles.badge}>{adminProfile.role}</span>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>URL Ảnh đại diện</label>
                  <input
                    type="text"
                    value={profileForm.avatar}
                    onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  />
                </div>
                <button type="submit" className={styles.saveBtn}>Lưu thay đổi</button>
              </form>
            </div>
          )}
        </div>
      </div>
      {editingBook && (
        <div className={styles.modalOverlay} onClick={() => setEditingBook(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setEditingBook(null)}>
              <X size={20} />
            </button>
            <div className={styles.modalHeader}>
              <h2>Sửa thông tin sách</h2>
              <p>Chỉnh sửa các chi tiết của bài post sách</p>
            </div>

            <form onSubmit={handleSaveBook} className={styles.modalForm}>
              {modalError && <div className={styles.modalError}>{modalError}</div>}

              <div className={styles.modalInputGroup}>
                <label>Tên sách</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  className={styles.modalInput}
                  required
                />
              </div>

              <div className={styles.modalInputGroup}>
                <label>Tác giả</label>
                <input
                  type="text"
                  name="author"
                  value={editFormData.author}
                  onChange={handleEditChange}
                  className={styles.modalInput}
                  required
                />
              </div>

              <div className={styles.modalRowGroup}>
                <div className={styles.modalInputGroup}>
                  <label>Ngày đăng</label>
                  <input
                    type="date"
                    name="createdAt"
                    value={editFormData.createdAt}
                    onChange={handleEditChange}
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label>Trạng thái</label>
                  <CustomSelect
                    value={editFormData.status}
                    onChange={(val) => handleEditChange({ target: { name: "status", value: val } })}
                    options={[
                      { value: "AVAILABLE", label: "Sẵn có" },
                      { value: "REQUESTED", label: "Đang giao dịch" },
                      { value: "EXCHANGED", label: "Đã trao đổi" },
                      { value: "HIDDEN", label: "Đã ẩn" }
                    ]}
                    placeholder="Chọn Trạng thái..."
                    required
                  />
                </div>
              </div>

              <div className={styles.modalRowGroup}>
                <div className={styles.modalInputGroup}>
                  <label>Tình trạng</label>
                  <CustomSelect
                    value={editFormData.codition}
                    onChange={(val) => handleEditChange({ target: { name: "codition", value: val } })}
                    options={[
                      { value: "NEW", label: "Mới" },
                      { value: "LIKE_NEW", label: "Như Mới" },
                      { value: "USED", label: "Cũ/Đã sử dụng" }
                    ]}
                    placeholder="Chọn Tình trạng..."
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label>Khu vực (Quận)</label>
                  <CustomSelect
                    value={editFormData.location.district}
                    onChange={(val) => handleEditLocationChange({ target: { name: "district", value: val } })}
                    options={[
                      { value: "Cầu Giấy", label: "Cầu Giấy" },
                      { value: "Đống Đa", label: "Đống Đa" },
                      { value: "Hai Bà Trưng", label: "Hai Bà Trưng" },
                      { value: "Hà Đông", label: "Hà Đông" }
                    ]}
                  />
                </div>
              </div>

              <div className={styles.modalRowGroup}>
                <div className={styles.modalInputGroup}>
                  <label>Thể loại chính</label>
                  <CustomSelect
                    value={editFormData.category}
                    onChange={(val) => handleEditChange({ target: { name: "category", value: val } })}
                    options={bookCategories.map(cat => ({ value: cat.slug, label: cat.name }))}
                    placeholder="Chọn Thể loại chính..."
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label>Thể loại phụ</label>
                  <CustomSelect
                    value={editFormData.advancedCategory}
                    onChange={(val) => handleEditChange({ target: { name: "advancedCategory", value: val } })}
                    options={activeCategoryGroup?.subcategories.map(sub => ({ value: sub.slug, label: sub.name })) || []}
                    placeholder="Chọn Thể loại phụ..."
                    disabled={!activeCategoryGroup || activeCategoryGroup.subcategories.length === 0}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalInputGroup}>
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className={styles.modalTextarea}
                  required
                />
              </div>

              <div className={styles.modalInputGroup}>
                <label>Ảnh sách (Có thể chọn nhiều ảnh, tối đa 5MB/ảnh)</label>
                <div className={styles.imageUploadWrapper}>
                  {editFormData.images.map((imgUrl, idx) => (
                    <div key={idx} className={styles.imagePreviewCard}>
                      <img src={imgUrl} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className={styles.removeImageBtn}
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <div className={styles.coverImageBadge}>
                          Ảnh bìa
                        </div>
                      )}
                    </div>
                  ))}

                  <div className={styles.uploadImagePlaceholder}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleModalImageUpload}
                      disabled={uploadingImage}
                      className={styles.fileInput}
                    />
                    <div className={styles.placeholderContent}>
                      {uploadingImage ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <>
                          <ImageIcon size={20} />
                          <span>Thêm ảnh</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingBook(null)} disabled={savingBook}>
                  Hủy
                </button>
                <button type="submit" className={styles.submitBtn} disabled={savingBook || uploadingImage}>
                  {savingBook ? "Đang lưu..." : <><Upload size={16} /> Lưu thay đổi</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
