"use client";

import { API_URL } from "@/config/api";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BookOpen,
  ChevronRight,
  Filter,
  MapPin,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import bookCategories from "../book_categories.json";
import BookCard, { Book } from "../components/BookCard";
import styles from "./page.module.scss";

type SubCategory = {
  name: string;
  slug: string;
};

type CategoryGroup = {
  name: string;
  slug: string;
  description: string;
  subcategories: SubCategory[];
};

type CategoryRef =
  | string
  | {
    name?: string;
    slug?: string;
    type?: string;
  };

type BookWithCategories = Book & {
  categories?: CategoryRef[];
  advancedCategories?: CategoryRef[];
};

const HANOI_DISTRICTS = [
  "Quận Ba Đình",
  "Quận Hoàn Kiếm",
  "Quận Tây Hồ",
  "Quận Long Biên",
  "Quận Cầu Giấy",
  "Quận Đống Đa",
  "Quận Hai Bà Trưng",
  "Quận Hoàng Mai",
  "Quận Thanh Xuân",
  "Quận Nam Từ Liêm",
  "Quận Bắc Từ Liêm",
  "Quận Hà Đông",
  "Thị xã Sơn Tây",
  "Huyện Sóc Sơn",
  "Huyện Đông Anh",
  "Huyện Gia Lâm",
  "Huyện Thanh Trì",
  "Huyện Mê Linh",
  "Huyện Ba Vì",
  "Huyện Phúc Thọ",
  "Huyện Đan Phượng",
  "Huyện Hoài Đức",
  "Huyện Quốc Oai",
  "Huyện Thạch Thất",
  "Huyện Chương Mỹ",
  "Huyện Thanh Oai",
  "Huyện Thường Tín",
  "Huyện Phú Xuyên",
  "Huyện Ứng Hòa",
  "Huyện Mỹ Đức",
];

const categoryGroups = bookCategories as CategoryGroup[];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const getRefSlug = (ref: CategoryRef) => {
  if (typeof ref === "string") return ref;
  return ref.slug || ref.name || "";
};

const getBookCategorySlugs = (book: BookWithCategories) => {
  const topLevel = (book.categories ?? []).map(getRefSlug).filter(Boolean);
  const advancedLevel = (book.advancedCategories ?? []).map(getRefSlug).filter(Boolean);

  return {
    topLevel,
    advancedLevel,
    all: [...topLevel, ...advancedLevel],
  };
};

const includesSlug = (values: string[], slug: string) =>
  values.some((value) => {
    const normalizedValue = normalize(value);
    const normalizedSlug = normalize(slug);
    return normalizedValue === normalizedSlug || normalizedValue.includes(normalizedSlug);
  });

const categoryFilterMatches = (
  book: BookWithCategories,
  topCategory: string,
  subCategory: string,
) => {
  if (topCategory === "all") return true;

  const { topLevel, advancedLevel, all } = getBookCategorySlugs(book);

  if (subCategory === "all") {
    return includesSlug(topLevel.length > 0 ? topLevel : all, topCategory);
  }

  return includesSlug(topLevel, topCategory) && includesSlug(advancedLevel, subCategory);
};

export default function Home() {
  const [books, setBooks] = useState<BookWithCategories[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState("Đang tải vị trí...");
  const [userDistrict, setUserDistrict] = useState("");

  const [activeRadius, setActiveRadius] = useState("10km");
  const [selectedTopCategory, setSelectedTopCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchUserLocation = async () => {
    try {
      const stored = localStorage.getItem("bookshare_auth_v3");
      if (!stored) {
        setUserLocation("Toàn quốc");
        return;
      }

      const authData = JSON.parse(stored);
      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      const addr = res.data.address;
      if (addr && addr.length > 0) {
        setUserLocation(`${addr[0].district}, ${addr[0].city}`);
        setUserDistrict(addr[0].district);
      } else {
        setUserLocation("Toàn quốc");
      }
    } catch (error) {
      console.error("Failed to fetch user location:", error);
      setUserLocation("Toàn quốc");
    }
  };

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userDistrict) {
        params.append('district', userDistrict);
      }
      if (activeRadius) {
        params.append('radius', activeRadius.replace('km', ''));
      }
      
      const response = await axios.get(`${API_URL}/book?${params.toString()}`);
      if (response.data) {
        setBooks(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  }, [userDistrict, activeRadius]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUserLocation();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBooks();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchBooks]);

  const activeTopCategory = useMemo(
    () => categoryGroups.find((category) => category.slug === selectedTopCategory) ?? null,
    [selectedTopCategory],
  );

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !searchTerm ||
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesCategory = true;
      if (selectedTopCategory !== "all" && activeTopCategory) {
        matchesCategory = categoryFilterMatches(book, selectedTopCategory, selectedSubCategory);
      }

      let matchesCondition = true;
      if (selectedCondition !== "all") {
        const cond = book.codition?.toUpperCase() || "";
        if (selectedCondition === "new" && !cond.includes("NEW")) matchesCondition = false;
        if (selectedCondition === "good" && (!cond.includes("GOOD") && cond !== "USED")) matchesCondition = false;
        if (selectedCondition === "old" && cond !== "OLD") matchesCondition = false;
      }

      // The radius is now handled by the backend geospatial query, so we don't need local filtering for it
      const matchesRadius = true;

      return matchesSearch && matchesCategory && matchesCondition && matchesRadius;
    });
  }, [books, searchTerm, selectedTopCategory, selectedSubCategory, selectedCondition, activeTopCategory]);

  const clearFilters = () => {
    setUserDistrict("");
    setActiveRadius("");
    setSelectedTopCategory("all");
    setSelectedSubCategory("all");
    setSelectedCondition("all");
    setSearchTerm("");
  };

  const handleTopCategorySelect = (slug: string) => {
    setSelectedTopCategory(slug);
    setSelectedSubCategory("all");
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Trao đổi sách,
                <br />
                <span>Chia sẻ tri thức</span>
              </h1>
              <p className={styles.heroDesc}>
                Tham gia cộng đồng những người đọc sách trên toàn quốc. Biến những cuốn sách
                bạn đã đọc xong thành những chuyến phiêu lưu mới mà không tốn một xu.
              </p>

              <div className={styles.searchBox}>
                <div className={styles.searchInputWrapper}>
                  <Search size={20} className={styles.searchIcon} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo tên sách, tác giả hoặc thể loại..."
                    className={styles.searchInput}
                  />
                </div>
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className={styles.clearButton}>
                    Xóa lọc
                  </button>
                )}
              </div>

              <div className={styles.heroActions}>
                <button className={styles.btnPrimary}>Bắt đầu trao đổi sách</button>
                <button className={styles.btnOutline}>Cách hoạt động</button>
              </div>
            </div>

            <div className={styles.heroImagePlaceholder}>
              <div className={styles.placeholderBox}>
                <div className={styles.placeholderBadge}>
                  <div className={styles.placeholderIcon}>📚</div>
                  <div className={styles.badgeText}>
                    <span>Lượt trao đổi</span>
                    <strong>12,450+</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.categoriesSection}>
        <div className={styles.categoriesHeader}>
          <div>
            <h2>Phân loại sách</h2>
          </div>
          {selectedTopCategory !== "all" && (
            <button onClick={clearFilters} className={styles.viewAllCat}>
              Xem tất cả <ChevronRight size={14} />
            </button>
          )}
        </div>

        <div className={styles.categoryGrid}>
          {categoryGroups.map((category, index) => {
            const isActive = selectedTopCategory === category.slug;

            return (
              <button
                key={category.slug}
                onClick={() => handleTopCategorySelect(category.slug)}
                className={`${styles.categoryCard} ${isActive ? styles.categoryCardActive : ""}`}
              >
                <div className={styles.categoryCardHead}>
                  <span className={styles.categoryIndex}>0{index + 1}</span>
                  <span className={`${styles.categoryChevron} ${isActive ? styles.categoryChevronActive : ""}`}>
                    <ChevronRight size={16} />
                  </span>
                </div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span>{category.subcategories.length} danh mục con</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTopCategory && (
            <motion.div
              key={activeTopCategory.slug}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={styles.subcategoryPanel}
            >
              <div className={styles.subcategoryPanelHeader}>
                <div>
                  <h3>{activeTopCategory.name}</h3>
                  <p>{activeTopCategory.description}</p>
                </div>
                <button onClick={() => handleTopCategorySelect("all")} className={styles.panelReset}>
                  Bỏ chọn
                </button>
              </div>

              <div className={styles.subcategoryChips}>
                <button
                  onClick={() => setSelectedSubCategory("all")}
                  className={`${styles.subcategoryChip} ${selectedSubCategory === "all" ? styles.subcategoryChipActive : ""
                    }`}
                >
                  Tất cả
                </button>
                {activeTopCategory.subcategories.map((subCategory) => {
                  const isActive = selectedSubCategory === subCategory.slug;

                  return (
                    <button
                      key={subCategory.slug}
                      onClick={() => setSelectedSubCategory(subCategory.slug)}
                      className={`${styles.subcategoryChip} ${isActive ? styles.subcategoryChipActive : ""
                        }`}
                    >
                      {subCategory.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className={styles.mainGridSection}>
        <div className={styles.gridContainer}>
          <aside className={styles.desktopSidebar}>
            <div className={styles.filterBox}>
              <div className={styles.filterHeader}>
                <h3>
                  <Filter size={16} /> Bộ lọc tìm kiếm
                </h3>
                <button onClick={clearFilters} className={styles.btnClearFilter}>
                  Xóa lọc
                </button>
              </div>

              <div className={styles.filterGroup}>
                <h4>Khu vực (Hà Nội)</h4>
                <select
                  value={userDistrict}
                  onChange={(e) => setUserDistrict(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Toàn quốc (Tất cả)</option>
                  {HANOI_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <h4>Bán kính xung quanh</h4>
                <div className={styles.filterGrid2}>
                  {["1km", "3km", "5km", "10km"].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => setActiveRadius(prev => prev === radius ? "" : radius)}
                      className={`${styles.filterBtn} ${activeRadius === radius ? styles.filterBtnActive : ""}`}
                    >
                      {radius}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4>Tình trạng sách</h4>
                <div className={styles.filterGridCol}>
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "new", label: "Sách mới / Như mới" },
                    { id: "good", label: "Sách cũ còn tốt" },
                    { id: "old", label: "Sách đã cũ" },
                  ].map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(prev => prev === condition.id ? "all" : condition.id)}
                      className={`${styles.filterBtnRow} ${selectedCondition === condition.id ? styles.filterBtnActive : ""
                        }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.locationBox}>
                <p>Vị trí hiện tại</p>
                <div className={styles.locationTag}>
                  <MapPin size={14} className={styles.pinIcon} />
                  <span>{userLocation}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.resultsArea}>
            <div className={styles.sectionHeader}>
              <p className={styles.resultsCount}>
                Tìm thấy <span>{filteredBooks.length}</span> cuốn sách
              </p>

              <button onClick={() => setMobileFilterOpen(true)} className={styles.mobileFilterBtn}>
                <Filter size={14} /> Bộ lọc
              </button>
            </div>

            {loading && books.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3>Đang tải sách...</h3>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className={styles.booksGrid} style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
                {filteredBooks.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <BookOpen size={24} />
                </div>
                <h3>Không tìm thấy sách nào</h3>
                <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc mở rộng bộ lọc của bạn.</p>
                <button onClick={clearFilters} className={styles.btnPrimary}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className={styles.mobileBackdrop}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className={styles.mobileDrawer}
            >
              <div className={styles.drawerHandle} />

              <div className={styles.filterHeader}>
                <h3>
                  <Filter size={18} /> Bộ lọc sách
                </h3>
                <button
                  onClick={() => {
                    clearFilters();
                    setMobileFilterOpen(false);
                  }}
                  className={styles.btnClearFilterRed}
                >
                  Xóa lọc
                </button>
              </div>

              <div className={styles.filterGroup}>
                <h4>Phân loại cấp 1</h4>
                <div className={styles.mobileCategoryStack}>
                  {categoryGroups.map((category) => {
                    const isActive = selectedTopCategory === category.slug;

                    return (
                      <button
                        key={category.slug}
                        onClick={() => handleTopCategorySelect(category.slug)}
                        className={`${styles.mobileCategoryCard} ${isActive ? styles.mobileCategoryCardActive : ""
                          }`}
                      >
                        <strong>{category.name}</strong>
                        <span>{category.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTopCategory && (
                <div className={styles.filterGroup}>
                  <h4>Phân loại cấp 2</h4>
                  <div className={styles.filterGrid2}>
                    <button
                      onClick={() => setSelectedSubCategory("all")}
                      className={`${styles.filterBtn} ${selectedSubCategory === "all" ? styles.filterBtnActive : ""
                        }`}
                    >
                      Tất cả
                    </button>
                    {activeTopCategory.subcategories.map((subCategory) => (
                      <button
                        key={subCategory.slug}
                        onClick={() => setSelectedSubCategory(subCategory.slug)}
                        className={`${styles.filterBtn} ${selectedSubCategory === subCategory.slug ? styles.filterBtnActive : ""
                          }`}
                      >
                        {subCategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.filterGroup}>
                <h4>Khu vực (Hà Nội)</h4>
                <select
                  value={userDistrict}
                  onChange={(e) => setUserDistrict(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Toàn quốc (Tất cả)</option>
                  {HANOI_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <h4>Bán kính xung quanh</h4>
                <div className={styles.filterGrid4}>
                  {["1km", "3km", "5km", "10km"].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => setActiveRadius(prev => prev === radius ? "" : radius)}
                      className={`${styles.filterBtn} ${activeRadius === radius ? styles.filterBtnActive : ""}`}
                    >
                      {radius}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4>Tình trạng sách</h4>
                <div className={styles.filterGrid2}>
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "new", label: "Mới / Như mới" },
                    { id: "good", label: "Còn tốt" },
                    { id: "old", label: "Đã cũ" },
                  ].map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(prev => prev === condition.id ? "all" : condition.id)}
                      className={`${styles.filterBtn} ${selectedCondition === condition.id ? styles.filterBtnActive : ""
                        }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.locationBox}>
                <p>Vị trí hiện tại</p>
                <div className={styles.locationTag}>
                  <MapPin size={14} className={styles.pinIcon} />
                  <span>{userLocation}</span>
                </div>
              </div>

              <button onClick={() => setMobileFilterOpen(false)} className={styles.btnPrimaryFull}>
                Áp dụng bộ lọc
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
