import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin, Users, Briefcase, ArrowLeft } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import GradientButton from '@/components/ui/GradientButton';
import { useApp } from '@/context/AppContext';
import {Alert} from "react-native";
import { registerUser } from "@/service/auth";


export default function RegisterScreen() {
  const { setAuthenticated } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "", email: "", mobile: "", occupation: "",
    address: "", city: "", state: "", maritalStatus: "", password: "", confirmPassword: "",
    spouseName: "", spouseDob: "", spouseEmail: "", spouseMobile: "", spouseOccupation: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateStep = () => {
    const e: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.fullName) e.fullName = 'Full name is required';
      if (!form.dob) e.dob = 'Date of birth is required';
      if (!form.gender) e.gender = 'Gender is required';
      if (!form.email) e.email = 'Email is required';
      if (!form.mobile) e.mobile = 'Mobile is required';
      if (!form.occupation) e.occupation = 'Occupation is required';
    } 
    else if (currentStep === 2) {
      if (!form.address) e.address = 'Address is required';
      if (!form.city) e.city = 'City is required';
      if (!form.state) e.state = 'State is required';
      if (!form.maritalStatus) e.maritalStatus = 'Marital status is required';
      if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleRegister = async() => {
    if (!validateStep()) return;
    console.log("Registration data:", form);
    try{
       setLoading(true);
       const res = await registerUser(form);
       if (res.status === 201) {
               Alert.alert("Registration Successful", res?.data?.message || "Your account has been created successfully.");
                setAuthenticated(true);
                router.replace('/login');
            };
    }
    catch(err:any){
      console.log(err?.response?.data?.message || err?.message || "Registration failed");
      Alert.alert("Registration Failed", err?.response?.data?.message || err?.message || "Registration failed");
    }finally{ 
      setLoading(false);
    }
  };

  // Step 1 Fields (6)
  const step1Fields = [
    { key: 'fullName', label: 'Full Name', icon: User, placeholder: 'Enter your full name', type: 'default' },
    { key: 'dob', label: 'Date of Birth', icon: Calendar, placeholder: 'DD/MM/YYYY', type: 'default' },
    { key: 'gender', label: 'Gender', icon: Users, placeholder: 'Male / Female / Other', type: 'default' },
    { key: 'email', label: 'Email Address', icon: Mail, placeholder: 'your@email.com', type: 'email-address' },
    { key: 'mobile', label: 'Mobile Number', icon: Phone, placeholder: 'Enter mobile number', type: 'phone-pad' },
    { key: 'occupation', label: 'Occupation', icon: Briefcase, placeholder: 'What do you do?', type: 'default' },
  ];

  // Step 2 Fields (6)
  const step2Fields = [
    { key: 'address', label: 'Full Address', icon: MapPin, placeholder: 'House no, Street, Area', type: 'default' },
    { key: 'city', label: 'City', icon: MapPin, placeholder: 'Enter your city', type: 'default' },
    { key: 'state', label: 'State', icon: MapPin, placeholder: 'Enter your state', type: 'default' },
    { key: 'maritalStatus', label: 'Marital Status', icon: Users, placeholder: 'Single / Married / Divorced', type: 'default' },
  ];

  // Step 3 Fields (5)
  const step3Fields = [
    { key: 'spouseName', label: 'Spouse Full Name', icon: User, placeholder: 'Enter spouse name', type: 'default' },
    { key: 'spouseDob', label: 'Spouse Date of Birth', icon: Calendar, placeholder: 'DD/MM/YYYY', type: 'default' },
    { key: 'spouseEmail', label: 'Spouse Email', icon: Mail, placeholder: 'spouse@email.com', type: 'email-address' },
    { key: 'spouseMobile', label: 'Spouse Mobile', icon: Phone, placeholder: 'Enter mobile number', type: 'phone-pad' },
    { key: 'spouseOccupation', label: 'Spouse Occupation', icon: Briefcase, placeholder: 'Spouse occupation', type: 'default' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050510', '#0A0A1F']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.white} size={24} />
          </TouchableOpacity>

          {/* Header - Club Connect Title */}
          <View style={styles.header}>
            <Text style={styles.clubTitle}>Club Connect</Text>
            <Text style={styles.subtitle}>Step {currentStep} of 3 • Create Account</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={styles.progressBar}>
                <View style={[styles.progressDot, currentStep >= step && styles.progressDotActive]} />
                {step < 3 && <View style={[styles.progressLine, currentStep > step && styles.progressLineActive]} />}
              </View>
            ))}
          </View>

          {/* Form Content */}
          <View style={styles.form}>
            {/* Step 1 */}
            {currentStep === 1 && (
              <>
                <Text style={styles.stepTitle}>Personal Information</Text>
                {step1Fields.map(f => (
                  <View key={f.key} style={styles.fieldContainer}>
                    <Text style={styles.inputLabel}>{f.label}</Text>
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
              </>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <>
                <Text style={styles.stepTitle}>Address & Security</Text>
                {step2Fields.map(f => (
                  <View key={f.key} style={styles.fieldContainer}>
                    <Text style={styles.inputLabel}>{f.label}</Text>
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

                {/* Password Fields with Labels */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                    <Lock color={errors.password ? Colors.error : Colors.gray500} size={18} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Create strong password"
                      placeholderTextColor={Colors.gray500}
                      value={form.password}
                      onChangeText={v => update('password', v)}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff color={Colors.gray500} size={18} /> : <Eye color={Colors.gray500} size={18} />}
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputWrap, errors.confirmPassword && styles.inputError]}>
                    <Lock color={errors.confirmPassword ? Colors.error : Colors.gray500} size={18} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Confirm your password"
                      placeholderTextColor={Colors.gray500}
                      value={form.confirmPassword}
                      onChangeText={v => update('confirmPassword', v)}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff color={Colors.gray500} size={18} /> : <Eye color={Colors.gray500} size={18} />}
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}
                </View>
              </>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <>
                <Text style={styles.stepTitle}>Spouse Information (Optional)</Text>
                {step3Fields.map(f => (
                  <View key={f.key} style={styles.fieldContainer}>
                    <Text style={styles.inputLabel}>{f.label}</Text>
                    <View style={styles.inputWrap}>
                      <f.icon color={Colors.gray500} size={18} />
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
                  </View>
                ))}
              </>
            )}

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
                  <Text style={styles.prevButtonText}>Previous</Text>
                </TouchableOpacity>
              )}

              {currentStep < 3 ? (
                <GradientButton
                  label="Next Step"
                  onPress={handleNext}
                  size="lg"
                  style={{ flex: 1 }}
                />
              ) : (
                <GradientButton
                  label="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                  size="lg"
                />
              )}
            </View>
          </View>

          {/* Login Link */}
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
  backBtn: { padding: 16, paddingTop: 56 },

  header: { 
    alignItems: 'center', 
    paddingBottom: 20,
    paddingHorizontal: 24 
  },
  clubTitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 4,
  },
  subtitle: { 
    color: Colors.gray500, 
    fontSize: Typography.fontSizes.base 
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 25,
  },
  progressBar: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.gray500,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: {
    width: 60, height: 2, backgroundColor: Colors.gray500,
  },
  progressLineActive: { backgroundColor: Colors.primary },

  form: { paddingHorizontal: 24, gap: 16 },

  stepTitle: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    marginBottom: 12,
  },

  fieldContainer: {
    gap: 6,
  },
  inputLabel: {
    color: Colors.white,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    marginLeft: 4,
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
  inputError: { borderColor: Colors.error },
  input: { 
    color: Colors.white, 
    fontSize: Typography.fontSizes.base, 
    flex: 1 
  },

  fieldError: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xs,
    marginLeft: 4,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  prevButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.gray500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
  },

  loginRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 30,
    marginBottom: 20 
  },
  loginText: { color: Colors.gray500, fontSize: Typography.fontSizes.base },
  loginLink: { 
    color: Colors.primary, 
    fontWeight: Typography.fontWeights.semibold 
  },
});