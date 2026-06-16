"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquare, Clock } from "lucide-react";
import axios from "axios";
import styles from "./page.module.scss";

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        router.push("/login");
        return;
      }
      const auth = JSON.parse(authStr);
      setUserId(auth.id);

      const res = await axios.get(`${API_URL}/exchange`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setRequests(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);

      await axios.patch(`${API_URL}/exchange/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      
      fetchRequests(); // refresh
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const incomingRequests = requests.filter(r => r.owner._id === userId);
  const outgoingRequests = requests.filter(r => r.requester._id === userId);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Quản lý yêu cầu</h1>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2>Yêu cầu tôi nhận được (Sách của tôi)</h2>
          {incomingRequests.length === 0 ? (
            <p className={styles.empty}>Không có yêu cầu nào.</p>
          ) : (
            <div className={styles.list}>
              {incomingRequests.map(req => (
                <div key={req._id} className={styles.requestCard}>
                  <div className={styles.info}>
                    <p><strong>{req.requester.fullName}</strong> muốn nhận cuốn <strong>{req.book.title}</strong></p>
                    <span className={`${styles.status} ${styles[req.status]}`}>{req.status}</span>
                  </div>
                  <div className={styles.actions}>
                    {req.status === 'PENDING' && (
                      <>
                        <button className={styles.acceptBtn} onClick={() => handleUpdateStatus(req._id, 'ACCEPTED')}>
                          <Check size={16} /> Chấp nhận
                        </button>
                        <button className={styles.rejectBtn} onClick={() => handleUpdateStatus(req._id, 'REJECTED')}>
                          <X size={16} /> Từ chối
                        </button>
                      </>
                    )}
                    {req.status === 'ACCEPTED' && (
                      <button className={styles.chatBtn} onClick={() => router.push(`/chat?room=${req.chatRoomId}`)}>
                        <MessageSquare size={16} /> Nhắn tin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Yêu cầu tôi gửi đi (Xin sách)</h2>
          {outgoingRequests.length === 0 ? (
            <p className={styles.empty}>Bạn chưa xin cuốn sách nào.</p>
          ) : (
            <div className={styles.list}>
              {outgoingRequests.map(req => (
                <div key={req._id} className={styles.requestCard}>
                  <div className={styles.info}>
                    <p>Bạn đã xin cuốn <strong>{req.book.title}</strong> từ <strong>{req.owner.fullName}</strong></p>
                    <span className={`${styles.status} ${styles[req.status]}`}>{req.status}</span>
                  </div>
                  <div className={styles.actions}>
                    {req.status === 'ACCEPTED' && req.chatRoomId && (
                      <button className={styles.chatBtn} onClick={() => router.push(`/chat?room=${req.chatRoomId}`)}>
                        <MessageSquare size={16} /> Nhắn tin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
