"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Eye, Heart } from "lucide-react";
import styles from "./BookCard.module.scss";

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  images: string[];
  codition: string;
  category?: string;
  categories?: Array<{ name?: string; slug?: string; type?: string } | string>;
  advancedCategories?: Array<{ name?: string; slug?: string; type?: string } | string>;
  location: {
    city?: string;
    district?: string;
    ward?: string;
    street?: string;
  };
  owner?:
    | {
        _id?: string;
        avatar?: string;
        fullName?: string;
      }
    | string
    | null
    | undefined;
  status: string;
  viewCount: number;
  likes?: string[];
  createdAt?: string;
}

type StoredAuth = {
  id?: string;
  token?: string;
  isLoggedIn?: boolean;
};

const readStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("bookshare_auth_v3");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as StoredAuth;
  } catch {
    return null;
  }
};

import bookCategoriesData from "../book_categories.json";

const findCategoryNameBySlug = (slug: string): string => {
  for (const cat of bookCategoriesData) {
    if (cat.slug === slug) return cat.name;
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        if (sub.slug === slug) return sub.name;
      }
    }
  }
  return slug;
};

const getSlug = (value?: any[]): string | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  return typeof first === "string" ? first : (first?.slug || first?.name || null);
};

export default function BookCard({ book }: { book: Book }) {
  const [auth] = useState(readStoredAuth);

  const ownerId = typeof book.owner === "string" ? book.owner : book.owner?._id;
  const isOwner = Boolean(auth?.isLoggedIn && ownerId && ownerId === auth.id);

  const advancedSlug = getSlug(book.advancedCategories);
  const topSlug = getSlug(book.categories);
  const rawSlug = advancedSlug || topSlug || book.category;
  
  const categoryText = rawSlug ? findCategoryNameBySlug(rawSlug) : "Sách chung";

  const locationText = book.location 
    ? [book.location.district, book.location.city].filter(Boolean).join(", ") || "Toàn quốc"
    : "Toàn quốc";

  const cover = book.images && book.images.length > 0 ? book.images[0] : "https://via.placeholder.com/150";

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      className={styles.card}
    >
      <Link href={`/books/${book._id}`} className={styles.imageContainer}>
        <img
          src={cover}
          alt={book.title}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Book&background=random";
          }}
        />
      </Link>

      <div className={styles.content}>
        <Link href={`/books/${book._id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{book.title}</h3>
        </Link>
        <p className={styles.author}>{book.author}</p>

        <div className={styles.locationRow}>
          <MapPin size={14} />
          {locationText}
        </div>

        <div className={styles.badgesRow}>
          <div className={styles.categoryBadge}>{categoryText}</div>
          <div className={styles.conditionBadge}>
            {book.codition === "NEW" ? "Mới 100%" : book.codition === "LIKE_NEW" ? "Như mới" : "Sách cũ"}
          </div>
        </div>

        <div className={styles.footerRow}>
          <div className={styles.ownerInfo}>
            <span className={styles.ownerName}>
              {isOwner ? "Sách của Bạn" : typeof book.owner === "string" ? "Người dùng" : book.owner?.fullName || "Người dùng"}
            </span>
            <span className={styles.postDate}>
              Ngày đăng: {new Date(book.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className={styles.statsRow}>
            <span className={styles.statItem}>
              <Eye size={14} /> {book.viewCount || 0}
            </span>
            <span className={styles.statItem}>
              <Heart size={14} /> {book.likes?.length || 0}
            </span>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link
            href={`/books/${book._id}`}
            className={`${styles.actionButton} ${isOwner ? styles.btnOutline : styles.btnPrimary}`}
          >
            {isOwner ? "Quản lý lượt xin" : "Nhận sách miễn phí"}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
