// App.tsx
import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  useColorScheme 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import HeaderSection from '@/components/navbar/header';

// Form validation schema using Zod
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  mobileNumber: z.string()
    .regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  email: z.string().email('Invalid email address'),
  shopAddress: z.string().min(5, 'Shop address must be at least 5 characters').max(200, 'Address is too long'),
  permanentAddress: z.string().min(5, 'Permanent address must be at least 5 characters').max(200, 'Address is too long'),
  pincode: z.string()
    .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  panNumber: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format (e.g., ABCDE1234F)'),
  aadharNumber: z.string()
    .regex(/^[0-9]{12}$/, 'Aadhar number must be 12 digits'),
});

type FormData = z.infer<typeof formSchema>;

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark'

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#2a0888",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#2f4f58" : "#ccc",
    button: isDark ? "#0b4a5a" : "#350083",
    placeholder: "#9ca3af",
    operatorItem: isDark ? "#1a3a45" : "#f0f0f0",
    planCard: isDark ? "#1a3a45" : "#f8f9fa",
    planBorder: isDark ? "#2f4f58" : "#e0e0e0",
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      mobileNumber: '',
      email: '',
      shopAddress: '',
      permanentAddress: '',
      pincode: '',
      state: '',
      panNumber: '',
      aadharNumber: '',
    },
  });

  const onSubmit = (data: FormData) => {
    Alert.alert(
      'warnig',
      `UTI service unavilable at this movement.`,
      [{ text: 'OK', onPress: () => reset() }]
    );
    console.log('Form Data:', data);
  };



  const renderInput = (
    name: keyof FormData,
    label: string,
    placeholder: string,
    icon: string,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
    maxLength?: number
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon as any} size={20} color={colors.header} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors[name] ? 'red' : colors.border,
                color: colors.text,
                backgroundColor: colors.card,
              },
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCapitalize={name === 'panNumber' ? 'characters' : 'none'}
          />
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name]?.message}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
       <HeaderSection title="PSA Registration" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          {renderInput('name', 'Full Name', 'Enter your full name', 'person-outline')}
          {renderInput('mobileNumber', 'Mobile Number', 'Enter 10-digit mobile number', 'call-outline', 'phone-pad', 10)}
          {renderInput('email', 'Email', 'Enter your email address', 'mail-outline', 'email-address')}
          {renderInput('shopAddress', 'Shop Address', 'Enter shop address', 'business-outline')}
          {renderInput('permanentAddress', 'Permanent Address', 'Enter permanent address', 'home-outline')}
          {renderInput('pincode', 'Pincode', 'Enter 6-digit pincode', 'location-outline', 'numeric', 6)}
          {renderInput('state', 'State', 'Enter state name', 'map-outline')}
          {renderInput('panNumber', 'PAN Number', 'Enter PAN (e.g., ABCDE1234F)', 'card-outline', 'default', 10)}
          {renderInput('aadharNumber', 'Aadhar Card Number', 'Enter 12-digit Aadhar number', 'id-card-outline', 'numeric', 12)}

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.button }]}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>SUBMIT</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap:40,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop:10,
    paddingVertical: -15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  backBotton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom:180
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});