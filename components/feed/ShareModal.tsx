import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Modal} from 'react-native';
import { X, Send, Search } from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import { USERS } from '@/data/dummyData';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ShareModal({ visible, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

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
            keyExtractor={u => u.id}
            renderItem={({ item }) => {
              const isSel = selected.includes(item.id);
              return (
                <TouchableOpacity style={styles.userRow} onPress={() => toggle(item.id)}>
                  <Avatar uri={item.avatar} size={44} isOnline={item.isOnline} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userHandle}>{item.username}</Text>
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
