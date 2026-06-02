import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import GradientButton from '@/components/ui/GradientButton';
import { useApp } from '@/context/AppContext';
import {loginUser} from "@/service/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket } from '@/socket/socket';
import { Alert } from 'react-native';


export default function LoginScreen() {
   const socket = getSocket();
  const { setAuthenticated } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try{ 
    setLoading(true);
    const res = await loginUser({identifier:email, password});
     if(res.status === 200){
       await AsyncStorage.setItem("accessToken", res?.data?.accessToken);
        await AsyncStorage.setItem("user", JSON.stringify(res?.data?.data));
        Alert.alert("Login Successful", res?.data?.message || "You have logged in successfully.");
        if(socket){
          socket.emit("joinRoom", res?.data?.data?._id);
        }
       setAuthenticated(true);
      router.replace('/(tabs)');
      setError('');
      setEmail('');
      setPassword('');
     }  
    }catch(err:any){ 
      console.log('Login error:', err?.response?.data?.message || err?.message); 
      Alert.alert("Login Failed", err.response?.data?.message || err?.message || 'Login failed');
      setError('');
    }
    finally{
      setLoading(false);
    }
  }; 

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050510', '#0A0A1F']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={Colors.gradients.cool as [string, string]}
              style={styles.logoBg}
            >
              <Zap color={Colors.white} size={28} fill={Colors.white} />
            </LinearGradient>
            <Text style={styles.appName}>Connect Share</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>
            <Text style={styles.subtext}>Sign in to continue your journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.inputWrap}>
              <Mail color={Colors.gray500} size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or mobile number"
                placeholderTextColor={Colors.gray500}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock color={Colors.gray500} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.gray500}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                {showPass ? (
                  <EyeOff color={Colors.gray500} size={18} />
                ) : (
                  <Eye color={Colors.gray500} size={18} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GradientButton
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={{ marginTop: 8 }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              {['G', 'f', 'in'].map(icon => (
                <TouchableOpacity key={icon} style={styles.socialBtn}>
                  <Text style={styles.socialIcon}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Sign up</Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
  },
  logoBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    color: Colors.white,
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    marginBottom: 4,
  },
  subtext: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.base,
  },
  form: {
    paddingHorizontal: 24,
    gap: 14,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
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
  inputIcon: {},
  input: {
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
    flex: 1,
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.sm,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    color: Colors.white,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: { color: Colors.gray500, fontSize: Typography.fontSizes.base },
  registerLink: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
  },
});
