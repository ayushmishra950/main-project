import React, { createContext, useContext, useState, ReactNode } from 'react';
import { POSTS, CURRENT_USER } from '@/data/dummyData';
import {likeAnUnLikePost} from "@/service/post";
import { Alert } from 'react-native';
import {setPostLikeAnUnLike} from "@/redux-toolkit/slice/postSlice";
import {useAppDispatch} from "@/redux-toolkit/customHook/hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = 'dark' | 'light';

interface AppState {
  themeMode: ThemeMode;
  isAuthenticated: boolean;
  currentUser: typeof CURRENT_USER;
  posts: typeof POSTS;
  toggleTheme: () => void;
  setAuthenticated: (v: boolean) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState(POSTS);

  const toggleTheme = () => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  const setAuthenticated = (v: boolean) => setIsAuthenticated(v);

  const toggleLike = async(postId: string) => {
    const user = await AsyncStorage.getItem("user");
    const userId = user ? JSON.parse(user)._id : null;
    let obj = {postId, userId};
    try{
      const res = await likeAnUnLikePost(obj);
      if(res.status === 200) {
        Alert.alert('Post Like/Unlike Successful.', res?.data?.message || "Post like/unlike action completed successfully.");
        dispatch(setPostLikeAnUnLike({ postId, userId: userId }));
      }
    } 
    catch(err:any){
      console.log('Error toggling like:', err);
      Alert.alert('Post Like/Unlike Failed.', err?.response?.data?.message || err?.message || "Post like/unlike action failed. Please try again.");
    }
  };

  const toggleSave = (postId: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  return (
    <AppContext.Provider
      value={{
        themeMode,
        isAuthenticated,
        currentUser: CURRENT_USER,
        posts,
        toggleTheme,
        setAuthenticated,
        toggleLike,
        toggleSave,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useTheme() {
  const { themeMode } = useApp();
  const isDark = themeMode === 'dark';
  return { isDark, themeMode };
}
