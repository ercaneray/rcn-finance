import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Formik } from 'formik';
import { FC, PropsWithChildren } from 'react';
import {
    Dimensions,
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
import { LoginScreenProps } from './types';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Geçersiz e-posta').required('E-posta gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
});

const { width, height } = Dimensions.get('window');

const LoginScreen: FC<PropsWithChildren<LoginScreenProps>> = ({
  onLogin,
  onRegister,
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
                colors={['#6366f1', '#8b5cf6', '#d946ef']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="analytics" size={40} color="white" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>RCN Finance</Text>
            <Text style={styles.subtitle}>
              Akıllı fiş tarama ve grup harcama yönetimi
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formWrapper}>
            <View style={styles.glassCard}>
              <Formik
                initialValues={{ email: 'eray@gmail.com', password: '123456' }}
                validationSchema={LoginSchema}
                onSubmit={(values) => {
                  if (onLogin) {
                    onLogin(values.email, values.password);
                  }
                }}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <>
                    <Text style={styles.formTitle}>Giriş Yap</Text>
                    
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
                          placeholder="Şifreniz"
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

                    {/* Forgot Password */}
                    <TouchableOpacity 
                      style={styles.forgotPassword}
                      onPress={() => console.log('Forgot password')}
                    >
                      <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity 
                      style={styles.loginButtonWrapper}
                      onPress={() => handleSubmit()}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        style={styles.loginButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="log-in-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.loginButtonText}>Giriş Yap</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>VEYA</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Register Link */}
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={onRegister}
                      activeOpacity={0.8}
                    >
                      <View style={styles.registerButtonContent}>
                        <Ionicons name="person-add-outline" size={20} color="#6366f1" style={{ marginRight: 8 }} />
                        <Text style={styles.registerButtonText}>Yeni Hesap Oluştur</Text>
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
              Güvenli ve akıllı harcama takibi
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen; 