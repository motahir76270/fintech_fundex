import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/auth/authSlice';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profileData: any;
  colors: any;
  onSave: (updatedData: any) => void;
}

// Define Zod validation schema
const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  mobile: z.string().min(1, 'Mobile number is required')
    .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  profileData,
  colors,
  onSave,
}) => {
  const baseURL = Constants.expoConfig?.extra?.API_URL;
  
  // Extract data from props - only profile data
  const profile = profileData?.data?.profile ;
   
  // Form state - profile fields using React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name || '',
      email: profile.email || '',
      mobile: profile.mobile || '',
    },
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  // Reset form when profileData changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        mobile: profile.mobile || '',
      });
    }
  }, [profile, reset]);

  // Request permission for image picker
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change profile picture.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const logindata = await AsyncStorage.getItem('user');
      if (!logindata) {
        Alert.alert('Error', 'Authentication data not found');
        return;
      }
      
      const keyData = JSON.parse(logindata);
      
      // Create FormData for multipart request
      const formDataToSend = new FormData();
      
      // Add profile fields
      formDataToSend.append('name', data.name);
      formDataToSend.append('email', data.email);
      formDataToSend.append('mobile', data.mobile);
      
      // Add image if selected
      if (imageFile?.uri) {
        const filename = imageFile.uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;

        formDataToSend.append('profile', {
          uri: imageFile.uri,
          name: filename,
          type: fileType,
        } as any);
      }     
      
      const response = await fetch(`${baseURL}/api/update-profile`, {
        method: "POST",
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        },
      });
      
      const responseData = await response.json();
      
      if (responseData?.status === "SUCCESS") {
        Alert.alert("Success", responseData?.message || "Profile updated successfully");
        dispatch(setUser(responseData))
        onSave(responseData);
        handleClose();
      } else {
        Alert.alert("Error", responseData?.message || "Failed to update profile");
      }

    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileImage(null);
    setImageFile(null);
    reset();
    onClose();
  };

  const renderInput = (
    fieldName: keyof ProfileFormData,
    label: string,
    icon: string,
    keyboardType: any = 'default',
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters' = 'none'
  ) => (
    <View style={[styles.inputContainer, { 
      borderColor: errors[fieldName] ? '#ef4444' : colors.border,
      backgroundColor: colors.card 
    }]}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon as any} size={18} color={colors.accent} />
        <Text style={[styles.inputLabel, { color: colors.subText }]}>{label}</Text>
      </View>
      <Controller
        control={control}
        name={fieldName}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.card },
            ]}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.subText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={!loading}
          />
        )}
      />
      {errors[fieldName] && (
        <Text style={styles.errorText}>{errors[fieldName]?.message}</Text>
      )}
    </View>
  );

  // Get current profile image URL
  const getCurrentProfileImage = () => {
    if (profileImage) {
      return { uri: profileImage };
    }
    if (profile.profile) {
      // Handle both full URL and relative path
      const imageUrl = profile.profile.startsWith('http') 
        ? profile.profile 
        : `${baseURL}/${profile.profile.replace(/^\//, '')}`;
      return { uri: imageUrl };
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            >
              <Text style={[styles.saveButtonText, { color: colors.button }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Image Section */}
            <View style={[styles.imageSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="camera-outline" size={18} color={colors.accent} />
                {'  '}Profile Picture
              </Text>
              
              <View style={styles.avatarContainer}>
                <View style={[styles.avatarBorder, { borderColor: colors.accent }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.avatarBg || colors.button }]}>
                    {getCurrentProfileImage() ? (
                      <Image 
                        source={getCurrentProfileImage() as any} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <Ionicons name="person" size={40} color="#fff" />
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.cameraButton, { backgroundColor: colors.button }]}
                  onPress={pickImage}
                  disabled={loading}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.changePhotoButton, { borderColor: colors.button }]}
                onPress={pickImage}
                disabled={loading}
              >
                <Text style={[styles.changePhotoText, { color: colors.button }]}>
                  Change Profile Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Information Section */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="person-outline" size={18} color={colors.accent} />
                {'  '}Profile Information
              </Text>
              
              {renderInput('name', 'Full Name', 'person-outline', 'default', 'words')}
              {renderInput('email', 'Email Address', 'mail-outline', 'email-address')}
              {renderInput('mobile', 'Mobile Number', 'phone-portrait-outline', 'phone-pad')}
            </View>

            {/* Note about other information */}
            <View style={[styles.noteContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.noteText, { color: colors.subText }]}>
                To update KYC details like name, address, Aadhar or PAN, please contact support or visit your nearest branch.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: Platform.OS === 'ios' ? 80 : 80,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  inputContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  changePhotoButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

export default ProfileEditModal;