import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  useColorScheme,
  Platform,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");

export default function EnhancedFintechSlider() {
  const { AllServices } = useSelector((state: any) => state.services);
  const colorScheme = useColorScheme();
  
  // Transform API banner data to use images as backgrounds
  const transformBannerData = () => {
    if (!AllServices?.banners) return [];
    
    return AllServices.banners.map((banner: any) => ({
      id: banner.id,     
      description: banner.description || "Explore our latest offers and services",
      backgroundImage: banner.filepath,
      title: banner.title || "Special Offer",
    }));
  };

  const sliderData = transformBannerData();
  
  const renderItem = ({ item, index }: any) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        {/* Background Image */}
        <Image
          source={{ uri: item.backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Dark Overlay for better text readability */}
        <View style={styles.overlay} />
        
        
        {/* Indicator Dots */}
        <View style={styles.indicatorContainer}>
          {sliderData.map((_: any, i: number) => (
            <View 
              key={i} 
              style={[
                styles.indicator,
                index === i && styles.activeIndicator
              ]} 
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (!sliderData || sliderData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[
          styles.sectionTitle, 
          { color: colorScheme === 'light' ? '#111827' : '#FFFFFF' }
        ]}>
          Financial Services
        </Text>
        <Text style={[
          styles.sectionSubtitle,
          { color: colorScheme === 'light' ? '#6B7280' : '#9CA3AF' }
        ]}>
          ALL-IN-ONE Finance solutions
        </Text>
      </View>
      
      <View style={styles.carouselWrapper}>
        <Carousel
          width={width - 32}
          height={220}
          autoPlay={true}
          loop={true}
          autoPlayInterval={3000}
          data={sliderData}
          scrollAnimationDuration={800}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.92,
            parallaxScrollingOffset: 45,
            parallaxAdjacentItemScale: 0.85,
          }}
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
          renderItem={renderItem}
          style={styles.carousel}
          defaultIndex={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.8,
  },
  carouselWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderRadius: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    zIndex: 2,
  },
  textContainer: {
    marginBottom: 40,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  desc: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    opacity: 0.95,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  actionArrow: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 5,
  },
  activeIndicator: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
});