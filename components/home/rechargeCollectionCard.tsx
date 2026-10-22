// screens/RechargeCard.tsx
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import DMTLoginModal from "../modal/dmt/dmtLogin";
import QTLoginModal from "../modal/qt/qtLoginModal";
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
  const totalPadding = 48; // 24px padding on each side
  const totalGap = (numColumns - 1) * 16; // 16px gap between items
  return (SCREEN_WIDTH - totalPadding - totalGap) / numColumns;
};

// Professional color palette
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

// Service configurations with beautiful gradients
const serviceConfig: Record<string, any> = {
  rech: {
    icon: (color: string, size: number) => <Ionicons name="phone-portrait" size={size} color={color} />,
    gradient: ['#4158D0', '#C850C0'],
    route: "/screen/collection/mobileRecharge",
    action: (router: any) => router.push("/screen/collection/mobileRecharge")
  },
  dmt: {
    icon: (color: string, size: number) => <MaterialIcons name="account-balance" size={size} color={color} />,
    gradient: ['#FF8008', '#FFC837'],
    action: (router: any, HandleDmtBtn: any) => HandleDmtBtn()
  },
  payout: {
    icon: (color: string, size: number) => <FontAwesome5 name="hand-holding-usd" size={size * 0.9} color={color} />,
    gradient: ['#00B4DB', '#0083B0'],
    route: "/screen/collection/payout",
    action: (router: any) => router.push('/screen/collection/payout')
  },
  qt: {
    icon: (color: string, size: number) => <Ionicons name="swap-horizontal" size={size} color={color} />,
    gradient: ['#8E2DE2', '#4A00E0'],
    action: (router: any,handleQTBtn:any) => handleQTBtn()
  },
  uti: {
    icon: (color: string, size: number) => <MaterialIcons name="receipt" size={size} color={color} />,
    gradient: ['#F00000', '#DC281E'],
    route: "/screen/collection/uti",
    action: (router: any) => router.push("/screen/collection/uti")
  }
};

export default function RechargeCard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [modalVisible, setModalVisible] = useState(false);
  const [qTModalVisible, setQTModalVisible] = useState(false);
  
  const theme = isDark ? COLORS.dark : COLORS.light;
  const { AllServices } = useSelector((state: any) => state.services);
  const { allDmtData } = useSelector((state: any) => state.dmt);
  
  const services = AllServices?.utility || [];
  

  // Handle orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
    });
    return () => subscription?.remove();
  }, []);

  // Responsive values
  const numColumns = getNumColumns();
  const itemWidth = getItemWidth();
  const headerIconSize = isSmallDevice ? 16 : isTablet ? 24 : 20;
  const containerMargin = isSmallDevice ? 12 : isTablet ? 24 : 10;
  const headerPadding = isSmallDevice ? 16 : isTablet ? 28 : 20;

  const handleServicePress = (service: any) => {
    const HandleDmtBtn = () => {
      if (allDmtData?.activity === "kyc") {
        router.push("/screen/collection/dmt/remiitEKYC");
      } else if (allDmtData?.activity === "dashboard") {
        router.push("/screen/collection/dmt/remitAcount");
      } else {
        setModalVisible(true);
      }
    };

    const handleQTBtn = async() => {
        setQTModalVisible(true);
    };

    const config = serviceConfig[service.type];
    if (config?.action) {
      // Pass the appropriate handler based on service type
      if (service.type === 'dmt') {
        config.action(router, HandleDmtBtn);
      } else if (service.type === 'qt') {
        config.action(router, handleQTBtn);
      } else {
        config.action(router);
      }
    }
  };

  const renderServiceItem = ({ item }: { item: any }) => {
    const config = serviceConfig[item.type] || {
      icon: (color: string, size: number) => <Ionicons name="apps" size={size} color="#FFF" />,
      gradient: ['#6366F1', '#8B5CF6']
    };


    
    const dynamicIconSize = isSmallDevice ? 18 : isTablet ? 26 : 22;

    return (
      <TouchableOpacity
        style={[styles.serviceItem, { width: itemWidth }]}
        onPress={() => handleServicePress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={config.gradient}
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
          <View style={[
            styles.iconInner,
            { borderRadius: isSmallDevice ? 14 : isTablet ? 24 : 18 }
          ]}>
            {config.icon("#FFFFFF", dynamicIconSize)}
          </View>
        </LinearGradient>
        <Text 
          style={[
            styles.serviceName, 
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
    <>
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          margin: containerMargin,
        }
      ]}>
        {/* Header Section */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                <Ionicons name="grid" size={headerIconSize} color="#FFF" />
              </View>
              <View>
                <Text style={[
                  styles.headerTitle,
                  { fontSize: isTablet ? 24 : isSmallDevice ? 16 : 18 }
                ]}>
                  Quick Services
                </Text>
                <Text style={[
                  styles.headerSubtitle,
                  { fontSize: isTablet ? 16 : isSmallDevice ? 11 : 13 }
                ]}>
                  Recharge & Bill Payments
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats - Hide on very small devices */}
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
                ]}>24/7</Text>
                <Text style={[
                  styles.statLabel,
                  { fontSize: isTablet ? 14 : 11 }
                ]}>Support</Text>
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
                ]}>Processing</Text>
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
              All Services
            </Text>
            <Text style={[
              styles.serviceCount, 
              { 
                color: theme.textSecondary,
                fontSize: isTablet ? 16 : isSmallDevice ? 11 : 13,
              }
            ]}>
              {services.length} available
            </Text>
          </View>

          {services.length > 0 ? (
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              numColumns={numColumns}
              scrollEnabled={false}
              columnWrapperStyle={styles.servicesGrid}
              contentContainerStyle={styles.servicesList}
              key={numColumns} // Force re-render when numColumns changes
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
                <Ionicons name="apps-outline" size={isTablet ? 60 : 40} color={theme.textSecondary} />
              </View>
              <Text style={[
                styles.emptyTitle, 
                { 
                  color: theme.text,
                  fontSize: isTablet ? 20 : 16,
                }
              ]}>
                No Services Available
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

        {/* Promo Banner - Hide on very small devices */}
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
                  { fontSize: isTablet ? 20 : 16 }
                ]}>Premium quality services</Text>
                <Text style={[
                  styles.promoDesc,
                  { fontSize: isTablet ? 16 : 13 }
                ]}>at prices you will appreciate</Text>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>

      <DMTLoginModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <QTLoginModal
        visible={qTModalVisible}
        onClose={() => setQTModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    elevation: 4,
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
    backdropFilter: 'blur(10px)',
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
    borderRadius: 18, // This will be overridden inline
  },
  serviceName: {
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
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
  }
});
