"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

const getCategoryLabel = (value?: Book["categories"], fallback = "Sách chung") => {
  if (!Array.isArray(value) || value.length === 0) return fallback;

  const first = value[0];
  if (typeof first === "string") return first || fallback;
  return first?.name || first?.slug || fallback;
};

export default function BookCard({ book }: { book: Book }) {
  const [auth] = useState(readStoredAuth);

  const ownerId = typeof book.owner === "string" ? book.owner : book.owner?._id;
  const isOwner = Boolean(auth?.isLoggedIn && ownerId && ownerId === auth.id);

  let statusClass = styles.statusAvailable;
  let displayStatus = "Có sẵn";

  if (book.status?.toUpperCase() === "PENDING") {
    statusClass = styles.statusPending;
    displayStatus = "Đã có người xin";
  }

  const categoryText =
    book.category ||
    getCategoryLabel(book.categories) ||
    getCategoryLabel(book.advancedCategories);

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
        <div className={styles.metaRow}>
          <div className={styles.categoryBadge}>{categoryText}</div>
          <div className={`${styles.statusBadge} ${statusClass}`}>{displayStatus}</div>
        </div>

        <Link href={`/books/${book._id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{book.title}</h3>
        </Link>
        <p className={styles.author}>{book.author}</p>

        <div className={styles.ownerInfo}>
          <div className={styles.avatar}>
            <img
              src={
                typeof book.owner === "string"
                  ? "https://ui-avatars.com/api/?name=User&background=random"
                  : book.owner?.avatar || "https://ui-avatars.com/api/?name=User&background=random"
              }
              alt={typeof book.owner === "string" ? "Người dùng" : book.owner?.fullName || "Người dùng"}
              className={styles.avatarImg}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=User&background=random";
              }}
            />
          </div>
          <span className={styles.ownerName}>
            {isOwner ? "Sách của Bạn" : `Sở hữu bởi ${typeof book.owner === "string" ? "Người dùng" : book.owner?.fullName || "Người dùng"}`}
          </span>
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
