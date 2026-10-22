// screens/BankingServicesCard.tsx
import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme,
  Image,
  Dimensions,
  FlatList 
} from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";


// Responsive sizing utilities
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;
const isLargeTablet = SCREEN_WIDTH >= 1024;


// Calculate grid items based on screen size
const getNumColumns = () => {
  if (isLargeTablet) return 6;
  if (isTablet) return 5;
  return 4;
};

const getItemWidth = () => {
  const numColumns = getNumColumns();
  const totalPadding = 48;
  const totalGap = (numColumns - 1) * 16;
  return (SCREEN_WIDTH - totalPadding - totalGap) / numColumns;
};

// Professional color palette matching RechargeCard
const COLORS = {
  light: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    primary: '#818CF8',
    secondary: '#A78BFA',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
  }
};

// Comprehensive icon mapping with gradient colors
const iconLibrary = {
  // MaterialCommunityIcons
  cash: (color: string, size: number) => <MaterialCommunityIcons name="cash" size={size} color={color} />,
  "cellphone-text": (color: string, size: number) => <MaterialCommunityIcons name="cellphone-text" size={size} color={color} />,
  "receipt-text": (color: string, size: number) => <MaterialCommunityIcons name="receipt-text" size={size} color={color} />,
  "bank": (color: string, size: number) => <MaterialCommunityIcons name="bank" size={size} color={color} />,
  "account": (color: string, size: number) => <MaterialCommunityIcons name="account" size={size} color={color} />,
  "credit-card": (color: string, size: number) => <MaterialCommunityIcons name="credit-card" size={size} color={color} />,
  "qrcode": (color: string, size: number) => <MaterialCommunityIcons name="qrcode" size={size} color={color} />,
  
  // Ionicons
  "cash-outline": (color: string, size: number) => <Ionicons name="cash-outline" size={size} color={color} />,
  "card-outline": (color: string, size: number) => <Ionicons name="card-outline" size={size} color={color} />,
  "wallet-outline": (color: string, size: number) => <Ionicons name="wallet-outline" size={size} color={color} />,
  "swap-horizontal": (color: string, size: number) => <Ionicons name="swap-horizontal" size={size} color={color} />,
  
  // FontAwesome5
  "money-bill": (color: string, size: number) => <FontAwesome5 name="money-bill" size={size * 0.9} color={color} />,
  "hand-holding-usd": (color: string, size: number) => <FontAwesome5 name="hand-holding-usd" size={size * 0.9} color={color} />,
  "aeps": (color: string, size: number) => <Ionicons name="finger-print-outline" size={24} color={color} />,
  
  // Feather
  "dollar-sign": (color: string, size: number) => <Feather name="dollar-sign" size={size} color={color} />,
};

// Service gradients matching RechargeCard style
const serviceGradients: Record<string, string[]> = {
  cw: ['#4158D0', '#C850C0'], // Purple gradient
  be: ['#FF8008', '#FFC837'], // Orange gradient
  ms: ['#00B4DB', '#0083B0'], // Blue gradient
  aeps: ['#8E2DE2', '#4A00E0'], // Deep purple gradient
  matm: ['#F00000', '#DC281E'], // Red gradient
  default: ['#6366F1', '#8B5CF6'], // Default indigo-purple
};

const customService = {
  name: "AEPS",
  type: "aeps", // or "custom" if you want a new type
  icon: "https://fundexpay.com/assets/dist/images/new-folder/custom.png", // can also be local require
  route: "/screen/bankService/aepsService", // optional route
};

// Dynamic route mapping
const routeMap: Record<string, string> = {
  cw: "/screen/bankService/cashWithdraw",
  be: "/screen/bankService/balanceEnquery",
  ms: "/screen/bankService/statement",
  aeps: "/screen/bankService/aepsService",
  matm: "/screen/bankService/matm",
};

export default function BankingServicesCard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const theme = isDark ? COLORS.dark : COLORS.light;
  const { AllServices } = useSelector((state: any) => state.services);
  
  const aepsServices = AllServices?.aeps || [];

  const {getAepsData} = useSelector((state: any) => state.aeps);  
  


  // Responsive values
  const numColumns = getNumColumns();
  const itemWidth = getItemWidth();
  const iconSize = isSmallDevice ? 18 : isTablet ? 26 : 22;
  const headerIconSize = isSmallDevice ? 16 : isTablet ? 24 : 20;
  const containerMargin = isSmallDevice ? 12 : isTablet ? 24 : 10;
  const headerPadding = isSmallDevice ? 16 : isTablet ? 28 : 20;
  const allServicesIcon = [...aepsServices, customService];
 
  const handleServicePress = (service: any) => {
    const route = routeMap[service.type as keyof typeof routeMap ];
    if(getAepsData?.tfa === true && getAepsData?.aepsStatus ===  "YES"){
      if (route) {
        router.push(route as any);
        return;
      }
      
      if (service.route) {
        router.push(service.route);
        return; 
      }  

    }else if( getAepsData?.aepsStatus ===  "DUEEKYC" ){
       return  router.push('/screen/aepsKyc/varifyFinger');
      // return router.push('/screen/aepsKyc/doAepsKyc')
    }else if(getAepsData?.aepsStatus ===  "YES" ){
       return  router.push('/screen/aepsKyc/twoFactorAuthontication');
    } else{
        return  router.push('/screen/aepsKyc/doAepsKyc');
    } 

      // if (route) {
      //   router.push(route as any);
      //   return;
      // }
      
      // if (service.route) {
      //   router.push(service.route);
      //   return; 
      // } 

  }  
  
  const renderIcon = (service: any) => {
  
    
    const gradient = serviceGradients[service.type as keyof typeof serviceGradients] || serviceGradients.default;
    
    // If service has a custom icon name, use it with gradient background
    if (service.type && iconLibrary[service.type as keyof typeof iconLibrary]) {
      
      return (
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.iconGradient,
            {
              width: itemWidth - (isSmallDevice ? 8 : 16),
              height: itemWidth - (isSmallDevice ? 8 : 16),
              borderRadius: isSmallDevice ? 14 : isTablet ? 24 : 18,
            }
          ]}
        >
          <View style={styles.iconInner}>
            {iconLibrary[service.type as keyof typeof iconLibrary]("#FFFFFF", iconSize)}
          </View>
        </LinearGradient>
      );
    }
    
    // If service has a valid image URL
    if (service.icon && !service.icon.includes('aeps.png') && !service.icon.includes('default')) {
      return (
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.iconGradient,
            {
              width: itemWidth - (isSmallDevice ? 8 : 16),
              height: itemWidth - (isSmallDevice ? 8 : 16),
              borderRadius: isSmallDevice ? 14 : isTablet ? 24 : 18,
            }
          ]}
        >
          <View style={styles.iconInner}>
            <Image 
              source={{ uri: service.icon }} 
              style={[styles.serviceIcon, { width: iconSize, height: iconSize }]}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      );
    }
    
    // Map service type to icon with gradient
    let iconElement;
    switch(service.type) {
      case 'cw':
        iconElement = iconLibrary.cash("#FFFFFF", iconSize);
        break;
      case 'be':
        iconElement = iconLibrary["cellphone-text"]("#FFFFFF", iconSize);
        break;
      case 'ms':
        iconElement = iconLibrary["receipt-text"]("#FFFFFF", iconSize);
        break;
      case 'aeps':
        iconElement = iconLibrary.bank("#FFFFFF", iconSize);
        break;
      case 'matm':
        iconElement = iconLibrary["card-outline"]("#FFFFFF", iconSize);
        break;
      default:
        iconElement = iconLibrary.bank("#FFFFFF", iconSize);
    }

    return (
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconGradient,
          {
            width: itemWidth - (isSmallDevice ? 8 : 16),
            height: itemWidth - (isSmallDevice ? 8 : 16),
            borderRadius: isSmallDevice ? 14 : isTablet ? 24 : 18,
          }
        ]}
      >
        <View style={styles.iconInner}>
          {iconElement}
        </View>
      </LinearGradient>
    );
  };

  const renderServiceItem = ({ item }: { item: any }) => {
    return (

      <TouchableOpacity
        style={[styles.serviceItem, { width: itemWidth }]}
        onPress={() => handleServicePress(item)}
        activeOpacity={0.8}
      >
        {renderIcon(item)}
        <Text 
          style={[
            styles.serviceText, 
            { 
              color: theme.text,
              fontSize: isSmallDevice ? 10 : isTablet ? 14 : 11,
            }
          ]} 
          numberOfLines={isSmallDevice ? 1 : 2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        margin: containerMargin,
      }
    ]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.header,
          { 
            padding: headerPadding,
            paddingBottom: isTablet ? 24 : 16,
          }
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.headerIcon,
              { 
                width: isTablet ? 56 : 44,
                height: isTablet ? 56 : 44,
                borderRadius: isTablet ? 16 : 14,
              }
            ]}>
              <Ionicons name="business-outline" size={headerIconSize} color="#FFF" />
            </View>
            <View>
              <Text style={[
                styles.headerTitle,
                { fontSize: isTablet ? 24 : isSmallDevice ? 16 : 18 }
              ]}>
                Banking Services
              </Text>
              <Text style={[
                styles.headerSubtitle,
                { fontSize: isTablet ? 16 : isSmallDevice ? 11 : 13 }
              ]}>
                Financial solutions at your fingertips
              </Text>
            </View>
          </View>
 
        </View>

        {/* Quick Stats - Fixed the syntax error here */}
        {!isSmallDevice && (
          <View style={[
            styles.statsContainer,
            { 
              padding: isTablet ? 16 : 12,
              marginTop: isTablet ? 16 : 4,
            }
          ]}>
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { fontSize: isTablet ? 18 : 14 }
              ]}>Best</Text>
              <Text style={[
                styles.statLabel,
                { fontSize: isTablet ? 14 : 11 }
              ]}> Commision </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { fontSize: isTablet ? 18 : 14 }
              ]}>Instant</Text>
              <Text style={[
                styles.statLabel,
                { fontSize: isTablet ? 14 : 11 }
              ]}>Settlement</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { fontSize: isTablet ? 18 : 14 }
              ]}>100%</Text>
              <Text style={[
                styles.statLabel,
                { fontSize: isTablet ? 14 : 11 }
              ]}>Secure</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Services Grid */}
      <View style={[
        styles.servicesContainer, 
        { 
          backgroundColor: theme.card,
          padding: isTablet ? 28 : 20,
          paddingBottom: isTablet ? 24 : 16,
        }
      ]}>
        <View style={styles.sectionHeader}>
          <Text style={[
            styles.sectionTitle, 
            { 
              color: theme.text,
              fontSize: isTablet ? 20 : isSmallDevice ? 14 : 16,
            }
          ]}>
            Banking Services
          </Text>
          <Text style={[
            styles.serviceCount, 
            { 
              color: theme.textSecondary,
              fontSize: isTablet ? 16 : isSmallDevice ? 11 : 13,
            }
          ]}>
            {aepsServices.length + 1} available
          </Text>
        </View>

        {aepsServices.length > 0 ? (
          <FlatList
            data={allServicesIcon}
            renderItem={renderServiceItem}
            keyExtractor={(_, index) => index.toString()}
            numColumns={numColumns}
            scrollEnabled={false}
            columnWrapperStyle={[
              styles.servicesGrid,
              { gap: isTablet ? 6 : 6 }
            ]}
            contentContainerStyle={styles.servicesList}
            key={numColumns}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={[
              styles.emptyIconBg, 
              { 
                backgroundColor: theme.border,
                width: isTablet ? 120 : 80,
                height: isTablet ? 120 : 80,
                borderRadius: isTablet ? 60 : 40,
              }
            ]}>
              <Ionicons name="business-outline" size={isTablet ? 60 : 40} color={theme.textSecondary} />
            </View>
            <Text style={[
              styles.emptyTitle, 
              { 
                color: theme.text,
                fontSize: isTablet ? 20 : 16,
              }
            ]}>
              No Banking Services Available
            </Text>
            <Text style={[
              styles.emptyDesc, 
              { 
                color: theme.textSecondary,
                fontSize: isTablet ? 16 : 13,
              }
            ]}>
              Services will appear here once added
            </Text>
          </View>
        )}
      </View>

      {/* Promo Banner */}
      {!isSmallDevice && (
        <LinearGradient
          colors={['#4158D0', '#C850C0', '#FFCC70']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.promoBanner,
            { 
              margin: isTablet ? 28 : 20,
              marginTop: 0,
              padding: isTablet ? 20 : 16,
              borderRadius: isTablet ? 24 : 20,
            }
          ]}
        >
          <View style={styles.promoContent}>
            <View>
              <Text style={[
                styles.promoTitle,
                { fontSize: isTablet ? 20 : 17 }
              ]}>One App Multiple Banking Solutions</Text>
              <Text style={[
                styles.promoDesc,
                { fontSize: isTablet ? 16 : 12 }
              ]}>one Smart Platform For All Banking & Digital Needs.</Text>
            </View>
    
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderRadius:8
  },
  header: {
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 30,
    gap: 6,
  },
  viewAllText: {
    color: '#FFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  servicesContainer: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  serviceCount: {},
  servicesGrid: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  servicesList: {
    paddingBottom: 4,
  },
  serviceItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
  },
  serviceText: {
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  serviceIcon: {
    tintColor: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyIconBg: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
  },
  promoBanner: {
    width: 'auto',
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  promoTitle: {
    color: '#FFF',
    fontWeight: '700',
  },
  promoDesc: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  promoBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 30,
  },
  promoBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
