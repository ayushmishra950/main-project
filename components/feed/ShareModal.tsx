import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Modal} from 'react-native';
import { X, Send, Search } from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import { USERS } from '@/data/dummyData';
import { getAllUser } from '@/service/auth';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { setUserList } from '@/redux-toolkit/slice/userSlice';
import { sharePost } from '@/service/post';
import {Alert} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUserChatList } from '@/redux-toolkit/slice/chatSlice';
import { getChatUsers } from '@/service/chat';

interface Props {
  visible: boolean;
  onClose: () => void;
  post: any;
}

export default function ShareModal({ visible, onClose, post }: Props) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"single" | "group">('group');
 const friendList = useAppSelector((state) => state?.chat?.userChatList);

   const filtered = useMemo(() => {
        return friendList
            ?.filter(item => item.isGroup === (activeTab === "group"))
            ?.filter(item => {
                if (!search) return true;

                const name = item.isGroup
                    ? item?.group?.title
                    : item?.friend?.fullName;

                return name?.toLowerCase().includes(search.toLowerCase());
            });
    }, [friendList, activeTab, search]);


  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

   const handleSharePost = async () => {
        if (!user?._id || !post?._id || !selected.length) return;
        try {
            const obj = { fromId: user?._id, toId: selected, postId: post?._id, activeTab: activeTab };
            const res = await sharePost(obj);
            if (res.status === 200) {
                Alert.alert("Post Shared", res?.data?.message || "The post has been shared successfully.");
                onClose();
            }
        } catch (err: any) {
            Alert.alert("Share Failed", err?.response?.data?.message || err?.message || "An error occurred while sharing the post.");
        }
    };

   const handleGetFriendList = async () => {
        if (!user?._id) return;
        try {
            const res = await getChatUsers(user?._id);
            if (res.status === 200) {
                dispatch(setUserChatList(res?.data?.friends));
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (visible && (!friendList?.length || user?._id)) {
            handleGetFriendList();
        }
    }, [visible, user?._id]);

    useEffect(() => {
      const getUser = async() => {
        const userData = await AsyncStorage.getItem("user");
        setUser(userData ? JSON.parse(userData) : null);
      };
      if(user === null){
        getUser();
      }
    },[user]);
  

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.gray400} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search color={Colors.gray500} size={18} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search friends..."
              placeholderTextColor={Colors.gray500}
            />
          </View>

          <FlatList 
            data={filtered}
            keyExtractor={(u:any) => u?._id}
            renderItem={({ item }) => {
              const isSel = selected.includes(item?._id);
              return (
                <TouchableOpacity style={styles.userRow} onPress={() => toggle(item?._id)}>
                  <Avatar uri={item?.friend?.profileImage || item?.group?.images?.[0]} size={44} isOnline={item?.isOnline} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>{item?.friend?.fullName || item?.group?.title}</Text>
                    <Text style={styles.userHandle}>{item?.friend?.fullName || item?.group?.title}</Text>
                  </View>
                  <View style={[styles.checkCircle, isSel && styles.checkCircleActive]}>
                    {isSel && <Send color={Colors.white} size={12} />}
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.sendBtn, !selected.length && { opacity: 0.5 }]}
              disabled={!selected.length}
              onPress={onClose}
            >
              <Text style={styles.sendBtnText}>Send to {selected.length || ''} {selected.length ? 'friend' + (selected.length > 1 ? 's' : '') : 'friends'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  userName: {
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
  },
  userHandle: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: 14,
    alignItems: 'center',
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
});


