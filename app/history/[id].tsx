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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image } from "expo-image";
import { useCompany } from "@/constants/string";

const DynamicHistory = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const company = useCompany()
  const { type, title } = useLocalSearchParams();
  
  const isDark = colorScheme === "dark";
  const baseURL = Constants.expoConfig?.extra?.API_URL;
  
  // State for date selection
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
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

  // Format time from API (YYYY-MM-DD HH:MM:SS) to HH:MM
  const formatTime = (dateString: any) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTransactionStatus = (txn: any) => {
    return txn?.status || txn?.txntype || "PENDING";
  };

  const getStatusColor = (status: any) => {
    switch(status) {
      case "SUCCESS":
        return "#16A34A";
      case "ERROR":
        return "#DC2626";
      case "CREDIT":
        return "#0abe40";
      case "DEBIT":
        return "#f7838c";
      case "PENDING":
        return "#CA8A04";
      case "FAILED":
         return "#bd3d3d";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status: any) => {
    switch(status) {
      case "SUCCESS":
        return "#dcfce7";
      case "ERROR":
        return "#fee2e2";
      case "CREDIT":
        return "#dcfce7";
      case "DEBIT":
        return "#ffe4e6";
      case "PENDING":
        return "#FEF9C3";
      default:
        return "#F3F4F6";
    }
  };

  const getALLhistory = async () => {
    try {
      setLoading(true);
      const datas = await AsyncStorage.getItem("user");
      const keydata = JSON.parse(datas as any);
      
      const payload = {
        type: type,
        from: formatDate(fromDate),
        to: formatDate(toDate) 
      };
      
      const res = await fetch(
        `${baseURL}/api/get-report`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "headerKey": keydata?.header_key,
            "headerToken": keydata?.header_token,
          },
        }
      );
      const data = await res.json(); 
      // console.log(data.data); 
      
      if(data?.status === "SUCCESS"){
        let transactions = [];
        
        switch(type) {
          case 'dmt':
            transactions = data?.data?.dmtReport || [];
            break;
          case 'wallet-to-wallet':
            transactions = data?.data?.walletToWalletReport || [];
            break;
          case 'qtransfer':
            transactions = data?.data?.qtransferReport || [];
            break;
          case 'aeps':
            transactions = data?.data?.aepsReport || [];
            break;
          case 'payout':
            transactions = data?.data?.payoutReport || [];
            break;
          case 'recharge':
            transactions = data?.data?.rechargeReport || [];
            break;
          case 'wallet':
            transactions = data?.data?.walletReport || [];
            break;
          default:
            transactions = data?.data?.dmtReport || 
                          data?.data?.walletToWalletReport || 
                          data?.data?.qtransferReport || 
                          data?.data?.walletReport || [];
        }
        
        setTransactionData(transactions);
        
        if(transactions.length === 0){
          Alert.alert("Info", "No transactions found for selected date range");
        }
      } else {
        setTransactionData([]);
        Alert.alert(`${data?.status || "Error"}`, `${data?.message || "Failed to fetch transactions"}`);
      }
    } catch {
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

  // Generate PDF receipt for a single transaction
  const generatePDFReceipt = async (transaction: any) => {
    if (!transaction) {
      Alert.alert('Error', 'No transaction data available');
      return;
    }
    
    setGeneratingPDF(true);
    
    const getTypeDisplayName = () => {
      switch(type) {
        case 'dmt': return 'DMT Transfer';
        case 'wallet-to-wallet': return 'Wallet to Wallet Transfer';
        case 'qtransfer': return 'Quick Transfer';
        case 'aeps': return 'AEPS Transaction';
        case 'payout': return 'Payout';
        case 'recharge': return 'Recharge';
        case 'wallet': return 'Wallet Transaction';
        default: return title || 'Transaction';
      }
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Transaction Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
          .logo {
           width:100px;
           height:100px;
           object-fit: contain;
           display: block;
           margin: 15px auto;
          }  
          .header h1 {
            margin: 0;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .header p {
            margin: 5px 0;
            opacity: 0.9;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
          }
          .status-SUCCESS {
            background-color: #DCFCE7;
            color: #16A34A;
          }
          .status-ERROR {
            background-color: #FEE2E2;
            color: #DC2626;
          }
          .status-PENDING {
            background-color: #FEF9C3;
            color: #CA8A04;
          }
          .status-CREDIT {
            background-color: #DCFCE7;
            color: #16A34A;
          }
          .status-DEBIT {
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
            <h1>${getTypeDisplayName()} Receipt</h1>
            <p>Transaction Details</p>
            <div class="logo">
              <img class="logo" src="${company.logo}"   alt="Company Logo" />
            </div>

            <div class="status-badge status-${transaction.status === "ERROR" ? "ERROR" : (transaction.txntype || transaction.status)}">
              ${transaction.type === "DEBIT" || transaction.type === "CREDIT" || transaction.type === "PENDING" ? transaction.type : transaction.status === "ERROR" ? "FAILED" : (transaction.txntype || transaction.status)}
            </div>
          </div>
          
          <div class="content">
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value">${transaction.txnid || transaction.id || 'N/A'}</span>
            </div>

            ${transaction.type ? `
            <div class="detail-row">
                <span class="detail-label">Transaction Type</span>
                <span class="detail-value">${transaction.type || 'N/A'}</span>
           </div>` : ''}

           ${transaction.account ? `
            <div class="detail-row">
                <span class="detail-label">A/c Number</span>
                <span class="detail-value">${transaction.account || 'N/A'}</span>
           </div>` : ''}

            ${transaction.ifsc ? `
            <div class="detail-row">
                <span class="detail-label">IFSC Code</span>
                <span class="detail-value">${transaction.ifsc || 'N/A'}</span>
           </div>` : ''}

            ${transaction.mode ? `
            <div class="detail-row">
                <span class="detail-label">Payment Mode</span>
                <span class="detail-value">${transaction.mode || 'N/A'}</span>
           </div>` : ''}

            ${transaction.bank ? `
            <div class="detail-row">
                <span class="detail-label">Bank Name</span>
                <span class="detail-value">${transaction.bank || 'N/A'}</span>
           </div>` : ''}

            ${transaction.bname ? `
            <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${transaction.bname || 'N/A'}</span>
           </div>` : ''}

              ${transaction.rrn ? `
            <div class="detail-row">
                <span class="detail-label">RNN No.</span>
                <span class="detail-value">${transaction.rrn || 'N/A'}</span>
           </div>` : ''}

               ${transaction.aadhar ? `
            <div class="detail-row">
                <span class="detail-label">Aadhaar Number</span>
                <span class="detail-value">${transaction.aadhar || 'N/A'}</span>
           </div>` : ''}

            ${transaction.mobile ? `
            <div class="detail-row">
                <span class="detail-label"> Mobile Number</span>
                <span class="detail-value">${transaction.mobile || 'N/A'}</span>
           </div>` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">${formatAPIDate(transaction.date || transaction.created_at)} ${formatTime(transaction.date || transaction.created_at)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Transaction Type</span>
              <span class="detail-value">${getTypeDisplayName()}</span>
            </div>
            
            <div class="amount">
              Amount: ₹${transaction.amount || transaction.txnamount || 0}
            </div>
            
            ${transaction.bname ? `
            <div class="detail-row">
              <span class="detail-label"> Name</span>
              <span class="detail-value">${transaction.bname}</span>
            </div>
            ` : ''}
            
            ${transaction.receiverName || transaction.receiverphone ? `
            <div class="detail-row">
              <span class="detail-label">Receiver</span>
              <span class="detail-value">${transaction.receiverName || transaction.receiverphone}</span>
            </div>
            ` : ''}
            
            ${transaction.senderName || transaction.senderPhone ? `
            <div class="detail-row">
              <span class="detail-label">Sender</span>
              <span class="detail-value">${transaction.senderName || transaction.senderPhone}</span>
            </div>
            ` : ''}
            
            ${transaction.number ? `
            <div class="detail-row">
              <span class="detail-label">Mobile Number</span>
              <span class="detail-value">${transaction.number}</span>
            </div>
            ` : ''}
            
            ${transaction.operator ? `
            <div class="detail-row">
              <span class="detail-label">Operator</span>
              <span class="detail-value">${transaction.operator}</span>
            </div>
            ` : ''}
            
            ${transaction.utr ? `
            <div class="detail-row">
              <span class="detail-label">UTR Number</span>
              <span class="detail-value">${transaction.utr}</span>
            </div>
            ` : ''}
            
            ${transaction.remark || transaction.message ? `
            <div class="detail-row">
              <span class="detail-label">Remark</span>
              <span class="detail-value">${transaction.remark || transaction.message}</span>
            </div>
            ` : ''}
            
            ${transaction.opening ? `
            <div class="detail-row">
              <span class="detail-label">Opening Balance</span>
              <span class="detail-value">₹${parseFloat(transaction.opening).toFixed(2)}</span>
            </div>
            ` : ''}
            
            ${transaction.closing ? `
            <div class="detail-row">
              <span class="detail-label">Closing Balance</span>
              <span class="detail-value">₹${parseFloat(transaction.closing).toFixed(2)}</span>
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
          dialogTitle: `Share ${getTypeDisplayName()} Receipt`,
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


  const TransactionModal = ({ transaction, visible, onClose }: any) => {
    if (!transaction) return null;
    
    
    const status = getTransactionStatus(transaction);
    const statusColor = getStatusColor(status);
    const displayStatus = transaction.type === "DEBIT" || transaction.type === "PENDING" || transaction.type === "CREDIT" ? transaction.type :transaction.txntype === "CREDIT" || transaction.txntype === "DEBIT" || transaction.txntype === "PENDING" ? transaction.txntype : transaction.status ;
    
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
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalDetails}>
                <View style={styles.modalStatusBadge}>
                  <Image source={company.logo} style={{width:100,height:100}}  />
                </View>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusBgColor(displayStatus) }]}>
                  <Text style={[styles.modalStatusText, { color: getStatusColor(displayStatus)}]}>
                   {displayStatus}
                  </Text>
                </View>
                
                <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Transaction ID</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.txnid || transaction.id || 'N/A'}</Text>
                </View>

                 { transaction.type &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}> Transaction Type </Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.type || 'N/A'}</Text>
                </View>
                }

                { transaction.account &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}> A/C Number </Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.account || 'N/A'}</Text>
                </View>
                }

                { transaction.ifsc &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}> IFSC Code </Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.ifsc || 'N/A'}</Text>
                </View>
                }

               { transaction.bank &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Bank Name</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.bank || 'N/A'}</Text>
                </View>
                }

                
               { transaction.mode &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Mode</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.mode || 'N/A'}</Text>
                </View>
                }

                 { transaction.rrn &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>RNN Number</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.rrn || 'N/A'}</Text>
                </View>
                }

                 { transaction.aadhar &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Aadhaar Number</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.aadhar || 'N/A'}</Text>
                </View>
                }

               { transaction.mobile &&  <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Mobile Number</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.mobile || 'N/A'}</Text>
                </View>
                }
                
                <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Date & Time</Text>
                  <Text style={[styles.modalDetailValue, { color: theme.text }]}>
                    {formatAPIDate(transaction.date || transaction.created_at)} {formatTime(transaction.date || transaction.created_at)}
                  </Text>
                </View>
                
                <View style={styles.modalDetailRow}>
                  <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Amount</Text>
                  <Text style={[styles.modalDetailValue, { color: statusColor, fontWeight: 'bold' }]}>
                    ₹{transaction.txnamount != null ? transaction.txnamount : transaction.amount}
                  </Text>
                </View>
                
                {transaction.bname && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Name</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.bname}</Text>
                  </View>
                )}
                
                {transaction.receiverName && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}> Name</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.receiverName}</Text>
                  </View>
                )}
                
                {transaction.receiverphone && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}> Mobile Number</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.receiverphone}</Text>
                  </View>
                )}
                
                {transaction.number && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Mobile Number</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.number}</Text>
                  </View>
                )}
                
                {transaction.operator && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Operator</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.operator}</Text>
                  </View>
                )}
                
                {transaction.utr && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>UTR Number</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.utr}</Text>
                  </View>
                )}
                
                {(transaction.remark || transaction.message) && (
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: theme.subText }]}>Remark</Text>
                    <Text style={[styles.modalDetailValue, { color: theme.text }]}>{transaction.remark || transaction.message}</Text>
                  </View>
                )}
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

  // Format transaction data based on type
  const formatTransactionData = () => {
    if(!transactionData.length) return [];
    
    return transactionData.map((txn: any, index) => {
      const amount = txn.txnamount != null ? txn.txnamount : txn.amount;
      let formattedItem: any = {
        id: txn.id || txn.txnid || index.toString(),
        date: formatAPIDate(txn.date || txn.created_at),
        time: formatTime(txn.date || txn.created_at),
        amount: `₹${amount || 0 }`,
        status: getTransactionStatus(txn),
        txnid: txn.txnid,
        rawData: txn,
      };
      
      // Handle different transaction types
      switch(type as any) {
        case 'dmt':
          formattedItem.type = "DMT Transfer";
          formattedItem.subText = `A/c ${txn.account || 'N/A'} • ${txn.mode || 'N/A'}`;
          formattedItem.txntype = "DEBIT";
          formattedItem.remark = txn.message || txn.remark;
          formattedItem.utr = txn.utr;
          break;
          
        case 'wallet-to-wallet':
          formattedItem.type = txn.type;
          formattedItem.subText = txn.type === "DEBIT" 
            ? `To: ${txn.receiverName || txn.receiverphone}` 
            : `From: ${txn.senderName || txn.senderPhone}`;
          formattedItem.txntype = txn.type;
          formattedItem.remark = `Id:${txn.txnid}`;
          break;
          
        case 'qtransfer':
          formattedItem.type = "Quick Transfer";
          formattedItem.subText = `A/c ${txn.account || 'N/A'} • ${txn.mode || 'N/A'}`;
          formattedItem.txntype = txn.status === "SUCCESS" ? "DEBIT" : "DEBIT";
          formattedItem.remark = txn.message || txn.response;
          break;
          
        case 'aeps':
          formattedItem.type = txn.type === "BE" ? "Balance Enquiry": txn.type === "MS" ?"Mini Statement": "Cash Withdraw"
          formattedItem.subText = `Aadhaar: ${txn.aadhar || 'N/A'}`;
          formattedItem.txntype = txn.txntype || "DEBIT";
          formattedItem.remark = txn.remark;
          break;
          
        case 'payout':
          formattedItem.type = "Payout";
          formattedItem.subText = `A/c ${txn.account || 'N/A'}`;
          formattedItem.txntype = "DEBIT";
          formattedItem.remark = txn.remark;
          break;
          
        case 'recharge':
          formattedItem.type = "Recharge";
          formattedItem.subText = `${txn.operator || 'N/A'} • ${txn.mobile || 'N/A'}`;
          formattedItem.txntype = "SUCCESS";
          formattedItem.remark = `${txn.circle || ''} ${txn.message || ''}`;
          break;
          
        case 'wallet':
          formattedItem.type = txn.type || "Wallet Transaction";
          formattedItem.subText =  `₹${txn.opening} → ₹${txn.closing}`;
          formattedItem.txntype = txn.txntype;
          formattedItem.remark = `Id:${txn.txnid}`;
          formattedItem.opening = txn.opening;
          formattedItem.closing = txn.closing;
          break;
          
        default:
          formattedItem.type = txn.type || "Transaction";
          formattedItem.subText = txn.remark || "";
          formattedItem.txntype = txn.txntype || (txn.status === "SUCCESS" ? "DEBIT" : "ERROR");
          formattedItem.remark = txn.remark;
      }
      
      return formattedItem;
    });
  };

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    const transactions = formatTransactionData();
    
    return transactions.filter(item => {
      // Filter by status/type
      if (selectedFilterType !== "all") {
        const itemStatus = item.status === "ERROR" ? "ERROR" : (item.txntype || item.status);
        if (itemStatus !== selectedFilterType) {
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
          (item.subText && item.subText.toLowerCase().includes(query)) ||
          (item.remark && typeof item.remark === 'string' && item.remark.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [transactionData, selectedFilterType, searchQuery,]);

  const renderItem = ({ item }: any) => {

    
    return (
      <TouchableOpacity 
        onPress={() => {
          setSelectedTransaction(item.rawData || item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.aepsItem, { backgroundColor: theme.card }]}>
          <View style={[styles.iconBox, { backgroundColor: getStatusBgColor(item.type || item.status) }]}>
  
            { type === "aeps" ?(
               <Ionicons  
                name="finger-print-sharp"
                size={28}
                color={item.status === "SUCCESS" ? "#16A34A" : item.status === "PENDING"? "#cfd144"   : "#DC2626"}
              />
            ) :type === "qtransfer" ?(
               <MaterialCommunityIcons   
                name="bank-transfer"
                size={28}
                color={item.status === "SUCCESS" ? "#16A34A" : item.status === "PENDING"? "#cfd144"  :"#DC2626"}
              />
            )
             :type === "payout" ?(
               <MaterialCommunityIcons   
                name="bank-transfer"
                size={28}
                color={item.status === "SUCCESS" ? "#16A34A" : item.status === "PENDING"? "#cfd144": "#DC2626"}
              />
            )
             :type === "dmt" ?(
               <MaterialCommunityIcons   
                name="bank-transfer"
                size={28}
                color={item.status === "SUCCESS" ? "#16A34A":item.status === "PENDING"? "#cfd144" : "#DC2626"}
              />
            )
            : type === "wallet" ?(
               <Ionicons  
                name="wallet"
                size={28}
                color={item.txntype === "DEBIT" ? "#DC2626" :  "#16A34A"}
              />
            ) 
             : type === "wallet-to-wallet" ?(
               <Ionicons  
                name="swap-horizontal"
                size={28}
                color={item.type === "DEBIT" ? "#DC2626" : item.type === "PENDING"? "#cfd144" : "#16A34A"}
              />
            ) 
            : type === "recharge" ?   
             <FontAwesome   
                name="mobile"
                size={28}
                color={item.status === "SUCCESS" ? "#16A34A" : item.status === "PENDING"? "#cfd144": "#DC2626"}
              />  :(
              <Ionicons  
                name={item.txntype === "CREDIT" ? "arrow-down" : "arrow-up"}
                size={28}
                color={item.txntype === "CREDIT" ? "#16A34A" :item.status === "PENDING"? "#cfd144" : "#DC2626"}
              />
            )
          }
          

          </View>

          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.text }]}>{item.type}</Text>
            {item.subText && (
              <Text style={[styles.subText, { color: theme.subText }]} numberOfLines={1}>
                {item.subText}
              </Text>
            )}
            <View style={styles.dateTimeContainer}>
              <Text style={[styles.date, { color: theme.subText }]}>{item.date}</Text>
              <Text style={[styles.time, { color: theme.subText }]}>{item.time}</Text>
            </View>
            {item.remark && typeof item.remark === 'string' && item.remark !== "NA" && (
              <Text style={[styles.remark, { color: theme.subText }]} numberOfLines={2}>
                {item.remark}
              </Text>
            )}
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.amount, { color: theme.text }]}>{item.amount}</Text>
            <Text style={[styles.status, { color: getStatusColor(item.type === "DEBIT" || item.type === "CREDIT" ? item.type :item.status)  }]}>
              {item.type === "DEBIT" || item.type === "CREDIT" ?item.type : item.status}
            </Text>
            {item.txnid && (
              <Text style={[styles.txnid, { color: theme.subText }]} numberOfLines={1}>
                ID: {item.txnid}
              </Text>
            )}
            {item.utr && (
              <Text style={[styles.txnid, { color: theme.subText }]} numberOfLines={1}>
                UTR: {item.utr}
              </Text>
            )}
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

  const formattedTransactions = formatTransactionData();


  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      
      <SafeAreaView
        style={[
          styles.header,
          { backgroundColor: theme.primary, borderBottomColor: theme.bg },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: "#fff" }]}>
          {title || "Transactions"}
        </Text>
      </SafeAreaView>

      {/* Date Selection Section - Collapsible */}
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
              <Text style={[styles.dateLabel, { color: theme.subText }]}>From Date</Text>
              <Text style={[styles.dateValue, { color: theme.text }]}>
                {formatDate(fromDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: theme.subText }]}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.subText }]}>To Date</Text>
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
            <Ionicons name="search" size={20} color={theme.subText} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by ID, amount, or remark..."
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

      {/* Loading Overlay for full screen loading */}
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
          keyExtractor={(item, index) => item.id.toString() + index.toString()}
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
                    Showing results for: {searchQuery}
                  </Text>
                )}
              </View>
              <Text style={[styles.transactionCount, { color: theme.subText }]}>
                {filteredTransactions.length} of {formattedTransactions.length} transactions
              </Text>
            </View>
          }
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptySearchContainer}>
                <MaterialIcons name="search-off" size={48} color={theme.subText} />
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
          <MaterialIcons name="history" size={48} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Transactions Found
          </Text>
          <Text style={[styles.emptySub, { color: theme.subText }]}>
            Select dates and search to view transactions
          </Text>
        </View>
      )}

      {/* Transaction Modal */}
      <TransactionModal 
        transaction={selectedTransaction}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

export default DynamicHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: -15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    marginBottom:4
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
    paddingHorizontal: 4,
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
  aepsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 11,
  },
  time: {
    fontSize: 11,
  },
  remark: {
    fontSize: 10,
    marginTop: 2,
    maxWidth: '90%',
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    textTransform: "capitalize",
    fontWeight: "900",
    fontStyle:'italic',
  },
  txnid: {
    fontSize: 9,
    marginTop: 2,
    maxWidth: 80,
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
  modalDetails: {
    gap: 12,
  },
  modalStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
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