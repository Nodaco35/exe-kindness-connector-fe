"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/config/api";
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
    const authStr = localStorage.getItem("bookshare_auth_v3");
    if (!authStr) return;

    try {
      const auth = JSON.parse(authStr);
      if (!auth.id) return;

      const socketInstance = io(API_URL);

      socketInstance.on("connect", () => {
        console.log("Global socket connected");
        // Gửi event để đăng ký userId vào personal room
        socketInstance.emit("register", { userId: auth.id });
      });

      socketInstance.on("new_notification", (data) => {
        addNotification({
          id: data.id || Date.now().toString(),
          type: data.type || "BOOK_REQUEST",
          title: data.title || "Thông báo mới",
          message: data.message || "",
          createdAt: data.createdAt || Date.now()
        });
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch (err) {
      console.error("SocketProvider init error", err);
    }
  }, [addNotification]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
