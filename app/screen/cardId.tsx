import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image as RNImage, 
  TouchableOpacity, 
  useColorScheme, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image } from "expo-image";
import { useCompany } from "@/constants/string";
import HeaderSection from "@/components/navbar/header";

const IDCard = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const profileData = useSelector((state: any) => state.customer.list);
  const { user } = useSelector((state: any) => state.auth);
  const userData = profileData?.data?.profile;
  const company = useCompany();

  // Get user data from Redux with fallback values
  const userName = userData?.name || "User Name";
  const memberId = userData?.username || "N/A";
  const phone = userData?.mobile || "N/A";
  const address = user?.data?.accountkycstatus?.address || "No address provided";
  const profileImage = userData?.profile || null;
  const email = userData?.email || user?.data?.email || "N/A";

  const cardType = "ID Card";
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const colors = {
    background: isDark ? "#021a22" : "#f5f5f5",
    cardBg: "#38058b",
    text: "#ffffff",
    subText: "#cbd5e1",
    labelText: "#b0b0b0",
    border: "rgba(255,255,255,0.2)",
    placeholder: "#9ca3af",
  };

  

  // Convert image to base64 for PDF
  const convertImageToBase64 = async (imageSource: any): Promise<string> => {
    try {
      if (!imageSource) return '';
      
      let imageUri = '';
      
      // Handle different types of image sources
      if (typeof imageSource === 'number') {
        // For require statements like require('../assets/logo.png')
        // Use React Native's Image.resolveAssetSource
        const resolved = RNImage.resolveAssetSource(imageSource);
        imageUri = resolved?.uri;
        if (!imageUri) return '';
      } else if (typeof imageSource === 'string') {
        if (imageSource.startsWith('data:image')) {
          return imageSource; // Already base64
        } else if (imageSource.startsWith('http')) {
          imageUri = imageSource;
        } else {
          imageUri = imageSource;
        }
      } else if (imageSource && typeof imageSource === 'object') {
        if ('uri' in imageSource) {
          imageUri = imageSource.uri;
        }
      }
      
      if (!imageUri) {
        console.log('No image URI found');
        return '';
      }
      
      // Fetch and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const generateIDCardPDF = async () => {
    setGeneratingPDF(true);
    
    try {
      // Get profile image base64
      let profileBase64 = '';
      if (profileImage) {
        profileBase64 = await convertImageToBase64(profileImage);
      }
      
      // Get logo base64
      let logoBase64 = '';
      if (company?.logo) {
        logoBase64 = await convertImageToBase64(company.logo);
      }
      
      // Create logo HTML
      const logoHtml = logoBase64 ? 
        `<img src="${logoBase64}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" alt="Company Logo" />` : 
        `<div style="width: 60px; height: 60px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
           <span style="font-size: 30px; font-weight: bold; color: #38058b;">${(company.name || "C").charAt(0)}</span>
         </div>`;
      
      // Create profile HTML
      const profileHtml = profileBase64 ? 
        `<img src="${profileBase64}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" alt="Profile" />` : 
        `<div style="width: 100px; height: 100px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
           <span style="font-size: 40px; font-weight: bold; color: #38058b;">${userName.charAt(0).toUpperCase()}</span>
         </div>`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>ID Card - ${userName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
            }
            .card {
              max-width: 550px;
              width: 100%;
              background: linear-gradient(135deg, #38058b 0%, #5B1FA3 100%);
              border-radius: 24px;
              padding: 30px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              position: relative;
              overflow: hidden;
            }
            .card::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
              pointer-events: none;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              flex-wrap: wrap;
              gap: 15px;
            }
            .company-section {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .company-name {
              color: white;
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .card-type {
              background-color: rgba(255,255,255,0.15);
              padding: 6px 16px;
              border-radius: 20px;
            }
            .card-type-text {
              color: #FFD700;
              font-size: 12px;
              font-weight: bold;
            }
            .content {
              display: flex;
              gap: 20px;
              margin-bottom: 25px;
              flex-wrap: wrap;
            }
            .photo-section {
              flex-shrink: 0;
            }
            .photo {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              overflow: hidden;
              border: 3px solid #FFD700;
            }
            .details-section {
              flex: 1;
              min-width: 200px;
            }
            .employee-name {
              color: white;
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 15px;
              word-break: break-word;
            }
            .info-row {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 10px;
              flex-wrap: wrap;
            }
            .info-icon {
              font-size: 16px;
              min-width: 20px;
            }
            .info-label {
              color: #b0b0b0;
              font-size: 12px;
              font-weight: 500;
            }
            .info-value {
              color: white;
              font-size: 13px;
              font-weight: 500;
              word-break: break-word;
              flex: 1;
            }
            .divider {
              height: 1px;
              background-color: rgba(255,255,255,0.2);
              margin: 20px 0;
            }
            .footer {
              text-align: center;
            }
            .footer-text {
              color: rgba(255,255,255,0.8);
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            .member-since {
              color: rgba(255,255,255,0.5);
              font-size: 10px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .card {
                box-shadow: none;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="company-section">
                ${logoHtml}
                <div class="company-name">${(company.name || "Company").substring(0, 20)}</div>
              </div>
              <div class="card-type">
                <div class="card-type-text">${cardType}</div>
              </div>
            </div>
            
            <div class="content">
              <div class="photo-section">
                <div class="photo">
                  ${profileHtml}
                </div>
              </div>
              
              <div class="details-section">
                <div class="employee-name">${userName.substring(0, 30)}</div>
                
                <div class="info-row">
                  <span class="info-icon">🆔</span>
                  <span class="info-label">Member ID:</span>
                  <span class="info-value">${memberId}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-icon">📱</span>
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${phone}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-icon">✉️</span>
                  <span class="info-label">Email:</span>
                  <span class="info-value">${email.substring(0, 40)}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-icon">📍</span>
                  <span class="info-label">Address:</span>
                  <span class="info-value">${address.substring(0, 60)}</span>
                </div>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              <div class="footer-text">${(company.name || "Company Name").substring(0, 30)}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      console.log("PDF generated at:", uri);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Share ID Card",
          mimeType: "application/pdf",
        });
      } else {
        Alert.alert(
          "PDF Generated",
          `PDF saved at: ${uri}`,
          [{ text: "OK" }]
        );
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate ID card PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header with Back Button */}
        <HeaderSection title="User Card" />
      

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ID Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          {/* Company Header */}
          <View style={styles.cardHeader}>
            <View style={styles.companyBadge}>
              <Image 
                source={company.logo} 
                style={styles.companyLogo} 
              />
              <Text style={styles.companyName}>{company.name || "Company"}</Text>
            </View>
            <View style={styles.cardTypeBadge}>
              <Text style={styles.cardType}>{cardType}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.contentRow}>
            {/* Photo/Initials Placeholder */}
            <View style={styles.photoContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.photo} />
              ) : (
                <View style={styles.initialsContainer}>
                  <Text style={styles.initials}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Employee Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.employeeName}>{userName}</Text>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="card-account-details" size={14} color="#FFD700" />
                <Text style={styles.infoLabel}>Member ID:</Text>
                <Text style={styles.infoValue}>{memberId}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={14} color="#FFD700" />
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{phone}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={14} color="#FFD700" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#FFD700" />
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={[styles.infoValue, styles.addressText]} numberOfLines={2}>
                  {address}
                </Text>
              </View>
            </View>
          </View>

          {/* Horizontal Line */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{company.name}</Text>
          </View>
        </View>

        {/* Download PDF Button */}
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={generateIDCardPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
              <Text style={styles.downloadButtonText}>Download or Share </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default IDCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerPlaceholder: {
    width: 40,
  },
  card: {
    width: "90%",
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 30,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  companyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  companyName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  cardTypeBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardType: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  contentRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  initialsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFD700",
  },
  initials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#38058b",
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
    minWidth: 180,
  },
  employeeName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 6,
    gap: 4,
  },
  infoLabel: {
    color: "#b0b0b0",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  infoValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  addressText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 16,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    color: "#fcfbf4",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  memberSince: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38058b",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: "90%",
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});