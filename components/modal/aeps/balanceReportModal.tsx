import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface BalanceReportModalProps {
  visible: boolean;
  onClose: () => void;
  data: any;
  isLoading?: boolean;
  theme: any;
}

export const BalanceReportModal: React.FC<BalanceReportModalProps> = ({
  visible,
  onClose,
  data,
  isLoading = false,
  theme,
}) => {
  if (!data && !isLoading) return null;
  
  // Safely parse the response data
  let resData = null;
  try {
    // Check if data.data.receiptData.response exists and is a string
    if (data?.data?.receiptData?.response && typeof data.data.receiptData.response === 'string') {
      resData = JSON.parse(data.data.receiptData.response);
    } else if (data?.data?.receiptData?.response) {
      // If it's already an object, use it directly
      resData = data.data.receiptData.response;
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }

  // Extract data from response
  const transactionData = resData?.data || {};
  const receiptData = data?.data?.receiptData || {};
  
  // Get all required fields
  const bankName = transactionData?.bankName || receiptData?.bank;
  const accountNumber = transactionData?.accountNumber || receiptData?.aadhar;
  const amount = receiptData?.amount || transactionData?.bankAccountBalance;
  const txnid = receiptData?.txnid || transactionData?.externalRef;
  const mobile = receiptData?.mobile;
  const rrn = receiptData?.rrn;
  const statusMessage = resData?.status || data?.data?.receiptData?.message || 'Unknown error';
  const isTransactionSuccessful = data?.data?.receiptData?.status === 'SUCCESS';
  
  // Format amount with proper currency symbol
  const formatAmount = (value: any) => {
    if (!value || value === 'NA' || value === 'null') return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value;
    return `₹${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Generate PDF HTML
  const generatePDFHTML = () => {
    const formattedAmount = formatAmount(amount);
    const statusColor = isTransactionSuccessful ? '#22C55E' : '#EF4444';
    const statusText = isTransactionSuccessful ? 'SUCCESSFUL' : 'FAILED';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Balance Enquiry Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 30px 20px;
            color: #333;
            background-color: #fff;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .status-badge {
            display: inline-block;
            background-color: ${statusColor}15;
            color: ${statusColor};
            font-weight: bold;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 8px;
          }
          .balance-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
            color: white;
          }
          .balance-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .balance-amount {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .section {
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background-color: #fafafa;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #1f2937;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
          }
          .info-row {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
          }
          .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
          }
          .support-box {
            background-color: #f3f4f6;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Balance Enquiry Report</h1>
            <div class="status-badge">${statusText}</div>
          </div>

          ${amount ? `
          <div class="balance-card">
            <div class="balance-label">AVAILABLE BALANCE</div>
            <div class="balance-amount">${formattedAmount}</div>
            <div style="font-size: 12px; opacity: 0.8;">as on ${receiptData?.date || new Date().toLocaleDateString()}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">🏦 Account Details</div>
            <div class="info-row">
              <div class="label">Status</div>
              <div class="value">${statusMessage}</div>
            </div>
            ${bankName ? `
            <div class="info-row">
              <div class="label">Bank Name</div>
              <div class="value">${bankName}</div>
            </div>
            ` : ''}
            ${accountNumber ? `
            <div class="info-row">
              <div class="label">Account Number</div>
              <div class="value">${accountNumber}</div>
            </div>
            ` : ''}
            ${transactionData?.ipayId || receiptData?.uid ? `
            <div class="info-row">
              <div class="label">IPay ID</div>
              <div class="value">${transactionData?.ipayId || receiptData?.uid}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">📋 Transaction Details</div>
            ${txnid ? `
            <div class="info-row">
              <div class="label">Transaction ID</div>
              <div class="value">${txnid}</div>
            </div>
            ` : ''}
            ${rrn ? `
            <div class="info-row">
              <div class="label">RRN</div>
              <div class="value">${rrn}</div>
            </div>
            ` : ''}
            ${receiptData?.date ? `
            <div class="info-row">
              <div class="label">Date & Time</div>
              <div class="value">${receiptData.date}</div>
            </div>
            ` : ''}
            ${mobile ? `
            <div class="info-row">
              <div class="label">Mobile Number</div>
              <div class="value">${mobile}</div>
            </div>
            ` : ''}
          </div>

          <div class="support-box">
            <span style="font-size: 20px;">📧</span>
            <span style="flex: 1; color: #6b7280;">For support, contact: ${receiptData?.support || 'support@example.com'}</span>
          </div>

          <div class="footer">
            <p>✨ Generated on: ${new Date().toLocaleString()}</p>
            <p>Thank you for banking with us</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // PDF Generation Handler for Expo
  const handleGeneratePDF = async () => {
    if (!data) {
      Alert.alert("Error", "No data available to generate PDF.");
      return;
    }

    try {
      const htmlContent = generatePDFHTML();
      
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });
      
      console.log("PDF generated at:", uri);
      
      // Check if sharing is available on the device
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Share Balance Enquiry Report",
          mimeType: "application/pdf",
        });
      } else {
        Alert.alert(
          "PDF Generated",
          `PDF saved at: ${uri}`,
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (error) {
      console.error("PDF Error:", error);
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    }
  };

  const renderInfoRow = (label: string, value: string | number, icon: string) => {
    if (!value || value === 'NA' || value === 'null' || value === null || value === '') return null;
    
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <Ionicons name={icon as any} size={20} color={theme.primary} style={{ width: 30 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{
            fontSize: 12,
            color: theme.textLight,
            marginBottom: 4,
          }}>
            {label}
          </Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
          }}>
            {label === 'Amount' ? formatAmount(value) : value}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: theme.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
          minHeight: '60%',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons 
                name={isTransactionSuccessful ? "checkmark-circle" : "alert-circle"} 
                size={28} 
                color={isTransactionSuccessful ? theme.success : theme.error} 
              />
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.text,
                marginLeft: 12,
                flex: 1,
              }}>
                Balance Enquiry Report
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* PDF Button */}
              {!isLoading && data && (
                <TouchableOpacity onPress={handleGeneratePDF} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
              {/* Close Button */}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={theme.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={{ marginTop: 16, color: theme.textLight }}>Loading report...</Text>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              {/* Balance Amount Card */}
              {amount && (
                <View style={{
                  backgroundColor: theme.primary + '10',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.primary + '30',
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: theme.textLight,
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}>
                    AVAILABLE BALANCE
                  </Text>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: theme.primary,
                  }}>
                    {formatAmount(amount)}
                  </Text>
                  {receiptData?.date && (
                    <Text style={{
                      fontSize: 11,
                      color: theme.textLight,
                      marginTop: 8,
                    }}>
                      as on {receiptData.date}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Account Details */}
              {(bankName || accountNumber) && (
                <View style={{
                  backgroundColor: theme.inputBg,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: theme.text,
                    marginBottom: 12,
                  }}>
                    Account Details
                  </Text>
                  {renderInfoRow('Status', statusMessage, 'checkmark-done-outline')}
                  {renderInfoRow('Bank Name', bankName, 'business-outline')}
                  {renderInfoRow('Account Number', accountNumber, 'card-outline')}
                  {renderInfoRow('IPay ID', transactionData?.ipayId || receiptData?.uid, 'person-outline')}
                </View>
              )}

              {/* Transaction Details */}
              <View style={{
                backgroundColor: theme.inputBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.text,
                  marginBottom: 12,
                }}>
                  Transaction Details
                </Text>
                
                {renderInfoRow('Transaction ID', txnid, 'receipt-outline')}
                {renderInfoRow('RRN', rrn, 'qr-code-outline')}
                {renderInfoRow('Date & Time', receiptData?.date, 'calendar-outline')}
                {renderInfoRow('Mobile Number', mobile, 'call-outline')}
              </View>

              {/* Support Info */}
              <View style={{
                backgroundColor: theme.inputBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={{ marginLeft: 12, color: theme.textLight, flex: 1 }}>
                  For support, contact: {receiptData?.support || 'support@example.com'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 80 : 80 }}>
                {/* PDF Button */}
                <TouchableOpacity
                  onPress={handleGeneratePDF}
                  style={{
                    flex: 1,
                    backgroundColor: theme.inputBg,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                  <Text style={{
                    color: theme.primary,
                    fontSize: 16,
                    fontWeight: '600',
                    marginTop: 4,
                  }}>
                    Save as PDF
                  </Text>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    flex: 1,
                    backgroundColor: theme.primary,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: theme.textWhite,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};