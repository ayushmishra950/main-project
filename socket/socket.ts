import { io, Socket } from "socket.io-client";
import api from "@/axios/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_SOCKET_URL;

let socket: Socket | null = null;
let isRefreshing = false;

export const initSocket = async () => {
  if (socket) {
    console.log("♻️ Socket already exists");
    return socket;
  }

  console.log("🚀 Initializing socket...");

  const token = await AsyncStorage.getItem("accessToken");

  socket = io(SOCKET_URL, {
    transports: ["websocket"], // ⚠️ force websocket (remove polling for debugging)
    auth: {
      token: token || ""
    },
    reconnection: true,
    timeout: 10000,
  });

  // =====================
  // CONNECT SUCCESS
  // =====================
  socket.on("connect", () => {
    console.log("✅ SOCKET CONNECTED");
    console.log("🆔 Socket ID:", socket?.id);
  });

  // =====================
  // DISCONNECT
  // =====================
  socket.on("disconnect", (reason) => {
    console.log("❌ SOCKET DISCONNECTED:", reason);
  });

  // =====================
  // CONNECT ERROR
  // =====================
  socket.on("connect_error", async (err) => {
    console.log("🚨 CONNECT ERROR:", err.message);

    if (err.message?.includes("TokenExpired") && !isRefreshing) {
      isRefreshing = true;

      try {
        const res = await api.post("/user/auth/refresh", {}, {
          withCredentials: false
        });

        const newToken = res.data.accessToken;

        await AsyncStorage.setItem("accessToken", newToken);

        console.log("🔄 Token refreshed, reconnecting...");

        socket?.disconnect();
        if(!socket)return;
        socket.auth = { token: newToken };

        socket?.connect();
      } catch (e) {
        console.log("❌ Refresh failed → logout needed");
      } finally {
        isRefreshing = false;
      }
    }
  });

  return socket;
};

// SAFE ACCESS METHOD
export const getSocket = () => {
  if (!socket) {
    console.log("⚠️ Socket not initialized yet");
  }
  return socket;
};