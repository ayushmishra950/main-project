import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Image, Modal, ScrollView, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, Search, Users, MessageCircle, Grid2x2 as Grid, LogOut, Megaphone, Calendar, ChevronDown, Image as ImageIcon, Video, Send, BadgeCheck, User } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';

const topIcons = [
  { icon: Users, label: 'Friends', route: '/friends' },
  { icon: Grid, label: 'Directory', route: '/directory' },
  { icon: Megaphone, label: 'News', route: '/announcements' },
  { icon: Users, label: 'Groups', route: '/(tabs)/groups' },
  { icon: Calendar, label: 'Events', route: '/(tabs)/events' },
];
import Avatar from '@/components/ui/Avatar';
import StoryBar from '@/components/feed/StoryBar';
import PostCard from '@/components/feed/PostCard';
import CommentSheet from '@/components/feed/CommentSheet';
import ShareModal from '@/components/feed/ShareModal';
import PremiumCard from '@/components/ui/PremiumCard';
import { PostSkeleton } from '@/components/ui/SkeletonLoader';
import { useApp } from '@/context/AppContext';
import { CURRENT_USER } from '@/data/dummyData';
import { getAllPost } from '@/service/post';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { setPostList } from '@/redux-toolkit/slice/postSlice';
import PostDialog from '@/components/forms/PostDialog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmDialog from "@/components/forms/ConfirmDialog";
import { getAllUser, getSingleUserDetail } from '@/service/auth';
import { setUserCount, setUserData, setUserList } from '@/redux-toolkit/slice/userSlice';
import { disconnectSocket } from '@/socket/socket';


export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const reduxPosts = useAppSelector((state) => state.post.postList);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [sharePost, setSharePost] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [postText, setPostText] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifCount] = useState(5);
  const [open, setOpen] = useState(false);
  const userDatas = useAppSelector((state) => state?.user?.userData);
  const userList = useAppSelector((state) => state?.user?.userList);
  const premiumStatus = userDatas?.user?.premiumUser;
  const isPremium = premiumStatus === "premium";
  const isPending = (premiumStatus === null && userDatas?.user?.amount && userDatas?.user?.paymentImage);
  const isNotApplied = (premiumStatus === null && !userDatas?.user?.amount && !userDatas?.user?.paymentImage);
  const filteredUsers = userList?.filter((user: any) =>
    user?.fullName?.toLowerCase()?.includes(searchText?.toLowerCase()) ||
    user?.email?.toLowerCase()?.includes(searchText?.toLowerCase())
  );


   const handleGetSingle = async () => {
    const userData = await AsyncStorage.getItem("user").then(res => res ? JSON.parse(res) : null);
    const userId = userData?._id;
    if (!userId) return;
    try {
      const res = await getSingleUserDetail(userId);
      if (res.status === 200) {
        dispatch(setUserData(res?.data));
      };
    } catch (err: any) {
      console.log(err?.response?.data?.message || err?.message);
    }
  };
  useEffect(() => {
    handleGetSingle();
  }, [userDatas]);


  const fetchUsers = async () => {
    try {
      const res = await getAllUser();
      const users = res?.data?.data ?? [];
      dispatch(setUserList(users));
      dispatch(setUserCount(users.length));
    } catch (err: any) {
      console.log(err?.response?.data?.message);
    }
  };
  useEffect(() => {
    if (userList?.length === 0) {
      fetchUsers();
    }
  }, [userList?.length])

  const handleLogout = async () => {
    try {
      setLoading(true);
      disconnectSocket()
      await AsyncStorage.removeItem('accessToken');
      setOpen(false);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await getAllPost();
        const posts = res?.data?.posts ?? [];
        if (!mounted) return;
        dispatch(setPostList(posts));
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleStoryPress = useCallback((s: any) => {
    router.push({ pathname: '/profile/[id]', params: { id: s.id } } as any);
  }, []);

  const memoStoryBar = useMemo(() => (
    <StoryBar onStoryPress={handleStoryPress} />
  ), [handleStoryPress]);


  const headerComponent = useMemo(() => {
    return (
      <View>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.searchWrapper}>
            <View style={styles.searchRow}>
              <Search color={Colors.gray500} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Vibe..."
                placeholderTextColor={Colors.gray500}
                value={searchText}
                onChangeText={(text) => { setSearchText(text); setShowSearchDropdown(text.trim().length > 0) }}
              />
            </View>
            {
              showSearchDropdown && (
                <View style={styles.searchDropdown}>
                  {
                    filteredUsers?.length > 0 ? (
                      filteredUsers.map((user: any) => (
                        <TouchableOpacity
                          key={user._id}
                          style={styles.searchUserItem}
                          onPress={() => {
                            setSearchText("");
                            setShowSearchDropdown(false);

                            router.push({
                              pathname: "/profile/[id]",
                              params: { id: user._id },
                            } as any);
                          }}
                        >
                          <Avatar uri={user?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} size={40} />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userName}>
                              {user?.fullName}
                            </Text>

                            <Text style={styles.userUsername}>
                              @{user?.email}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.notFoundContainer}>
                        <Text style={styles.notFoundText}>
                          No user found
                        </Text>
                      </View>
                    )
                  }
                </View>
              )
            }
          </View>
          <View style={styles.topIcons}>
            {/* <TouchableOpacity style={styles.topIconBtn} onPress={() => { }}>
              <Bell color={Colors.gray300} size={22} />
              {notifCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifCount}</Text>
                </View>
              )}
            </TouchableOpacity> */} 
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Avatar uri={userDatas?.user?.profileImage} size={32} />
              <ChevronDown color={Colors.gray400} size={14} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Nav Icons */}
        <View style={styles.quickNav}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNavScroll}>
            {topIcons.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickNavItem}
                onPress={() => router.push(item.route as any)}
              >
                <LinearGradient
                  colors={[Colors.dark.surfaceSecondary, Colors.dark.surface]}
                  style={styles.quickNavIcon}
                >
                  <item.icon color={Colors.primary} size={20} />
                </LinearGradient>
                <Text style={styles.quickNavLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stories */}
        {memoStoryBar}

        {/* Create Post */}
        <View style={styles.createPost}>
          <Avatar uri={userDatas?.user?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} size={40} />
          <TouchableOpacity
            style={styles.createPostInput}
            onPress={() => setShowCreatePost(true)}
          >
            <Text style={styles.createPostPlaceholder}>What's on your mind?</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => setShowCreatePost(true)}>
            <ImageIcon color={Colors.success} size={18} />
            <Text style={styles.mediaBtnText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => setShowCreatePost(true)}>
            <Video color={Colors.error} size={18} />
            <Text style={styles.mediaBtnText}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => setShowCreatePost(true)}>
            <Send color={Colors.primary} size={18} />
            <Text style={styles.mediaBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Card */}
        {isNotApplied && <PremiumCard />}
      </View>
    )
  }, [searchText, showSearchDropdown, filteredUsers, isNotApplied, handleStoryPress]);

  const renderItem = ({ item, index }: any) => {
    // Transform backend post structure to PostCard expected format
    const post = {
      id: item._id,
      user: item.createdBy,
      title: item.title || '',
      description: item.description || '',
      images: item.images || [],
      likes: item.likes || [],
      type: item.type || "public",
      comments: item.comments || [],
      shares: 0,
      isLiked: false,
      isSaved: false,
      timestamp: new Date(item.createdAt).toLocaleDateString(),
    };

    return (
      <PostCard
        post={post}
        onComment={(post) => setSelectedPost(post)}
        onShare={post => setSharePost(post)}
      />
    );
  };

  const renderSkeletons = () => (
    <View>
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );

  return (
    <>
      <ConfirmDialog
        visible={open}
        onClose={() => setOpen(false)}
        loading={loading}
        title="Logout"
        description="Are you sure you want to logout?"
        buttonName="Logout"
        onConfirm={handleLogout}
      />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.dark.bg} />
        <FlatList
          data={loading ? [] : reduxPosts}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={loading ? renderSkeletons() : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />

        {/* Profile Dropdown */}
        {showDropdown && (
          <TouchableOpacity
            style={styles.dropdownOverlay}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  router.push('/(tabs)/profile');
                }} >
                <User color={Colors.gray300} size={18} />
                <Text style={styles.dropdownText}>Profile</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  router.push('/review');
                }}
              >
                <BadgeCheck color={Colors.gray300} size={18} />
                <Text style={styles.dropdownText}>Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  setOpen(true);
                }}
              >
                <LogOut color={Colors.error} size={18} />
                <Text style={[styles.dropdownText, { color: 'red' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        <CommentSheet
          visible={!!selectedPost}
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
        <ShareModal
          visible={!!sharePost}
          onClose={() => setSharePost(null)}
          post={sharePost}
        />

        <PostDialog
          visible={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          setPostListRefresh={setRefreshing}
        />
      </View>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  list: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: Colors.dark.bg,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchDropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 999,
    elevation: 10,
  },

  searchUserItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },

  userName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  userUsername: {
    color: "#999",
    fontSize: 13,
  },

  notFoundContainer: {
    padding: 15,
    alignItems: "center",
  },

  notFoundText: {
    color: "#999",
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Typography.fontWeights.bold,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickNav: {
    backgroundColor: Colors.dark.bg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  quickNavScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  quickNavItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickNavIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickNavLabel: {
    color: Colors.gray400,
    fontSize: Typography.fontSizes.xs,
  },
  createPost: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.dark.surface,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  createPostInput: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  createPostPlaceholder: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.base,
  },
  createPostActions: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  mediaBtnText: {
    color: Colors.gray300,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 90,
    right: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
});
