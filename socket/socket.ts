// import { io, Socket } from "socket.io-client";
// import api from "@/axios/axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_SOCKET_URL;

// let socket: Socket | null = null;
// let isRefreshing = false;

// export const initSocket = async () => {
//   if (socket) {
//     console.log("♻️ Socket already exists");
//     return socket;
//   }

//   console.log("🚀 Initializing socket...");

//   const token = await AsyncStorage.getItem("accessToken");

//   socket = io(SOCKET_URL, {
//     transports: ["websocket"], // ⚠️ force websocket (remove polling for debugging)
//     auth: {
//       token: token || ""
//     },
//     reconnection: true,
//     timeout: 10000,
//   });

//   // =====================
//   // CONNECT SUCCESS
//   // =====================
//   socket.on("connect", () => {
//     console.log("✅ SOCKET CONNECTED");
//     console.log("🆔 Socket ID:", socket?.id);
//   });

//   // =====================
//   // DISCONNECT
//   // =====================
//   socket.on("disconnect", (reason) => {
//     console.log("❌ SOCKET DISCONNECTED:", reason);
//   });

//   // =====================
//   // CONNECT ERROR
//   // =====================
//   socket.on("connect_error", async (err) => {
//     console.log("🚨 CONNECT ERROR:", err.message);

//     if (err.message?.includes("TokenExpired") && !isRefreshing) {
//       isRefreshing = true;

//       try {
//         const res = await api.post("/user/auth/refresh", {}, {
//           withCredentials: false
//         });

//         const newToken = res.data.accessToken;

//         await AsyncStorage.setItem("accessToken", newToken);

//         console.log("🔄 Token refreshed, reconnecting...");

//         socket?.disconnect();
//         if(!socket)return;
//         socket.auth = { token: newToken };

//         socket?.connect();
//       } catch (e) {
//         console.log("❌ Refresh failed → logout needed");
//       } finally {
//         isRefreshing = false;
//       }
//     }
//   });

//   return socket;
// };

// // SAFE ACCESS METHOD
// export const getSocket = () => {
//   if (!socket) {
//     console.log("⚠️ Socket not initialized yet");
//   }
//   return socket;
// };












import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/axios/axios";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_SOCKET_URL!;

let socket: Socket | null = null;
let isRefreshing = false;

export const initSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  const token = await AsyncStorage.getItem("accessToken");

  socket = io(SOCKET_URL, {
    auth: {
      token: token || "",
    },

    // websocket force mat karo
    transports: ["polling", "websocket"],

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket Connected");
    console.log("🆔 Socket ID:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket Disconnected:", reason);
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log("🔄 Reconnect Attempt:", attempt);
  });

  socket.io.on("reconnect", (attempt) => {
    console.log("✅ Reconnected:", attempt);
  });

  socket.io.on("reconnect_error", (err) => {
    console.log("❌ Reconnect Error:", err);
  });

  socket.io.on("reconnect_failed", () => {
    console.log("🚨 Reconnect Failed");
  });

  socket.on("connect_error", async (err: any) => {
    console.log("🚨 Connect Error:", err.message);

    if (
      err.message?.includes("TokenExpired") &&
      !isRefreshing
    ) {
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");

        const res = await api.post(
          "/user/auth/refresh",
          {},
          {
            withCredentials: false,
          }
        );

        const newToken = res.data.accessToken;

        await AsyncStorage.setItem(
          "accessToken",
          newToken
        );

        if (socket) {
          socket.auth = {
            token: newToken,
          };

          socket.connect();
        }

        console.log("✅ Token Refreshed");
      } catch (error) {
        console.log("❌ Refresh Failed");
      } finally {
        isRefreshing = false;
      }
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};