"use client";

import { API_URL } from "@/config/api";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import RatingModal from "../../components/RatingModal";
import styles from "./page.module.scss";

function ChatComponent() {
  const searchParams = useSearchParams();
  const roomIdQuery = searchParams.get("room");

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const authStr = localStorage.getItem("bookshare_auth_v3");
    if (authStr) {
      const auth = JSON.parse(authStr);
      setUserId(auth.id);

      // Connect Socket
      socketRef.current = io(`${API_URL}`);

      socketRef.current.on("connect", () => {
        console.log("Connected to chat server");
      });

      socketRef.current.on("newMessage", (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      socketRef.current.on("errorMessage", (err) => {
        alert(err.message);
      });

      socketRef.current.on("exchange_canceled", (data) => {
        alert(data.message);
        setRooms(prev => prev.map(r => r.activeExchange?._id === data.exchangeId ? { ...r, activeExchange: { ...r.activeExchange, status: 'CANCELED' } } : r));
        setActiveRoom((prev: any) => prev?.activeExchange?._id === data.exchangeId ? { ...prev, activeExchange: { ...prev.activeExchange, status: 'CANCELED' } } : prev);
      });

      socketRef.current.on("exchange_completed", (data) => {
        alert(data.message);
        setRooms(prev => prev.map(r => r.activeExchange?._id === data.exchangeId ? { ...r, activeExchange: { ...r.activeExchange, status: 'COMPLETED' } } : r));
        setActiveRoom((prev: any) => prev?.activeExchange?._id === data.exchangeId ? { ...prev, activeExchange: { ...prev.activeExchange, status: 'COMPLETED' } } : prev);
      });

      fetchRooms(auth);

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (rooms.length > 0 && roomIdQuery) {
      const room = rooms.find(r => r._id === roomIdQuery);
      if (room) {
        selectRoom(room);
      }
    } else if (rooms.length > 0 && !activeRoom) {
      selectRoom(rooms[0]);
    }
  }, [rooms, roomIdQuery]);

  const fetchRooms = async (auth: any) => {
    try {
      const res = await axios.get(`${API_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectRoom = async (room: any) => {
    setActiveRoom(room);
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", { roomId: room._id });
    }
    
    // Fetch old messages
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      const res = await axios.get(`${API_URL}/chat/rooms/${room._id}/messages`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      roomId: activeRoom._id,
      senderId: userId,
      content: newMessage
    });

    setNewMessage("");
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getOtherParticipant = (room: any) => {
    return room.participants.find((p: any) => p._id !== userId) || room.participants[0];
  };

  const handleCancelExchange = async () => {
    if (!activeRoom || !activeRoom.activeExchange) return;
    if (!confirm("Bạn có chắc chắn muốn hủy giao dịch này?")) return;
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.patch(`${API_URL}/exchange/${activeRoom.activeExchange._id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      // Socket event will handle UI update
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi hủy giao dịch");
    }
  };

  const handleCompleteExchange = async () => {
    if (!activeRoom || !activeRoom.activeExchange) return;
    if (!confirm("Xác nhận hoàn tất giao dịch? Cả hai sẽ nhận được điểm thưởng.")) return;
    try {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      const auth = JSON.parse(authStr!);
      await axios.patch(`${API_URL}/exchange/${activeRoom.activeExchange._id}/complete`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      // Socket event will handle UI update
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi hoàn tất giao dịch");
    }
  };

  const isChatLocked = !activeRoom?.activeExchange || activeRoom?.activeExchange?.status === 'CANCELED' || activeRoom?.activeExchange?.status === 'COMPLETED';

  return (
    <div className={styles.container}>
      <div className={styles.chatWrapper}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Tin nhắn ({rooms.length})</h3>
          </div>
          <div className={styles.roomList}>
            {rooms.map(room => {
              const other = getOtherParticipant(room);
              return (
                <div 
                  key={room._id} 
                  className={`${styles.roomItem} ${activeRoom?._id === room._id ? styles.active : ''}`}
                  onClick={() => selectRoom(room)}
                >
                  <img src={other.avatar || "https://ui-avatars.com/api/?name=U&background=random"} alt="" className={styles.avatar} />
                  <div className={styles.roomInfo}>
                    <h4>{other.fullName}</h4>
                    <p>
                      {room.activeExchange 
                        ? `Đang trao đổi: ${room.activeExchange?.book?.title}` 
                        : "Chưa có giao dịch"}
                    </p>
                  </div>
                </div>
              )
            })}
            {rooms.length === 0 && (
              <div className={styles.emptyRooms}>Không có cuộc trò chuyện nào</div>
            )}
          </div>
        </div>

        <div className={styles.chatArea}>
          {activeRoom ? (
            <>
              <div className={styles.chatHeader}>
                <img src={getOtherParticipant(activeRoom).avatar || "https://ui-avatars.com/api/?name=U&background=random"} alt="" className={styles.avatar} />
                <div className={styles.chatHeaderInfo}>
                  <h3>{getOtherParticipant(activeRoom).fullName}</h3>
                  <p>
                    {activeRoom.activeExchange 
                      ? `Trao đổi: ${activeRoom.activeExchange.book?.title} - Trạng thái: ${activeRoom.activeExchange.status}`
                      : "Không có giao dịch nào đang diễn ra"
                    }
                  </p>
                </div>
                <div className={styles.chatActions}>
                  {activeRoom.activeExchange?.status === 'ACCEPTED' && (
                    <>
                      <button className={styles.completeBtn} onClick={handleCompleteExchange}>Hoàn tất giao dịch</button>
                      <button className={styles.cancelBtn} onClick={handleCancelExchange}>Hủy giao dịch</button>
                    </>
                  )}
                  {activeRoom.activeExchange?.status === 'COMPLETED' && (
                    <button className={styles.rateBtn} onClick={() => setIsRatingModalOpen(true)}>Đánh giá người dùng</button>
                  )}
                </div>
              </div>

              <div className={styles.messagesContainer}>
                {messages.map((msg, idx) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg._id || idx} className={styles.systemMessage}>
                        <span>{msg.content}</span>
                      </div>
                    );
                  }

                  const isMine = typeof msg.senderId === 'string' ? msg.senderId === userId : msg.senderId?._id === userId;
                  return (
                    <div key={msg._id || idx} className={`${styles.messageWrapper} ${isMine ? styles.mine : styles.theirs}`}>
                      {!isMine && (
                        <div className={styles.msgAvatar}>
                           <UserIcon size={14} />
                        </div>
                      )}
                      <div className={styles.messageBubble}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {isChatLocked ? (
                <div className={styles.lockedMessage}>
                  {activeRoom.activeExchange 
                    ? `Giao dịch hiện tại đã ${activeRoom.activeExchange.status}. Không thể gửi tin nhắn.` 
                    : "Chưa có giao dịch nào được bắt đầu. Không thể gửi tin nhắn."}
                </div>
              ) : (
                <form className={styles.inputArea} onSubmit={sendMessage}>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..." 
                    className={styles.input}
                  />
                  <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <MessageSquare size={48} className={styles.emptyIcon} />
              <h2>Chưa chọn phòng chat</h2>
              <p>Hãy chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
      
      {isRatingModalOpen && activeRoom && activeRoom.activeExchange && (
        <RatingModal
          exchangeId={activeRoom.activeExchange._id}
          reviewedUserId={getOtherParticipant(activeRoom)._id}
          onClose={() => setIsRatingModalOpen(false)}
          onSuccess={() => console.log('Rated')}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ChatComponent />
    </Suspense>
  );
}
