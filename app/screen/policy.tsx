import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import HeaderSection from '@/components/navbar/header'

const Policy = () => {
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
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#333333",
      textSecondary: "#666666",
      border: "#E0E0E0",
      primary: "#350083",
    },
    dark: {
      background: "#121212",
      card: "#1E1E1E",
      text: "#FFFFFF",
      textSecondary: "#AAAAAA",
      border: "#333333",
      primary: "#05445E",
    }
  }

  const currentColors = isDark ? colors.dark : colors.light


  const policySections = [
    {
      title: "Information We Collect",
      content: "While using Company website, we are dedicated to respecting the privacy of our User(s) and/or business correspondents. For security reasons, Company stores/saves clients' KYC information. Company users are individual, name, phone number, address, mail id, debit/credit card details like cardholder name, expiration date, information enters like mobile number, DTH, data card, bill payments, banking services, pan card details, and any details that may willingly be provided by the business correspondent."
    },
    {
      title: "Use of Personal Information",
      content: "Company uses Personal Information to resolve disputes, troubleshoots, promote safe services, collect money, inform users about our offers, updates, and services, and protect & detect Company against error, fraud, and other criminal activity."
    },
    {
      title: "Collection and Use of Non-Personal Information",
      content: "Company may collect non-personal information whenever they use it and work together. Non-personal information means operating system, utilized internet service providers browser name, computer type and technical information, and other related information.\n\nIf Company does combine personal information with non-personal information, that information will be taken care of as personal information as long as it remains combined."
    },
    {
      title: "How Do We Use Cookies?",
      content: "A cookie is a tiny file that asks permission to be placed on the business correspondent laptop/mobile/desktop device's memory. Once the BC agrees, this tiny file will be added and helps to load that specific page from 2nd time onwards. Cookies are allowed to respond to BC as an individual. Cookies help us better understand visitor behavior and tell us which services users are interested in offering us. Information collected by cookies, we treat as non-personal information. Cookies will help to analyze data about our website traffic and improve our services. Company will only use this information for statistical purposes, after that data will be removed from our system. Generally, cookies are helping us to provide a better experience of Company services. Users can opt to accept or decline cookies. Most web browsers like chrome, firefox, etc automatically accept cookies."
    },
    {
      title: "Advertising",
      content: "Any ads shown on Company services belong to advertising partners. These cookies allow the ad server to recognize the user based on interest stored on his/her mobile/website cookies."
    },
    {
      title: "User Acceptance",
      content: "By using our Company services, BC signifies his/her acceptance of our privacy policy. If the Business correspondent does not agree with this privacy policy, please do not join our Company services."
    },
    {
      title: "Disclosure of Data/Information",
      content: "Company will not share any personal information with the company/organization. Company may disclose information about the User and/or business correspondent if directed by the court, statutory, regulatory, and other government authorities. Before disclosing Company should immediately take approval from the BC to give those details of the court order or regulatory or statutory or similar process."
    },
    {
      title: "Access, Preserve and Share Your Information",
      content: "1. With regulators, law enforcement, or others in response to a legal request (Example - a search warrant, court order, or subpoena). Company has a good faith/belief in the law that requires us to do so.\n\n2. When Company has believed law that it is required to detect, prevent and address fraud. Violation of privacy policy and unauthorized use of our products or other unsafe or illegal activity to protect ourselves. We disclose this information as part of an investigation or regulatory enquiries.\n\nInformation that we receive about you (including financial transaction data) can be accessed and conserved for an extended time subject to any legal formalities between you and Company."
    },
    {
      title: "Security Measures",
      content: "Company should take all reasonable safety measures to maintain the privacy of the personal information of our business correspondent."
    },
    {
      title: "Other Website Links",
      content: "Company website contains links to other websites also. When a visitor clicks on these links, the visitor goes to another website. For this Company will not take any responsibility. Company warns you to read all the privacy/terms and conditions of all such websites, then decide whether you want to stay on that website or not. Business Correspondent is solely responsible for maintaining the confidentiality of its passwords, OTP, and other membership-related account information."
    },
    {
      title: "New Ownership",
      content: "If change the control of Company services/products or all and services new ownership, then we may transfer/share the Business Correspondent all information to the new owner."
    },
    {
      title: "Company Privacy Policy Updates",
      content: "If any major things will come in the future Company may change the privacy policy and update this privacy policy immediately. The same privacy policy should be available on our website. We requested you to check and follow us frequently to keep check on the same."
    }
  ]

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header with Back Button */}
        <HeaderSection title="Privacy & Policy" />
    

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={[styles.introCard, { backgroundColor: currentColors.card }]}>
          <Ionicons 
            name="shield-checkmark-outline" 
            size={48} 
            color={currentColors.primary} 
          />
          <Text style={[styles.introTitle, { color: currentColors.text }]}>
            Your Privacy Matters
          </Text>
          <Text style={[styles.introText, { color: currentColors.textSecondary }]}>
            We are committed to protecting your personal information and your right to privacy. 
            This policy explains how we collect, use, and safeguard your data.
          </Text>
        </View>

        {/* Policy Sections */}
        {policySections.map((section, index) => (
          <View key={index} style={[styles.sectionCard, { backgroundColor: currentColors.card }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                {section.title}
              </Text>
              <Ionicons
                name={expandedSections.includes(index) ? "chevron-up-outline" : "chevron-down-outline"}
                size={24}
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

        {/* Consent Section */}
        <View style={[styles.consentCard, { backgroundColor: currentColors.card }]}>
          <Ionicons 
            name="document-text-outline" 
            size={32} 
            color={currentColors.primary} 
          />
          <Text style={[styles.consentText, { color: currentColors.textSecondary }]}>
            By using our services, you consent to the collection and use of your information as described in this privacy policy.
          </Text>
        </View>

        {/* Spacing at bottom */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

export default Policy

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,  
  },
  introCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  consentCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  consentText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
})