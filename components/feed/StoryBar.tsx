import React, { use, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '@/components/ui/Avatar';
import { Colors, Typography } from '@/constants/theme';
import { CURRENT_USER } from '@/data/dummyData';
import { getAllUser } from '@/service/auth';
import { setUserList, setUserCount } from '@/redux-toolkit/slice/userSlice';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  onStoryPress?: (story: any) => void;
  onAddStory?: () => void;
}

export default function StoryBar({ onStoryPress, onAddStory }: Props) {
  const dispatch = useAppDispatch();
  const userList = useAppSelector((state) => state.user.userList);
  const [user, setUser] = useState<any>(null);

 useEffect(() => {
  const getUser = async () => {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };
  getUser();
}, []);

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      try {
        const res = await getAllUser();
        const users = res?.data?.data ?? [];
        if (!mounted) return;
        dispatch(setUserList(users));
        dispatch(setUserCount(users.length));
      } catch (err:any) {
        console.log(err?.response?.data?.message);
      }
    };

    fetchUsers();

    return () => {
      mounted = false;
    };
  }, [dispatch]);
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Add Story */}
        <TouchableOpacity style={styles.storyItem} onPress={onAddStory}>
          <View style={styles.addStory}>
            <Avatar uri={user?.profileImage || ''} size={56} />
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]} style={styles.addBtn}
            >
              <Plus color={Colors.white} size={14} />
            </LinearGradient>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>
            Your story
          </Text>
        </TouchableOpacity>

        {/* Stories (from backend via Redux) */}
        {userList.map(user => {
          const story = {
            id: user._id,
            user: { 
              id: user._id,
              avatar: user.profileImage || '', 
              name: user.fullName || '' 
            },
            viewed: false,
          };

          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => onStoryPress?.(story)}
            >
              <Avatar
                uri={story.user.avatar}
                size={56}
                hasStory
                storyViewed={story.viewed}
              />
              <Text style={styles.storyName} numberOfLines={1}>
                {story.user.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  addStory: {
    position: 'relative',
  },
  addBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.bg,
  },
  storyName: {
    color: Colors.gray300,
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
  },
});
