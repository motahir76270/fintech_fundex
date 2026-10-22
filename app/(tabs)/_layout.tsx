import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, View, StyleSheet, Platform, StatusBar, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const insets = useSafeAreaInsets()
  const colorSceme = useColorScheme()

  // Calculate safe area bottom inset
  const getBottomInset = () => {
    if (Platform.OS === 'ios') {
      // For iOS with home indicator (notch devices)
      return insets.bottom > 0 ? insets.bottom : 0;
    } else if (Platform.OS === 'android') {
      // For Android, use status bar height for top inset
      return StatusBar.currentHeight ? 10 : 5;
    }
    return 0;
  };

  const bottomInset = getBottomInset();


  const getIconSize = () => {
    if (screenHeight < 700) return 26;
    if (screenHeight < 800) return 28;
    if (screenHeight < 900) return 30;
    return 32;
  };

  const getFontSize = () => {
    if (screenHeight < 700) return 10;
    if (screenHeight < 800) return 11;
    return 12;
  };

  const tabBarBottomPadding = Platform.select({
    ios: insets.bottom,
    android: insets.bottom, // Android handles this differently or you can use insets.bottom for Android too
    default: insets.bottom,
  });

  const iconSize = getIconSize();
  const fontSize = getFontSize();


  // Calculate tab width for even distribution
  const tabWidth = screenWidth / 4;

  return (

    <Tabs
    initialRouteName='index'
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#8a9ca3',
        tabBarStyle: {
          height: 75 + tabBarBottomPadding ,
          borderTopWidth: 0,
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 2,
          shadowOpacity: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {/* Gradient background */}
            <LinearGradient
              colors={colorSceme === 'light'?['#350083' , '#350083']: ['#022733', '#133333', '#022733', '#133333'] }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
            />
            {/* Blur effect for iOS */}
            {Platform.OS === 'ios' && (
              <BlurView
                intensity={20}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )}
            {/* Top border glow */}
            <LinearGradient
              colors={['rgba(44, 86, 100, 0.3)', 'transparent']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        ),
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize,
          fontWeight: '600',
          marginBottom: Platform.select({
            ios: bottomInset > 0 ? 0 : 4,
            android: 2,
          }),
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
          width: tabWidth,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      {/* Tab screens with enhanced styling */}
      {['index', 'Reports', 'wallet', 'support'].map((name) => {
        const getIcon = (color: string, focused: boolean) => {
          const iconProps = { color, size: iconSize };
          
          switch (name) {
            case 'index':
              return (
                <View style={[styles.iconWrapper, { width: tabWidth }]}>
                  <IconSymbol name="house.fill" {...iconProps} size={33} />
                </View>
              );
            case 'Reports':
              return (
                <View style={[styles.iconWrapper, { width: tabWidth }]}>
                  <Ionicons name="receipt" {...iconProps} size={30} />
                </View>
              );
            case 'wallet':
              return (
                <View style={[styles.iconWrapper, { width: tabWidth }]}>
                  <Entypo name="wallet" {...iconProps} size={30} />
                </View>
              );
            case 'support':
              return (
                <View style={[styles.iconWrapper, { width: tabWidth }]}>
                  <MaterialIcons name="contact-support" {...iconProps} size={30} />
                </View>
              );
            default:
              return null;
          }
        };

        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: name === 'index' ? 'Home' : name.charAt(0).toUpperCase() + name.slice(1),
              tabBarIcon: ({ color, focused }) => getIcon(color, focused),
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
  },
  activePill: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    opacity: 0.9,
  },
  scannerBtn:{
    alignItems:'center'
  }
});