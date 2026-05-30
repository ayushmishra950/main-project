import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, StatusBar} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Pin, CircleAlert as AlertCircle, MessageCircle, Eye, Bell } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import { ANNOUNCEMENTS } from '@/data/dummyData';
import {getAllAnnouncement} from "@/service/announcement";
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import {setAnnouncementList} from "@/redux-toolkit/slice/announcementSlice";

export default function AnnouncementsScreen() {
  const dispatch = useAppDispatch();
  const pinned = ANNOUNCEMENTS.filter(a => a.isPinned);
  const regular = ANNOUNCEMENTS.filter(a => !a.isPinned);
  const announcementList = useAppSelector((state) => state?.announcement?.announcementList);
 const highPriorityCount = announcementList?.filter((item) => item?.priority === "high")?.length || 0;

  const handleGetAllAnnouncement = async() => {
    try{
      const res = await getAllAnnouncement();
      if(res.status === 200){
        dispatch(setAnnouncementList(res?.data?.announcements));
      }
    }
    catch(err:any) {
      console.log(err?.response?.data?.message || err?.message);
    }
  };

  useEffect(() => {
    if(announcementList?.length === 0){
      handleGetAllAnnouncement();
    }
  },[announcementList?.length])
  
  const formatCount = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();

  const renderAnnouncement = ({ item }: any) => (
    <TouchableOpacity style={[styles.card, item?.isPinned && styles.pinnedCard]}>
      {item?.isPinned && (
        <View style={styles.pinnedBanner}>
          <Pin color={Colors.warning} size={14} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}
      {item?.isImportant && (
        <View style={styles.importantBadge}>
          <AlertCircle color={Colors.error} size={14} />
          <Text style={styles.importantBadgeText}>Important</Text>
        </View>
      )}
    
        <Image source={{ uri: item?.image ? item?.image : "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?w=600&h=300&fit=crop" }} style={styles.cardImage} />

      <View style={styles.cardBody}>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{item?.priority}</Text>
        </View>
        <Text style={styles.cardTitle}>{item?.title}</Text>
        <Text style={styles.cardContent} numberOfLines={3}>{item.description}</Text>
        <View style={styles.authorRow}>
          <Image source={{ uri: item?.author?.avatar }} style={styles.authorAvatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.authorName}>{"Admin"}</Text>
            <Text style={styles.authorDate}>{new Date(item?.createdAt)?.toLocaleDateString()}</Text>
          </View>
        </View>
        {/* <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Eye color={Colors.gray500} size={14} />
            {/* <Text style={styles.statText}>{formatCount(item?.views)}</Text> 
          </View>
          <View style={styles.statItem}>
            <MessageCircle color={Colors.gray500} size={14} />
            <Text style={styles.statText}>{item?.comments}</Text>
          </View>
          <TouchableOpacity style={styles.readMoreBtn}>
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Bell color={Colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={announcementList}
        keyExtractor={(a:any) => a._id}
        renderItem={renderAnnouncement}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{announcementList?.length} Announcements</Text>
            <Text style={styles.summarySubtitle}>{highPriorityCount} High Priority · Stay informed</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, color: Colors.white, fontSize: Typography.fontSizes['2xl'], fontWeight: Typography.fontWeights.bold },
  bellBtn: { padding: 4 },
  summaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  summaryTitle: { color: Colors.white, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  summarySubtitle: { color: Colors.gray500, fontSize: Typography.fontSizes.sm, marginTop: 4 },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  pinnedCard: {
    borderColor: Colors.warning + '50',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '30',
  },
  pinnedText: { color: Colors.warning, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold },
  importantBadge: {
    position: 'absolute',
    top: 46,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  importantBadgeText: { color: Colors.error, fontSize: Typography.fontSizes.xs },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardBody: { padding: 16 },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  categoryChipText: { color: Colors.primary, fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold },
  cardTitle: { color: Colors.white, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, lineHeight: 24, marginBottom: 8 },
  cardContent: { color: Colors.gray400, fontSize: Typography.fontSizes.base, lineHeight: 22, marginBottom: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark.border },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  authorName: { color: Colors.white, fontSize: Typography.fontSizes.base, fontWeight: Typography.fontWeights.medium },
  authorDate: { color: Colors.gray500, fontSize: Typography.fontSizes.sm, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: Colors.gray500, fontSize: Typography.fontSizes.sm },
  readMoreBtn: { marginLeft: 'auto' },
  readMoreText: { color: Colors.primary, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold },
});
