import { Formik } from 'formik';
import { FC, PropsWithChildren } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';
import { styles } from './styles';
import { LoginScreenProps } from './types';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Geçersiz e-posta').required('E-posta gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
});

const LoginScreen: FC<PropsWithChildren<LoginScreenProps>> = ({
  onLogin,
  onRegister,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Finans Takip</Text>
        <Text style={styles.subtitle}>Harcamalarınızı kolayca takip edin</Text>
      </View>

      <Formik
        initialValues={{ email: 'erayercan1533@gmail.com', password: '123456' }}
        validationSchema={LoginSchema}
        onSubmit={(values) => {
          if (onLogin) {
            onLogin(values.email, values.password);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="E-posta adresiniz"
                placeholderTextColor="#666"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && touched.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor="#666"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry
              />
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => console.log('Forgot password')}
            >
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => handleSubmit()}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Hesabınız yok mu? </Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default LoginScreen; 