import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";


import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { AppProvider } from "@/context/AppContext";
import { store } from "@/redux-toolkit/store/store";
import { initSocket } from "@/socket/socket";

export default function RootLayout() {
  useFrameworkReady();

  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);

  // =========================
  // SOCKET INITIALIZATION
  // =========================
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        console.log("🔄 Initializing Socket...");

        const s = await initSocket();

        setSocket(s);

        s.on("connect", () => {
          console.log("✅ SOCKET CONNECTED:", s.id);
        });

        s.on("connect_error", (err: any) => {
          console.log("❌ SOCKET ERROR:", err?.message);
        });
      } catch (error) {
        console.log("❌ SOCKET INIT ERROR:", error);
      }
    };

    initializeSocket();
  }, []);

  // =========================
  // JOIN ROOM
  // =========================
  useEffect(() => {
    if (!socket) return;

    const joinUserRoom = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");

        const userId = userData
          ? JSON.parse(userData)?._id
          : null;

        if (!userId) return;

        const joinRoom = () => {
          console.log("🏠 Joining Room:", userId);

          socket.emit("joinRoom", userId);
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.once("connect", joinRoom);
        }
      } catch (error) {
        console.log("❌ Join Room Error:", error);
      }
    };

    joinUserRoom();

    return () => {
      socket.off("connect");
    };
  }, [socket]);

  // =========================
  // LOGIN CHECK
  // =========================
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.log("❌ Login Check Error:", error);
      }
    };

    checkLogin();
  }, []);

  return (
    <Provider store={store}>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="group/[id]" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="directory" />
          <Stack.Screen name="announcements" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="review" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </AppProvider>
    </Provider>
  );
}