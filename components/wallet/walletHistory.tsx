import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image } from "expo-image";
import { useCompany } from "@/constants/string";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const WalletHistory = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const baseURL = Constants.expoConfig?.extra?.API_URL;
  const company = useCompany();
  
  // State for date selection
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // New state for filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterType, setSelectedFilterType] = useState("all");
  const [showDateSection, setShowDateSection] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const colors = {
    light: {
      primary: "#350083",
      text: "#111827",
      icon: "#350083",
      card: "#FFFFFF",
      subText: "#6B7280",
      bg: "#F9FAFB",
      headerBorder: "#E5E7EB",
      success: "#16A34A",
      error: "#DC2626",
      pending: "#CA8A04",
      searchBg: "#F3F4F6",
    },
    dark: {
      primary: "#032834",
      text: "#FFFFFF",
      icon: "#FFFFFF",
      card: "#0F172A",
      subText: "#9CA3AF",
      bg: "#020617",
      headerBorder: "#1F2937",
      success: "#22C55E",
      error: "#EF4444",
      pending: "#EAB308",
      searchBg: "#1F2937",
    },
  };

  const theme = isDark ? colors.dark : colors.light;

  // Format date to DD-MM-YYYY
  const formatDate = (date: any) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date from API (YYYY-MM-DD HH:MM:SS) to DD-MM-YYYY
  const formatAPIDate = (dateString: any) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format time from API (YYYY-MM-DD HH:MM:SS) to HH:MM:SS
  const formatTime = (dateString: any) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getALLhistory = async () => {
    try {
      setLoading(true);
      const datas = await AsyncStorage.getItem("user");
      const keydata = JSON.parse(datas as any);
      
      const payload = {
        type: "wallet",
        from: formatDate(fromDate),
        to: formatDate(toDate) 
      };
      
      const { data } = await axios.post(
        `${baseURL}/api/get-report`,
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "headerKey": keydata?.header_key,
            "headerToken": keydata?.header_token,
          },
        }
      );
      // console.log(data.data.walletReport);
      
      if(data?.status === "SUCCESS"){
        setTransactionData(data.data.walletReport);
      } else {
        setTransactionData([]);
        Alert.alert(`${data?.status}`, `${data?.message}`);
      }
    } catch(error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to fetch transactions. Please try again.");
      setTransactionData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getALLhistory();
  }, [fromDate, toDate]);

  // Format transaction data for display (with searchable fields)
  const formatTransactionData = () => {
    if(!transactionData.length) return [];
    
    return transactionData.map((txn: any) => ({
      ...txn,
      searchableAmount: txn.amount,
      searchableType: txn.type,
      searchableTxnid: txn.txnid,
      displayAmount: `₹${parseFloat(txn.amount || 0).toFixed(2)}`,
    }));
  };

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    const transactions = formatTransactionData();
    
    return transactions.filter(item => {
      // Filter by type (Credit/Debit)
      if (selectedFilterType !== "all") {
        if (item.txntype !== selectedFilterType) {
          return false;
        }
      }
      
      // Search by various fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (item.txnid && item.txnid.toLowerCase().includes(query)) ||
          (item.amount && item.amount.toString().includes(query)) ||
          (item.type && item.type.toLowerCase().includes(query)) ||
          (item.remark && item.remark.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [transactionData, selectedFilterType, searchQuery]);

  // Generate single receipt PDF
  const generatePDFReceipt = async (transaction: any) => {
    if (!transaction) {
      Alert.alert('Error', 'No transaction data available');
      return;
    }
    
    setGeneratingPDF(true);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Transaction Receipt</title>
        <style>
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #350083 0%, #5B1FA3 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .logo{
            width:100px;
            height:100px
          } 
          .header h1 {
            margin: 0;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
          }
          .status-credit {
            background-color: #DCFCE7;
            color: #16A34A;
          }
          .status-debit {
            background-color: #FEE2E2;
            color: #DC2626;
          }
          .content {
            padding: 30px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .detail-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 14px;
          }
          .detail-value {
            color: #111827;
            font-size: 14px;
            font-weight: 500;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .amount-credit {
            color: #16A34A;
          }
          .amount-debit {
            color: #DC2626;
          }
          .footer {
            background-color: #F9FAFB;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 5px 0;
            color: #6B7280;
            font-size: 12px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .receipt {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
           <img class="logo"  src="${company.logo}" alt="Company Logo"/>
            <h1>Transaction Receipt</h1>
            <p>${transaction.type || 'N/A'}</p>
            <div class="status-badge ${transaction.txntype === 'CREDIT' ? 'status-credit' : 'status-debit'}">
              ${transaction.txntype || 'N/A'}
            </div>
          </div>
          
          <div class="content">
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value">${transaction.txnid || 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">${formatAPIDate(transaction.created_at)} ${formatTime(transaction.created_at)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Transaction Type</span>
              <span class="detail-value">${transaction.type || 'N/A'}</span>
            </div>
            
            <div class="amount ${transaction.txntype === 'CREDIT' ? 'amount-credit' : 'amount-debit'}">
              Amount: ₹${parseFloat(transaction.amount || 0).toFixed(2)}
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Opening Balance</span>
              <span class="detail-value">₹${parseFloat(transaction.opening || 0).toFixed(2)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Closing Balance</span>
              <span class="detail-value">₹${parseFloat(transaction.closing || 0).toFixed(2)}</span>
            </div>
            
            ${transaction.remark ? `
            <div class="detail-row">
              <span class="detail-label">Remark</span>
              <span class="detail-value">${transaction.remark}</span>
            </div>
            ` : ''}
            
            ${transaction.related_id && transaction.related_id > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Related ID</span>
              <span class="detail-value">${transaction.related_id}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for banking with us</p>
            <p>This is a computer generated receipt</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Share Transaction Receipt",
          mimeType: "application/pdf",
        });
      } else {
        Alert.alert(
          "PDF Generated",
          `PDF saved at: ${uri}`,
          [{ text: "OK" }]
        );
      }
      
    } catch {
      Alert.alert('Error', 'Failed to generate PDF receipt. Please try again.');
    } finally {
      setGeneratingPDF(false);
      setModalVisible(false);
    }
  };

  const ReceiptModal = ({ transaction, visible, onClose }: any) => {
    if (!transaction) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Transaction Details
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.receiptPreview, { backgroundColor: theme.card }]}>
                <View style={styles.receiptHeader}>
                  {company?.logo && (
                    <Image source={company.logo} style={{width:60,height:60}} />
                  )}
                  <Text style={[styles.receiptTitle, { color: theme.text }]}>
                    Transaction Receipt
                  </Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: transaction.txntype === "CREDIT"  ? "#DCFCE7" : "#FEE2E2"
                  }]}>
                    <Text style={[styles.statusText, { 
                      color: transaction.txntype === "CREDIT" ? "#16A34A" : "#DC2626" 
                    }]}>
                      {transaction.txntype}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.receiptDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Transaction ID:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {transaction.txnid}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Transaction Type:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {transaction.type}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Date & Time:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {formatAPIDate(transaction.created_at)} {formatTime(transaction.created_at)}
                    </Text>
                  </View>
                  
                  <View style={[styles.amountContainer, { 
                    backgroundColor: transaction.txntype === "CREDIT" ? "#DCFCE7" : "#FEE2E2"
                  }]}>
                    <Text style={[styles.amountLabel, { color: theme.subText }]}>Amount</Text>
                    <Text style={[styles.amountValue, { 
                      color: transaction.txntype === "CREDIT" ? "#16A34A" : "#DC2626" 
                    }]}>
                      ₹{parseFloat(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Opening Balance:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      ₹{parseFloat(transaction.opening).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Closing Balance:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      ₹{parseFloat(transaction.closing).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>
                      Remark:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {transaction.remark || 'N/A'}
                    </Text>
                  </View>
                  
                  {transaction.related_id > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.subText }]}>
                        Related ID:
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {transaction.related_id}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.receiptFooter}>
                  <Text style={[styles.footerText, { color: theme.subText }]}>
                    Thank you for banking with us
                  </Text>
                  <Text style={[styles.footerTextSmall, { color: theme.subText }]}>
                    This is a computer generated receipt
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.pdfButton, { backgroundColor: theme.primary }]}
              onPress={() => generatePDFReceipt(transaction)}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome name="file-pdf-o" size={20} color="#fff" />
                  <Text style={styles.pdfButtonText}>Download & Share PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({ item }: any) => {
    const statusColor = item.txntype === "DEBIT" ? theme.error : theme.success;
    const statusBgColor = item.txntype === "DEBIT" ? "#FEE2E2" : "#d2f7df";
    
    return (
      <TouchableOpacity 
        onPress={() => {
          setSelectedReceipt(item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.transactionCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: statusBgColor }]}>
              <Feather    
                name={item.txntype === "DEBIT" ? "minus" : "plus"}
                size={28}
                color={statusColor}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.transactionType, { color: theme.text }]}>
                {item.type}
              </Text>
              <Text style={[styles.transactionId, { color: theme.subText }]}>
                ID: {item.txnid}
              </Text>
            </View>
            <View style={styles.receiptButton}>
              <FontAwesome name="file-pdf-o" size={22} color={theme.primary} />
            </View>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.cardBody}>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subText }]}>Amount</Text>
                <Text style={[styles.amount, { color: statusColor }]}>
                  ₹{parseFloat(item.amount).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subText }]}>Opening</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  ₹{parseFloat(item.opening).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subText }]}>Closing</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  ₹{parseFloat(item.closing).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {item.remark && (
              <View style={styles.remarkContainer}>
                <Text style={[styles.remarkLabel, { color: theme.subText }]}>Remark:</Text>
                <Text style={[styles.remarkText, { color: theme.text }]} numberOfLines={2}>
                  {item.remark}
                </Text>
              </View>
            )}
            
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={12} color={theme.subText} />
              <Text style={[styles.dateText, { color: theme.subText }]}>
                {formatAPIDate(item.created_at)} at {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const onFromDateChange = (event: any, selectedDate: any) => {
    setShowFromPicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      if (selectedDate > toDate) {
        setToDate(selectedDate);
      }
    }
  };

  const onToDateChange = (event: any, selectedDate: any) => {
    setShowToPicker(false);
    if (selectedDate && selectedDate >= fromDate) {
      setToDate(selectedDate);
    } else if (selectedDate && selectedDate < fromDate) {
      Alert.alert("Invalid Date", "To date must be after from date");
    }
  };

  const formattedCount = formatTransactionData().length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Collapsible Date Selection Section */}
      <TouchableOpacity 
        style={[styles.dateSectionHeader, { backgroundColor: theme.card }]}
        onPress={() => setShowDateSection(!showDateSection)}
      >
        <Text style={[styles.dateSectionHeaderTitle, { color: theme.text }]}>
          Select Transaction Dates
        </Text>
        <MaterialIcons 
          name={showDateSection ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={theme.text} 
        />
      </TouchableOpacity>

      {showDateSection && (
        <View style={[styles.dateSection, { backgroundColor: theme.card }]}>
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: theme.subText }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.subText }]}>From</Text>
              <Text style={[styles.dateValue, { color: theme.text }]}>
                {formatDate(fromDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: theme.subText }]}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.subText }]}>To</Text>
              <Text style={[styles.dateValue, { color: theme.text }]}>
                {formatDate(toDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: theme.primary }]}
            onPress={getALLhistory}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search Transactions</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onFromDateChange}
          maximumDate={new Date()}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onToDateChange}
          maximumDate={new Date()}
          minimumDate={fromDate}
        />
      )}

      {/* Search and Filter Section - Only show when there are transactions */}
      {transactionData.length > 0 && (
        <View style={[styles.searchFilterSection, { backgroundColor: theme.card }]}>
          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: theme.searchBg }]}>
            <Feather name="search" size={20} color={theme.subText} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by ID, amount, type, or remark..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={20} color={theme.subText} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && transactionData.length === 0 && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Fetching transactions...
          </Text>
        </View>
      )}

      {/* Transaction List */}
      {!loading && filteredTransactions.length > 0 ? (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeaderContainer}>
              <View>
                <Text style={[styles.listHeader, { color: theme.text }]}>
                  Transaction History
                </Text>
                {searchQuery.length > 0 && (
                  <Text style={[styles.searchResultText, { color: theme.subText }]}>
                    Showing results for: searchQuery
                  </Text>
                )}
              </View>
              <Text style={[styles.transactionCount, { color: theme.subText }]}>
                {filteredTransactions.length} of {formattedCount} transactions
              </Text>
            </View>
          }
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptySearchContainer}>
                <Feather name="search" size={48} color={theme.subText} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No matching transactions
                </Text>
                <Text style={[styles.emptySub, { color: theme.subText }]}>
                  Try a different search term or clear the filter
                </Text>
                <TouchableOpacity 
                  style={[styles.clearFilterButton, { borderColor: theme.primary }]}
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedFilterType("all");
                  }}
                >
                  <Text style={[styles.clearFilterText, { color: theme.primary }]}>
                    Clear All Filters
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      ) : !loading && transactionData.length === 0 && (
        <View style={styles.emptyContainer}>
          <FontAwesome name="history" size={48} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Transactions Found
          </Text>
          <Text style={[styles.emptySub, { color: theme.subText }]}>
            Select dates and search to view transactions
          </Text>
        </View>
      )}

      {/* Receipt Modal */}
      <ReceiptModal 
        transaction={selectedReceipt}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

export default WalletHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth:0.5,
    borderColor:"#dadada",
    marginBottom:2
  },
  dateSectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 48,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pdfReportButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pdfReportButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionCount: {
    fontSize: 12,
  },
  searchResultText: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionId: {
    fontSize: 11,
  },
  receiptButton: {
    padding: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  cardBody: {
    gap: 12,
  },
  detailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  remarkContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  remarkText: {
    flex: 1,
    fontSize: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  receiptPreview: {
    padding: 16,
    borderRadius: 12,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerTextSmall: {
    fontSize: 10,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for search and filter
  searchFilterSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  filterChipsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
});