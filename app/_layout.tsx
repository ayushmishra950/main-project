import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import {Provider} from "react-redux";
import {store} from "@/redux-toolkit/store/store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRouter} from "expo-router";
import {getSocket, initSocket  } from '@/socket/socket';

export default function RootLayout() {
  const socket = getSocket();
  useFrameworkReady();
  const router = useRouter();
 useEffect(() => {
  const setupSocket = async () => {
    console.log("🔄 Initializing socket...");

    const socket = await initSocket();

    console.log("🚀 Socket init complete");

    socket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err:any) => {
      console.log("❌ SOCKET ERROR:", err.message);
    });
  };

  setupSocket();
}, []);

  useEffect(() => {
    if(!socket) return;
  const getUser = async () => {
    const userData = await AsyncStorage.getItem("user");
    const userId = userData ? JSON.parse(userData)?._id : null;

    if (!userId) return;

    if (socket.connected) {
      socket.emit("joinRoom", userId);
    } else {
      socket.on("connect", () => {
        socket.emit("joinRoom", userId);
      });
    }
  };
  getUser();
}, []);

const checkLogin = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (token) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  } catch (error) {
    console.log(error);
  }
};

 useEffect(() => {
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
