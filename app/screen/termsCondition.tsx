import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import HeaderSection from '@/components/navbar/header'
// Or import { useNavigation } from '@react-navigation/native' if using React Navigation

const TermsCondition = () => {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const [expandedSections, setExpandedSections] = useState<number[]>([])

  const toggleSection = (index: number) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index))
    } else {
      setExpandedSections([...expandedSections, index])
    }
  }

  const colors = {
    light: {
      background: "#F8F9FA",
      card: "#FFFFFF",
      text: "#212529",
      textSecondary: "#6C757D",
      border: "#E9ECEF",
      primary: "#350083",
      success: "#28A745",
      warning: "#FFC107",
      danger: "#DC3545",
    },
    dark: {
      background: "#121212",
      card: "#1E1E1E",
      text: "#FFFFFF",
      textSecondary: "#ADB5BD",
      border: "#2C2C2C",
      primary: "#350083",
      success: "#28A745",
      warning: "#FFC107",
      danger: "#DC3545",
    }
  }

  const currentColors = isDark ? colors.dark : colors.light


  const termsSections = [
    {
      title: "Contents mentioned in our website",
      icon: "document-text-outline",
      content: "Only for specific information purpose, we gave all materials in our website. Business Correspondent should not exchange, modify, distribute, transfer or sell anything in this website. If user copy any information available in this site like logo, icons, content, audio, text, video and images, for any personal, public and commercial, then user may ready to face legal consequences. As long as the business correspondent agrees with our terms and conditions mentioned in this website, Company allowed business correspondent non–moveable, non–exclusive and limited right to view, use and enter in this website. In any way the BC should agree not to attempt or interrupt any operation in this website. Registered Business Correspondents are only access to enter some of this website of available services. We have copyrights of various properties, softwares and materials in Company as applicable property laws."
    },
    {
      title: "Ownership",
      icon: "business-outline",
      content: "The Business Correspondent should agree and should follow all instructions available in this website. We are not granting any user any license to utilize our service tasks, logos or trademarks in any manner. We may necessary action if any unauthorized use of Content may violate copyright laws, trademark laws, civil, criminal, privacy and publicity, we may take necessary action according to that."
    },
    {
      title: "Devices",
      icon: "phone-portrait-outline",
      content: "Business correspondent should agree to not use any spiders, robots, other automatic device or manual process to copy or observe any web pages content without our permission."
    },
    {
      title: "Transmitted Material",
      icon: "send-outline",
      content: "In web available any program are never totally secure or private. Company has reserves all rights/copyrights in the contents of this website. Copying of the contents on this website without permission is strictly prohibited."
    },
    {
      title: "Modifications",
      icon: "create-outline",
      content: "Without any notice and any time Company may change, add or remove any of these terms and conditions. Terms & Conditions are applicable as soon as we posted in this website. User should accept by continuing using our services/website after any changes. Every time Company reserves the right to carry out all essential steps to ensure our safety and security."
    },
    {
      title: "Company Recharges",
      icon: "phone-portrait-outline",
      content: "Company is providing recharge services like DTH, Mobiles, Data Card, and all as a reseller only. Company is not a telecommunication company or any recharge service provider. We only a reseller of prepaid, postpaid and DTH services provided by DTH service providers and telecommunications or other distributors. Company does not provide any guarantee and warranty of any services provided by the service providers. Any disputes regarding minutes, quality, expiration, cost, and other terms of recharge purchased from our portal directly between user and service provider of the telecommunications."
    },
    {
      title: "Rail | Bus | Air | Tickets",
      icon: "train-outline",
      content: "1. Company doesn't have any transport services of its own. Company is only providing a platform for booking Rail|Bus|Air| tickets. It is the sole decision of the BC to select any operator or user's convenience.\n\n2. Company is only responsible for providing this platform for issuing tickets, support, cancellation, for refunds of cancellation and other available information. Except these responsibilities Company won't be responsible for any issue arising of Business Corresponding travels including services offered, time schedule, luggage safety etc.\n\n3. Any refund or cancellation should be carried out as per the policy and terms of the service providers.\n\n4. All passengers should be required to accept terms and conditions for booking a valid ticket, proof of identity, and should not carry any explosive or dangerous goods, weapons, etc.\n\n5. Any services, facilities, or amenities are shown website is transactions or deals that will be provided by the service provider. Company shall not be responsible for any such deal or offer. Business Correspondent should be enquiring freely about showed offer and take the right decision."
    },
    {
      title: "Bill / Insurance Payments",
      icon: "card-outline",
      content: "In our website Bill/Insurance premium payments are also available. BC should check very carefully to complete the bill payments. If BC fails to enter the proper or correct information, Company may reject such type of transaction or suspend or terminate BC's account for any future operation. Company won't be responsible for any liability stated reason which is not an exhaustive list:\n\n1. Insufficient funds in the Business Correspondent account.\n2. BC provides incomplete or incorrect information.\n3. Any rejection or discrepancy of the respected service provider.\n4. Any reason not beyond the control of Company.\n5. Bank or financial institution may reject for any reason as per their procedure/process.\n\nIn the above circumstances Company should intimate the user about such type of failed payment."
    },
    {
      title: "Domestic Money Transfer",
      icon: "swap-horizontal-outline",
      content: "1. Company is not responsible on any manner like delay in domestic money transfer services due to technical reasons of the NPCI/RBI/Bank or any government/statutory authority.\n\n2. Business correspondent should agree all the terms and conditions mentioned Company.\n\n3. Company believes that KYC is provided by the business correspondent duly self attested, authentic and true.\n\n4. In Company available or loaded amount of wallet is not gain from proceeds of any crime."
    },
    {
      title: "Business Correspondent Responsibility",
      icon: "shield-checkmark-outline",
      content: "1. The business correspondent should access our website only for complying with all applicable laws, regulations and statutes in connection in this website. BC should not copy, modify, transmit, display, distribute, perform, publish, reproduce, create duplicate works, sell or transfer any products, information, or services belongs of this website.\n\n2. The information provided by the BC in the Registration page must be accurate & complete. Company reserves the right to disclose any information necessary & fit to comply with applicable laws, legal process, regulation, State/Central government request.\n\n3. BC should make only legitimate payments/transactions. Any false, speculative or fake transaction is strictly prohibited.\n\n4. The Business Correspondent confirms us his age is above 18 years and has to handle legal consequences from Business Correspondent enter into this Agreement.\n\n5. If business correspondent tried to make an online transaction and due to some technical error, BC did not get any payment confirmation, please check the respective account details from transacting bank or speak to our customer care, before attempting another transaction."
    },
    {
      title: "Force Majeure",
      icon: "thunderstorm-outline",
      content: "Company should not be legally responsible for delays or inabilities in performance or nonperformance in whole or in part of this website reasonable situation such as fire, act of God, strikes and acts of government or any governmental or statutory authority including NPCI/RBI."
    },
    {
      title: "Safety of Data Downloaded",
      icon: "cloud-download-outline",
      content: "Business Correspondent agree & understand any of availing services in this Company website or any data and/or material downloaded or use of all available services totally at his/her own risk and discretion. Business correspondent will be solely responsible for any damage to his/her Computer/Laptop/Mobile or data loss that results from the downloading any material available in Company website. However, Company will always give you its best solutions that the content on this website or other information are free of any virus such as malfunctions, malwares etc."
    },
    {
      title: "Relationship",
      icon: "people-outline",
      content: "Terms and Conditions, notices or the right to use this website by the Business Correspondent contained of any pages on this website, should be partnership between the Business Correspondent and Company only. No other party or any authority has no rights in any way."
    },
    {
      title: "Jurisdiction",
      icon: "location-outline",
      content: "Company hereby specifically implied warranties and disclaims by the laws of any jurisdiction or country other than those where it is operating its offices. Company considers itself and intends to be jurisdiction of Visakhapatnam, Andhra Pradesh only."
    },
    {
      title: "Limitation of Liability",
      icon: "scale-outline",
      content: "Despite anything to the different contained herein, neither Company services nor its associated companies, officers, subsidiaries, employees, directors, or any related third party for any incidental, indirect, consequential or special damages or revenue loss or profits arising under or relating to these terms and conditions on this website or the offerings, even if any of said parties should understand the responsibility for damages."
    },
    {
      title: "Indemnification",
      icon: "shield-outline",
      content: "User should indemnify, defend, and hold harmless Company and its agents, representatives, affiliates, officers, and employees from against all lawsuits, demands, actions, claims, expenses, liabilities, settlements, judgments, and penalties of any kind arising in any way relating to:\n\n1. Business Correspondent violation/breach of any terms and conditions mentioned on this Company website.\n2. Business Correspondent suspected violation or violation of any applicable law in relation to use of this website.\n3. Any act of negligence, fraud, and misrepresentation by BC.\n4. Fine, penalty, or any charges imposed by any statutory/regulatory/bank/government authority on Company with respect to any acts of omission or commission by the Business Correspondent.\n5. Business Correspondent performance/non-performance of her/his responsibility under these terms and conditions."
    },
    {
      title: "Dispute Resolution",
      icon: "chatbubbles-outline",
      content: "Business Correspondent agrees that any dispute arising out this website or available Company services should be first resolved by friendly and failure to resolve the same issue in 30 days. The proceedings shall be conducted as per Arbitration and Conciliation Act 1996 or any of its successive amendments/statue. The seat of arbitration shall be at Visakhapatnam and proceedings should be conducted in Telugu and English language."
    },
    {
      title: "Termination",
      icon: "trash-outline",
      content: "Business Correspondent agrees, Company have all rights to terminate or suspend Business Correspondent account partially or completely or usage of services and/or Business Correspondent profile at any time. Company also has its sole discretion and at any time terminates providing access of Company services or any part thereof, with or without notice."
    }
  ]

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header with Back Button */}
         <HeaderSection title="Terms & Conditions" />
     

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={[styles.introCard, { backgroundColor: currentColors.card, borderLeftColor: currentColors.primary }]}>
          <View style={styles.introIconContainer}>
            <Ionicons name="document-text-outline" size={40} color={currentColors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: currentColors.text }]}>
            Business Correspondent Agreement
          </Text>
          <Text style={[styles.introText, { color: currentColors.textSecondary }]}>
            Business correspondent should read, agree & understand terms & conditions before making any kind of transaction with Company.
          </Text>
          <Text style={[styles.introSubText, { color: currentColors.textSecondary }]}>
            This website is maintained and published by Company Services. When the BC uses, browses and accesses of this website, user accepts the terms and conditions set as mentioned below.
          </Text>
        </View>

        {/* Terms Sections */}
        {termsSections.map((section, index) => (
          <View key={index} style={[styles.sectionCard, { backgroundColor: currentColors.card, borderLeftColor: currentColors.primary }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(index)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name={section.icon as any} size={22} color={currentColors.primary} />
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                  {section.title}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.includes(index) ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color={currentColors.primary}
              />
            </TouchableOpacity>
            
            {expandedSections.includes(index) && (
              <Text style={[styles.sectionContent, { color: currentColors.textSecondary }]}>
                {section.content}
              </Text>
            )}
          </View>
        ))}

        {/* Footer Note */}
        <View style={[styles.footerCard, { backgroundColor: currentColors.card }]}>
          <Ionicons name="information-circle-outline" size={24} color={currentColors.primary} />
          <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>
            By using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </Text>
        </View>

        {/* Spacing at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

export default TermsCondition

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom:-15,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  introCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  introIconContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  introSubText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  footerCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
})