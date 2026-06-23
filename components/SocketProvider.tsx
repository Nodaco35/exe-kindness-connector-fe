"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useNotificationStore } from "@/store/useNotificationStore";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context.socket;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const connectSocket = () => {
      const authStr = localStorage.getItem("bookshare_auth_v3");
      if (!authStr) {
        if (socketInstance) {
          socketInstance.disconnect();
          setSocket(null);
        }
        return;
      }

      try {
        const auth = JSON.parse(authStr);
        if (!auth.id) return;

        // Fetch unread notifications from DB
        axios.get(`${API_URL}/notification/unread`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        }).then(res => {
          const unread = res.data;
          useNotificationStore.setState({ notifications: unread.map((n: any) => ({ ...n, id: n._id, isVisible: false })) });
        }).catch(err => console.error("Failed to fetch notifications", err));

        // Tránh kết nối lại nếu đã có kết nối hợp lệ cho cùng userId
        if (socketInstance && socketInstance.connected) return;

        socketInstance = io(API_URL);

        socketInstance.on("connect", () => {
          console.log("Global socket connected");
          socketInstance?.emit("register", { userId: auth.id });
        });

        socketInstance.on("new_notification", (data) => {
          addNotification({
            id: data.id || Date.now().toString(),
            type: data.type || "BOOK_REQUEST",
            title: data.title || "Thông báo mới",
            message: data.message || "",
            url: data.url,
            createdAt: data.createdAt || Date.now()
          });
        });

        setSocket(socketInstance);
      } catch (err) {
        console.error("SocketProvider init error", err);
      }
    };

    // Khởi tạo lần đầu
    connectSocket();

    // Lắng nghe sự kiện đăng nhập/đăng xuất
    const handleAuthChange = () => {
      connectSocket();
    };

    window.addEventListener("auth-updated", handleAuthChange);

    return () => {
      window.removeEventListener("auth-updated", handleAuthChange);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [addNotification]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
