import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, Modal, FlatList } from 'react-native'
import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useSelector } from 'react-redux'
import HeaderSection from '@/components/navbar/header'

// Helper function to get date exactly 18 years ago
const getEighteenYearsAgoDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  date.setHours(0, 0, 0, 0)
  return date
}

// Helper function to format date as YYYY-MM-DD in LOCAL time (no timezone shift)
const formatDateLocal = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Zod validation schema with only required fields
const kycSchema = z.object({
  // Personal fields
  fatherName: z.string().min(1, "Father's name is required"),
  dob: z.date().refine((date) => {
    const eighteenYearsAgo = getEighteenYearsAgoDate()
    return date <= eighteenYearsAgo
  }, "You must be at least 18 years old"),
  
  // Address fields
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pinCode: z.string().min(1, "Pincode is required").regex(/^\d{6}$/, "Pincode must be 6 digits"),
  
  // Shop field
  shopName: z.string().min(1, "Shop name is required"),
  shopAddress: z.string().min(1, "Shop address is required"),
  
  // ID fields
  aadharNumber: z.string().min(1, "Aadhaar number is required").regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  panNumber: z.string().min(1, "PAN number is required"),
  
  // Document images
  aadharFront: z.string().min(1, "Aadhaar front image is required"),
  aadharBack: z.string().min(1, "Aadhaar back image is required"),
  panImage: z.string().min(1, "PAN card image is required"),
})

type KYCFormData = z.infer<typeof kycSchema>

// Define steps
const STEPS = [
  { id: 1, name: 'Personal', icon: 'person' },
  { id: 2, name: 'Address', icon: 'location' },
  { id: 3, name: 'Shop', icon: 'storefront' },
  { id: 4, name: 'Documents', icon: 'document' },
  { id: 5, name: 'Review', icon: 'checkmark-circle' },
]

const DoKYC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([])
  const [showStateModal, setShowStateModal] = useState(false)
  const [selectedState, setSelectedState] = useState<any>(null)
  const {getLocation} = useSelector((state: any) => state.services)
  const baseURL = Constants.expoConfig?.extra?.API_URL

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    mode: 'onChange',
    defaultValues: {
      fatherName: '',
      address: '',
      state: '',
      district: '',
      pinCode: '',
      aadharNumber: '',
      panNumber: '',
      shopName: '',
      shopAddress: '',
    },
  })

  const pickImage = async (fieldName: keyof KYCFormData) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      
      const fileInfo = await fetch(asset.uri)
      const blob = await fileInfo.blob()
      const fileSizeInMB = blob.size / (1024 * 1024)
      
      if (fileSizeInMB > 2) {
        Alert.alert('File Too Large', 'Image must be less than 2MB')
        return
      }
      
      const mimeType = asset.mimeType || 
        (asset.uri.endsWith('.png') ? 'image/png' : 
         asset.uri.endsWith('.jpg') || asset.uri.endsWith('.jpeg') ? 'image/jpeg' :
         asset.uri.endsWith('.gif') ? 'image/gif' : '')
      
      if (!mimeType.includes('jpeg') && !mimeType.includes('png') && !mimeType.includes('jpg') && !mimeType.includes('gif')) {
        Alert.alert('Invalid Format', 'Only JPEG, PNG, JPG, and GIF images are allowed')
        return
      }
      
      setValue(fieldName, asset.uri, { shouldValidate: true })
    }
  }

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false)
    if (selectedDate) {
      // Normalize to local midnight to avoid timezone issues
      const normalized = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      )
      setValue('dob', normalized, { shouldValidate: true })
    }
  }

  // Validate current step fields
  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof KYCFormData)[] = []
    
    switch (step) {
      case 1: // Personal
        fieldsToValidate = ['fatherName', 'dob', 'aadharNumber', 'panNumber']
        break
      case 2: // Address
        fieldsToValidate = ['address', 'state', 'district', 'pinCode']
        break
      case 3: // Shop
        fieldsToValidate = ['shopName', 'shopAddress']
        break
      case 4: // Documents
        fieldsToValidate = ['aadharFront', 'aadharBack', 'panImage']
        break
    }
    
    const result = await trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    } else {
      Alert.alert('Validation Error', 'Please fill all required fields correctly')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Helper function to get file info
  const getFileInfo = async (uri: string) => {
    const filename = uri.split('/').pop() || 'file'
    const match = /\.(\w+)$/.exec(filename)
    const ext = match?.[1] || 'jpg'
    let type = 'image/jpeg'
    
    if (ext === 'png') type = 'image/png'
    else if (ext === 'gif') type = 'image/gif'
    else type = 'image/jpeg'
    
    return {
      uri,
      name: filename,
      type,
    }
  }

  const onSubmit = async (datas: KYCFormData) => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      formData.append('fatherName', datas.fatherName)
      formData.append('aadharNumber', datas.aadharNumber)
      formData.append('panNumber', datas.panNumber)
      formData.append('address', datas.address)
      formData.append('state', selectedState.id.toString())
      formData.append('district', datas.district)
      formData.append('shopName', datas.shopName)
      formData.append('shopAddress', datas.shopAddress)
      formData.append('pinCode', datas.pinCode)
      formData.append('lat', getLocation?.latitude?.toString() || '')
      formData.append('log', getLocation?.longitude?.toString() || '')
      
      // ✅ FIXED: Use local date formatting instead of toISOString()
      // toISOString() converts to UTC which can shift the date by one day
      // for users in timezones ahead of UTC (e.g., IST = UTC+5:30)
      formData.append('dob', formatDateLocal(new Date(datas.dob)))
      
      if (datas.aadharFront) {
        const fileInfo = await getFileInfo(datas.aadharFront)
        formData.append('aadharFront', fileInfo as any)
      }
      
      if (datas.aadharBack) {
        const fileInfo = await getFileInfo(datas.aadharBack)
        formData.append('aadharBack', fileInfo as any)
      }
      
      if (datas.panImage) {
        const fileInfo = await getFileInfo(datas.panImage)
        formData.append('panImage', fileInfo as any)
      }
      
      const userdata = JSON.parse(await AsyncStorage.getItem("user") as any);
   
      const res = await fetch(`${baseURL}/api/submit-kyc`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          "headerKey": userdata.header_key,
          "headerToken": userdata.header_token,
        },
      })
      const data = await res.json()
      
      if (data.status === "SUCCESS") {
        Alert.alert(`${data.status}`, `${data.message}`);
        router.push('/screen/pendingKyc')
      } else {
        Alert.alert(`${data.status}`, `${data.message}`);
      }
    } catch {
      Alert.alert('Error', 'something went wrong while submitting KYC form')
    } finally {
      setLoading(false)
    }
  }

  const handleGetStates = async () => {
    try {
      const res = await fetch(`${baseURL}/api/getAllstate`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      const data = await res.json()
      setStates(data.data.state)
      setShowStateModal(true)
    } catch (error) {
      console.error('Error fetching states:', error)
      Alert.alert('Error', 'Failed to load states')
    }
  }

  const selectState = (state: any) => {
    setSelectedState(state)
    setValue('state', state.name, { shouldValidate: true })
    setShowStateModal(false)
  }

  const renderProgressBar = () => {
    const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100
    
    return (
      <View style={styles.progressContainer}>
        <HeaderSection title="profile Kyc" />
        <View style={styles.progressSteps}>
          {STEPS.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={styles.stepItem}
              onPress={() => setCurrentStep(step.id)}
            >
              <View style={[
                styles.stepCircle,
                currentStep >= step.id && styles.stepCircleActive,
                currentStep > step.id && styles.stepCircleCompleted
              ]}>
                {currentStep > step.id ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Ionicons 
                    name={step.icon as any} 
                    size={16} 
                    color={currentStep >= step.id ? 'white' : '#9CA3AF'} 
                  />
                )}
              </View>
              <Text style={[
                styles.stepText,
                currentStep >= step.id && styles.stepTextActive
              ]}>
                {step.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    )
  }

  const renderInput = (
    fieldName: keyof KYCFormData,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: any,
      multiline?: boolean,
      numberOfLines?: number,
      secureTextEntry?: boolean,
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters',
      maxLength?: number,
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={fieldName}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              errors[fieldName] && styles.inputError,
              options?.multiline && styles.multilineInput
            ]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value as string}
            {...options}
          />
        )}
      />
      {errors[fieldName] && (
        <Text style={styles.errorText}>{errors[fieldName]?.message as string}</Text>
      )}
    </View>
  )

  const renderStatePicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>State</Text>
      <TouchableOpacity
        onPress={handleGetStates}
        style={[
          styles.input,
          styles.pickerButton,
          errors.state && styles.inputError
        ]}
      >
        <Text style={watch('state') ? styles.selectedText : styles.placeholderText}>
          {watch('state') || 'Select State'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      {errors.state && (
        <Text style={styles.errorText}>{errors.state.message}</Text>
      )}

      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={states}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stateItem}
                  onPress={() => selectState(item)}
                >
                  <Text style={styles.stateName}>{item.name}</Text>
                  {selectedState?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  )

  const renderImagePicker = (fieldName: keyof KYCFormData, label: string) => {
    const imageUri = watch(fieldName) as string

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          onPress={() => pickImage(fieldName)}
          style={[
            styles.imagePicker,
            errors[fieldName] && styles.imagePickerError
          ]}
        >
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <Text style={styles.changeImageText}>Change Image</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
              <Text style={styles.imageFormatText}>JPEG, PNG, JPG or GIF only (Max 2MB)</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors[fieldName] && (
          <Text style={styles.errorText}>{errors[fieldName]?.message as string}</Text>
        )}
      </View>
    )
  }

  const renderStep1 = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      {renderInput('fatherName', "Father's Name", "Enter father's name")}
      
      {/* Date of Birth */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        <Controller
          control={control}
          name="dob"
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.datePicker,
                errors.dob && styles.inputError
              ]}
            >
              <Text style={value ? styles.dateText : styles.datePlaceholder}>
                {value ? value.toLocaleDateString() : 'Select date of birth'}
              </Text>
              <Ionicons name="calendar" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
        {errors.dob && (
          <Text style={styles.errorText}>{errors.dob.message}</Text>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={watch('dob') || getEighteenYearsAgoDate()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={getEighteenYearsAgoDate()}
          />
        )}
      </View>

      {renderInput('aadharNumber', 'Aadhaar Number', 'Enter 12 digit Aadhaar number', { 
        keyboardType: 'numeric', 
        maxLength: 12 
      })}
      {renderInput('panNumber', 'PAN Number', 'Enter PAN number' ,{
        autoCapitalize: 'characters',
        maxLength: 10,
      })}
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Address Information</Text>
      
      {renderInput('address', 'Address', 'Enter your address', { 
        multiline: true, 
        numberOfLines: 3 
      })}
      
      {renderStatePicker()}
      
      {renderInput('district', 'District', 'Enter district')}
      {renderInput('pinCode', 'Pincode', 'Enter 6 digit pincode', { 
        keyboardType: 'numeric', 
        maxLength: 6 
      })}
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shop Information</Text>
      
      {renderInput('shopName', 'Shop Name', 'Enter shop name')}
      {renderInput('shopAddress', 'Shop Address', 'Enter shop address', { 
        multiline: true, 
        numberOfLines: 3 
      })}
    </View>
  )

  const renderStep4 = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Document Uploads</Text>
      
      {renderImagePicker('aadharFront', 'Aadhaar Card (Front)')}
      {renderImagePicker('aadharBack', 'Aadhaar Card (Back)')}
      {renderImagePicker('panImage', 'PAN Card')}
    </View>
  )

  const renderStep5 = () => {
    const formData = watch()
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Your Information</Text>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Personal Information</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Fathers Name:</Text>
            <Text style={styles.reviewValue}>{formData.fatherName || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Date of Birth:</Text>
            <Text style={styles.reviewValue}>
              {formData.dob ? formData.dob.toLocaleDateString() : 'Not provided'}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Aadhaar:</Text>
            <Text style={styles.reviewValue}>{formData.aadharNumber || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>PAN:</Text>
            <Text style={styles.reviewValue}>{formData.panNumber || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Address</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Address:</Text>
            <Text style={styles.reviewValue}>{formData.address || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>State:</Text>
            <Text style={styles.reviewValue}>{formData.state || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>District:</Text>
            <Text style={styles.reviewValue}>{formData.district || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Pincode:</Text>
            <Text style={styles.reviewValue}>{formData.pinCode || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Shop Details</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Shop Name:</Text>
            <Text style={styles.reviewValue}>{formData.shopName || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Shop Address:</Text>
            <Text style={styles.reviewValue}>{formData.shopAddress || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Documents Uploaded</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Aadhaar Front:</Text>
            <Text style={styles.reviewValue}>{formData.aadharFront ? '✓ Uploaded' : 'Not uploaded'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Aadhaar Back:</Text>
            <Text style={styles.reviewValue}>{formData.aadharBack ? '✓ Uploaded' : 'Not uploaded'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>PAN Card:</Text>
            <Text style={styles.reviewValue}>{formData.panImage ? '✓ Uploaded' : 'Not uploaded'}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.navButton, styles.backButton]}
            >
              <Ionicons name="chevron-back" size={20} color="#4B5563" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < STEPS.length ? (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.nextButton, currentStep === 1 && styles.fullWidthButton]}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={[styles.navButton, styles.submitButton, styles.fullWidthButton]}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submit KYC</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  progressContainer: {
    backgroundColor: 'white',
    // paddingTop: 16,
    // paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop:12
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: '#2563EB',
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#1F2937',
    fontSize: 16,
  },
  datePlaceholder: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    color: '#1F2937',
    fontSize: 16,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePickerError: {
    borderColor: '#EF4444',
  },
  imageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#3B82F6',
    marginTop: 8,
    fontSize: 14,
  },
  imagePlaceholder: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 14,
  },
  imageFormatText: {
    color: '#9CA3AF',
    marginTop: 4,
    fontSize: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  backButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  nextButton: {
    backgroundColor: '#2563EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  fullWidthButton: {
    flex: 1,
  },
  backButtonText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewLabel: {
    width: 120,
    fontSize: 14,
    color: '#6B7280',
  },
  reviewValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 120,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stateName: {
    fontSize: 16,
    color: '#1F2937',
  },
})

export default DoKYC