import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated} from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, MoveHorizontal as MoreHorizontal, BadgeCheck } from 'lucide-react-native';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useEffect} from "react";

const { width: SCREEN_W } = Dimensions.get('window');

interface Post {
  id: string;
  user: any;
  text: string;
  images: string[];
  likes: string[];
  comments: any[];
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  tags?: string[];
} 

interface Props {
  post: Post;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
}

export default function PostCard({ post, onComment, onShare }: Props) {
  const { toggleLike, toggleSave } = useApp();
  const heartScale = useRef(new Animated.Value(1)).current;
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
  const getUser = async () => {
    const userData = await AsyncStorage.getItem('user');

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setCurrentUserId(parsedUser?._id);
    }
  };

  getUser();
}, []);

  const handleLike = () => {
    toggleLike(post.id);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar uri={post?.user?.profileImage || ''} size={44} isOnline={post?.user?.isOnline} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post?.user?.fullName}</Text>
            {post?.user?.isVerified && <BadgeCheck color={Colors.primary} size={16} />}
          </View>
          <Text style={styles.meta}>
            {post?.user?.fullName} · {post.timestamp}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MoreHorizontal color={Colors.gray400} size={20} />
        </TouchableOpacity>
      </View>
 
      {/* Text */}
      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.map(tag => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {/* Images */}
      {post?.images?.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {post.images.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={[styles.postImage, { width: post.images.length > 1 ? SCREEN_W - 48 : SCREEN_W }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                color={post?.likes?.includes(currentUserId) ? Colors.error : Colors.gray400}
                fill={post?.likes?.includes(currentUserId) ? Colors.error : 'transparent'}
                size={22}
              />
            </Animated.View>
            <Text style={[styles.actionCount, post?.likes?.includes(currentUserId) && { color: Colors.error }]}>
              {formatCount(post.likes?.length || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => onComment?.(post)}>
            <MessageCircle color={Colors.gray400} size={22} />
            <Text style={styles.actionCount}>{formatCount(post.comments.length || 0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => onShare?.(post)}>
            <Share2 color={Colors.gray400} size={22} />
            <Text style={styles.actionCount}>{formatCount(post.shares)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => toggleSave(post.id)}>
          <Bookmark
            color={post.isSaved ? Colors.primary : Colors.gray400}
            fill={post.isSaved ? Colors.primary : 'transparent'}
            size={22}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    marginBottom: 8,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  meta: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },
  text: {
    color: Colors.gray200,
    fontSize: Typography.fontSizes.base,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tag: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.sm,
  },
  imageScroll: {
    marginBottom: 4,
  },
  postImage: {
    height: 480,
    borderRadius: 0,
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: Colors.gray400,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});
