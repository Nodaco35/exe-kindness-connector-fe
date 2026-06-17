"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import styles from "./NotificationToast.module.scss";

function ToastItem({ notif, hideToast }: { notif: any, hideToast: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      hideToast(notif.id);
    }, 15000);
    return () => clearTimeout(timer);
  }, [notif.id, hideToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={styles.toastCard}
    >
      <div className={styles.iconWrapper}>
        {notif.type === "CHAT_MESSAGE" ? (
          <MessageCircle size={20} className={styles.chatIcon} />
        ) : (
          <Bell size={20} className={styles.bellIcon} />
        )}
      </div>
      <div className={styles.contentWrapper}>
        <h4 className={styles.title}>{notif.title}</h4>
        <p className={styles.message}>{notif.message}</p>
      </div>
      <button 
        className={styles.closeButton}
        onClick={() => hideToast(notif.id)}
      >
        <X size={16} />
      </button>
      <div className={styles.progressBarWrapper}>
        <motion.div 
          className={styles.progressBar}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 15, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export default function NotificationToast() {
  const notifications = useNotificationStore(state => state.notifications);
  const hideToast = useNotificationStore(state => state.hideToast);

  // Lọc ra các notification đang có cờ isVisible = true
  const visibleNotifications = notifications.filter(n => n.isVisible);

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {visibleNotifications.map((notif) => (
          <ToastItem key={notif.id} notif={notif} hideToast={hideToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
