import { StyleSheet, Text, View, ScrollView, useColorScheme } from 'react-native'
import React from 'react'
import HeaderSection from '@/components/navbar/header'

const RefundCancil = () => {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  
  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#350083",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    subText: isDark ? "#cbd5e1" : "#374151",
    inputBorder: isDark ? "#2f4f58" : "#d1d5db",
    button: isDark ? "#0b4a5a" : "#350083",
    error: "#ef4444",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <HeaderSection title="Refund & Cancellation" />
      

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.header }]}>Cancellation & Refund Policy</Text>
          
          <Text style={[styles.text, { color: colors.subText }]}>
            Business Correspondent once chooses our available offers/plans showed by Company website and he/she agrees to pay and buy that offer/plan in Company, such type of payment is not refunded by Company under any circumstances. As per applicable law, please note that buying Companys plan is an irreversible process.
          </Text>

          <Text style={[styles.text, { color: colors.subText, marginTop: 16 }]}>
            After payment of the selected package Company should create User activation on our system after successful KYC verification of such Business Correspondent. Business Correspondent unable to complete his/her KYC, Company will not create user details of such Business Correspondent. Business Correspondent should mandatory verify/complete KYC process in order get/register Company Services.
          </Text>

          <Text style={[styles.text, { color: colors.subText, marginTop: 16 }]}>
            After complete successful verification of KYC documents of user, we create a user id in our portal for that user. In Company portal transactions are failed due to any reason directly attribute to Company. Company has received related confirmation/information from the payment gateway, within 3 to 21 days. Then, we automatically refund that amount to the business correspondent. Date of transaction and a confirmation mail will be sent to Business Correspondent registered email id or available in their user portal.
          </Text>

          <Text style={[styles.text, { color: colors.subText, marginTop: 16 }]}>
            Please note that, excluding payment gateway charges, the business correspondents will receive the actual transaction amount will be refunded with all applicable taxes. However, in some cases business correspondent has received a successful confirmation of his/her payment but has not received services, then BC is required to submit a complaint to our support email id from your registered email id with us. Company should enquire about the matter after receiving the complaint and then Company may refund that payment. Company shall not be responsible for any other consequences liability failed services on our system.
          </Text>

          <Text style={[styles.text, { color: colors.subText, marginTop: 16 }]}>
            Business Correspondent should accept this refund policy is subject to all terms and conditions mentioned on the website of the Business Correspondent/user/retailer/distributor/master distributor with Company.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Contact Us</Text>
          <Text style={[styles.text, { color: colors.subText }]}>
            If you have any questions or need further clarification about our Refund and Cancellation Policy, please contact us at:
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default RefundCancil

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom:-15
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 16,
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 140,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  contactContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
});