import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import AepsServices from '../../../components/aepsServices/aepsServices';
import HeaderSection from '@/components/navbar/header';

// Color theme
const colors = {
  light: {
    primary: '#350083',
    gradientStart: '#4F1CA9',
    gradientEnd: '#350083',
    text: '#FFFFFF',
    icon: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#F8F9FA',
    inputText: '#111827',
    label: '#6B7280',
    error: '#EF4444',
    success: '#10B981',
    border: '#E5E7EB',
    shadow: 'rgba(79, 28, 169, 0.1)',
    background: '#F3F4F6',
    tabBg: '#e6e6e6',
    activeTabBg: '#4F1CA9',
    tabText: '#0a0808',
    activeText: '#ffffff',
  },
  dark: {
    primary: '#032834',
    gradientStart: '#05445E',
    gradientEnd: '#032834',
    text: '#FFFFFF',
    icon: '#FFFFFF',
    card: '#1A1A1A',
    inputBg: '#2D2D2D',
    inputText: '#FFFFFF',
    label: '#9CA3AF',
    error: '#F87171',
    success: '#34D399',
    border: '#374151',
    shadow: 'rgba(3, 40, 52, 0.3)',
    background: '#111827',
    tabBg: '#0b1f28',
    activeTabBg: '#1d4152',
    tabText: '#eaeaea',
    activeText: '#ffffff',
  },
};

const AepsService = () => {

  const [activeTab, setActiveTab] = useState<"withdraw" | "Check Balance" | "Mini Statement">("Check Balance");
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;


  const renderComponent = () => {
    switch (activeTab) {
      case "withdraw":
        return <AepsServices activeTab={activeTab} />;
      case "Check Balance":
        return <AepsServices  activeTab={activeTab}  />;
      case "Mini Statement":
        return <AepsServices activeTab={activeTab}   />;
      default:
        return <AepsServices activeTab={activeTab} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
        <HeaderSection title="AEPS Services" />

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.tabBg }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Check Balance" && {
              backgroundColor: theme.activeTabBg,
            },
          ]}
          onPress={() => setActiveTab("Check Balance")}
        >
          <Ionicons 
            name="wallet-outline" 
            size={20} 
            color={activeTab === "Check Balance" ? theme.activeText : theme.tabText} 
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "Check Balance" ? theme.activeText : theme.tabText,
              },
            ]}
          >
            Balance Enquiry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderRightWidth:2,borderLeftWidth:2, borderRightColor:"#dadada", borderLeftColor:"#dadada"},
            activeTab === "Mini Statement" && {
              backgroundColor: theme.activeTabBg,
            },
          ]}
          onPress={() => setActiveTab("Mini Statement")}
        >
          <Ionicons 
            name="document-text-outline" 
            size={20} 
            color={activeTab === "Mini Statement" ? theme.activeText : theme.tabText} 
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "Mini Statement" ? theme.activeText : theme.tabText,
              },
            ]}
          >
            Mini Statement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "withdraw" && {
              backgroundColor: theme.activeTabBg,
            },
          ]}
          onPress={() => setActiveTab("withdraw")}
        >
          <Ionicons 
            name="cash-outline" 
            size={20} 
            color={activeTab === "withdraw" ? theme.activeText : theme.tabText} 
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "withdraw" ? theme.activeText : theme.tabText,
              },
            ]}
          >
            Cash Withdraw
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render active component */}
      <View style={{ flex: 1 }}>
        {renderComponent()}
      </View>
    </View>
  )
}

export default AepsService;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#dadada',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal:26,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 13,
  },
});