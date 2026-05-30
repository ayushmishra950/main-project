import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone, AtSign, Camera, ArrowLeft } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import GradientButton from '@/components/ui/GradientButton';
import { useApp } from '@/context/AppContext';

export default function RegisterScreen() {
  const { setAuthenticated } = useApp();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', mobile: '', password: '', confirmPassword: ''});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const update = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };
 
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName) e.fullName = 'Full name is required';
    if (!form.username) e.username = 'Username is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.mobile) e.mobile = 'Mobile is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthenticated(true);
      router.replace('/(tabs)');
    }, 1200);
  };

  const fields = [
    { key: 'fullName', icon: User, placeholder: 'Full Name', type: 'default' },
    { key: 'username', icon: AtSign, placeholder: 'Username', type: 'default' },
    { key: 'email', icon: Mail, placeholder: 'Email Address', type: 'email-address' },
    { key: 'mobile', icon: Phone, placeholder: 'Mobile Number', type: 'phone-pad' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050510', '#0A0A1F']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.white} size={24} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.avatarPicker}>
              <View style={styles.avatarCircle}>
                <Camera color={Colors.gray400} size={28} />
              </View>
              <View style={styles.avatarAddBtn}>
                <Text style={styles.avatarAddText}>+</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join millions of people on Vibe</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {fields.map(f => (
              <View key={f.key}>
                <View style={[styles.inputWrap, errors[f.key] && styles.inputError]}>
                  <f.icon color={errors[f.key] ? Colors.error : Colors.gray500} size={18} />
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.gray500}
                    value={(form as any)[f.key]}
                    onChangeText={v => update(f.key, v)}
                    keyboardType={f.type as any}
                    autoCapitalize="none"
                  />
                </View>
                {errors[f.key] ? <Text style={styles.fieldError}>{errors[f.key]}</Text> : null}
              </View>
            ))}

            <View>
              <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                <Lock color={errors.password ? Colors.error : Colors.gray500} size={18} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={Colors.gray500}
                  value={form.password}
                  onChangeText={v => update('password', v)}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff color={Colors.gray500} size={18} /> : <Eye color={Colors.gray500} size={18} />}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>

            <View>
              <View style={[styles.inputWrap, errors.confirmPassword && styles.inputError]}>
                <Lock color={errors.confirmPassword ? Colors.error : Colors.gray500} size={18} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.gray500}
                  value={form.confirmPassword}
                  onChangeText={v => update('confirmPassword', v)}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff color={Colors.gray500} size={18} /> : <Eye color={Colors.gray500} size={18} />}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}
            </View>

            <Text style={styles.terms}>
              By creating an account, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>

            <GradientButton
              label="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  backBtn: {
    padding: 16,
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  avatarPicker: { position: 'relative', marginBottom: 16 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAddBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAddText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: 20,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.base,
  },
  form: {
    paddingHorizontal: 24,
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
    flex: 1,
  },
  fieldError: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xs,
    marginTop: 4,
    marginLeft: 4,
  },
  terms: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    color: Colors.primary,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: { color: Colors.gray500, fontSize: Typography.fontSizes.base },
  loginLink: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
  },
});
