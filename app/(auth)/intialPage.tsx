import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompany } from '@/constants/string';


const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Connect With App',
    subtitle: 'Aeps, Recharges and bbps services instantly.',
    icon: 'chatbubbles-outline',
  },
  {
    id: '2',
    title: 'Safe & Private',
    subtitle: 'Your conversations stay protected.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '3',
    title: 'Fast & Simple',
    subtitle: 'Smooth experience across all devices.',
    icon: 'flash-outline',
  },
];

const InitialPage = () => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const company = useCompany();

  const colors = colorScheme === 'light'
    ? {
        background: '#fff',
        headerBg: '#350083', // Primary color for header
        text: '#111827',
        headerText: '#fff', // White text for header
        subText: '#6B7280',
        primary: '#350083',
        cardBg: '#f8f9fa',
        borderColor: '#e5e7eb',
        statusBar: 'dark',
      }
    : {
        background: '#121212',
        headerBg: '#1d4152', // Primary color for header
        text: '#ffffff',
        headerText: '#dadada', // Dark text for header in dark mode
        subText: '#9ca3af',
        primary: '#1d4152',
        cardBg: '#1e1e1e',
        borderColor: '#374151',
        statusBar: 'light',
      };

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      {/* Logo */}
      <Image source={company.logo} style={styles.logo} />

      {/* Icon */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: colors.cardBg,
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={42}
          color={colors.primary}
        />
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
          },
        ]}
      >
        {item.title}
      </Text>

      {/* Subtitle */}
      <Text
        style={[
          styles.subtitle,
          {
            color: colors.subText,
          },
        ]}
      >
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <>
      
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Header Section with Primary Color */}
        <SafeAreaView style={[styles.header, { 
          backgroundColor: colors.headerBg,
        }]}>
          <View style={styles.headerLeft}>
            <Image source={company.logo} style={styles.headerLogo} />
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              {company.name}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleSkip} style={styles.skipHeaderButton}>
            <Text style={[styles.skipHeaderText, { color: colors.headerText }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(index);
          }}
        />

        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: currentIndex === index ? 24 : 8,
                  backgroundColor:
                    currentIndex === index
                      ? colors.primary
                      : colors.subText,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <SafeAreaView style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.primaryText}>
              {currentIndex === slides.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
            {currentIndex !== slides.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>

        </SafeAreaView>
      </View>
    </>
  );
};

export default InitialPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  skipHeaderButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 30,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 35,
  },
  dot: {
    height: 8,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginText: {
    textAlign: 'center',
    fontSize: 14,
  },
  loginLink: {
    fontWeight: '600',
  },
});