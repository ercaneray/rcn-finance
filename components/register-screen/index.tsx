import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Formik } from 'formik';
import { FC, PropsWithChildren } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as Yup from 'yup';
import { styles } from './styles';
import { RegisterScreenProps } from './types';

const RegisterSchema = Yup.object().shape({
  displayName: Yup.string().required('İsim gerekli'),
  email: Yup.string().email('Geçersiz e-posta').required('E-posta gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre onayı gerekli'),
});

const RegisterScreen: FC<PropsWithChildren<RegisterScreenProps>> = ({
  onRegister,
  onBackToLogin,
}) => {
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d1b69']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated background shapes */}
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#10b981', '#059669', '#047857']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person-add" size={40} color="white" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              RCN Finance'e katılın ve akıllı harcama takibini başlatın
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formWrapper}>
            <View style={styles.glassCard}>
              <Formik
                initialValues={{ displayName: '', email: '', password: '', confirmPassword: '' }}
                validationSchema={RegisterSchema}
                onSubmit={(values) => {
                  if (onRegister) {
                    onRegister(values.email, values.password, values.displayName);
                  }
                }}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <>
                    <Text style={styles.formTitle}>Kayıt Ol</Text>
                    
                    {/* Name Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons 
                          name="person-outline" 
                          size={20} 
                          color="rgba(255, 255, 255, 0.7)" 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Adınız ve soyadınız"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          onChangeText={handleChange('displayName')}
                          onBlur={handleBlur('displayName')}
                          value={values.displayName}
                          autoCapitalize="words"
                        />
                      </View>
                      {errors.displayName && touched.displayName && (
                        <Text style={styles.errorText}>{errors.displayName}</Text>
                      )}
                    </View>
                    
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons 
                          name="mail-outline" 
                          size={20} 
                          color="rgba(255, 255, 255, 0.7)" 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="E-posta adresiniz"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          value={values.email}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {errors.email && touched.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons 
                          name="lock-closed-outline" 
                          size={20} 
                          color="rgba(255, 255, 255, 0.7)" 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Şifreniz (en az 6 karakter)"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          onChangeText={handleChange('password')}
                          onBlur={handleBlur('password')}
                          value={values.password}
                          secureTextEntry
                        />
                      </View>
                      {errors.password && touched.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons 
                          name="shield-checkmark-outline" 
                          size={20} 
                          color="rgba(255, 255, 255, 0.7)" 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Şifrenizi tekrar girin"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          onChangeText={handleChange('confirmPassword')}
                          onBlur={handleBlur('confirmPassword')}
                          value={values.confirmPassword}
                          secureTextEntry
                        />
                      </View>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity 
                      style={styles.registerButtonWrapper}
                      onPress={() => handleSubmit()}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.registerButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>VEYA</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Login Link */}
                    <TouchableOpacity 
                      style={styles.loginButton}
                      onPress={onBackToLogin}
                      activeOpacity={0.8}
                    >
                      <View style={styles.loginButtonContent}>
                        <Ionicons name="log-in-outline" size={20} color="#6366f1" style={{ marginRight: 8 }} />
                        <Text style={styles.loginButtonText}>Zaten hesabım var, giriş yap</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Hesap oluşturarak kullanım şartlarını kabul etmiş olursunuz
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen; 