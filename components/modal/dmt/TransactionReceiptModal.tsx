// components/modal/dmt/TransactionReceiptModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCompany } from '@/constants/string';

interface ReceiptData {
  account: string;
  amount1: number;
  amount2: number;
  date: string;
  ifsc: string;
  item1: string;
  item2: string;
  mode: string;
  name: string;
  rrn: string;
  status: string;
  support: string;
  total: number;
  txnid: string;
  // Additional fields for wallet receipts
  type?: string;
  opening?: number;
  closing?: number;
  remark?: string;
  related_id?: number;
  created_at?: string;
  txntype?: 'CREDIT' | 'DEBIT';
}

interface TransactionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  message?: string;
  isWalletReceipt?: boolean;
}

export default function TransactionReceiptModal({
  visible,
  onClose,
  receiptData,
  message,
  isWalletReceipt = false,
}: TransactionReceiptModalProps) {
  const company = useCompany();
  const [generatingPDF, setGeneratingPDF] = React.useState(false);

  if (!receiptData) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatAPIDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const generatePDFReceipt = async () => {
    setGeneratingPDF(true);

    const isCredit = receiptData.txntype === 'CREDIT';
    const statusColor = isCredit ? '#16A34A' : '#DC2626';
    const statusBg = isCredit ? '#DCFCE7' : '#FEE2E2';
    const statusText = receiptData.txntype || 'SUCCESS';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, 'Helvetica', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .receipt-container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #4F1CA9 0%, #350083 100%);
            padding: 24px 20px;
            color: white;
          }
          .header-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: white;
            padding: 4px;
          }
          .header-text {
            flex: 1;
          }
          .header-title {
            font-size: 18px;
            font-weight: 700;
            color: white;
            margin-bottom: 2px;
          }
          .header-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.8);
          }
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: ${statusBg};
            color: ${statusColor};
          }
          .content {
            padding: 20px;
          }
          .txn-id-container {
            background: #F8F9FA;
            padding: 12px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 16px;
          }
          .txn-id-label {
            font-size: 11px;
            color: #999;
            margin-bottom: 4px;
          }
          .txn-id-value {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            letter-spacing: 1px;
            word-break: break-all;
          }
          .status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .date-text {
            font-size: 13px;
            color: #999;
          }
          .amount-container {
            background: #F8F9FA;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
            text-align: center;
          }
          .amount-label {
            font-size: 13px;
            color: #999;
            margin-bottom: 4px;
          }
          .amount-value {
            font-size: 32px;
            font-weight: 700;
            color: ${statusColor};
          }
          .divider {
            height: 1px;
            background: #E5E7EB;
            margin: 16px 0;
          }
          .section-title {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #F0F0F0;
          }
          .detail-label {
            font-size: 14px;
            color: #666;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            text-align: right;
          }
          .mode-badge {
            background: #E3F2FD;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            color: #1976D2;
          }
          .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
          }
          .breakdown-label {
            font-size: 13px;
            color: #666;
          }
          .breakdown-value {
            font-size: 13px;
            font-weight: 500;
            color: #333;
          }
          .support-section {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F8F9FA;
            padding: 12px;
            border-radius: 12px;
            margin: 16px 0;
          }
          .support-text {
            font-size: 13px;
            color: #666;
            margin-left: 8px;
          }
          .support-email {
            font-size: 13px;
            font-weight: 600;
            color: #4F1CA9;
          }
          .footer {
            background: #F8F9FA;
            padding: 16px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer-text {
            font-size: 12px;
            color: #999;
            margin-bottom: 2px;
          }
          .footer-small {
            font-size: 10px;
            color: #999;
          }
          .amount-breakdown {
            margin-top: 12px;
            border-top: 1px solid #E5E7EB;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="header-content">
              ${company?.logo ? `<img class="logo" src="${company.logo}" alt="Company Logo"/>` : ''}
              <div class="header-text">
                <div class="header-title">Transaction Receipt</div>
                <div class="header-subtitle">${message || 'Your transaction has been completed'}</div>
              </div>
              <div class="status-badge">${statusText}</div>
            </div>
          </div>
          
          <div class="content">
            <div class="txn-id-container">
              <div class="txn-id-label">Transaction ID</div>
              <div class="txn-id-value">${receiptData.txnid}</div>
            </div>
            
            <div class="status-row">
              <span class="date-text">${receiptData.date ? formatDate(receiptData.date) : formatAPIDate(receiptData.created_at) + ' ' + formatTime(receiptData.created_at)}</span>
            </div>
            
            ${!isWalletReceipt ? `
              <div class="amount-container">
                <div class="amount-label">Total Amount</div>
                <div class="amount-value">${formatCurrency(receiptData.total)}</div>
                <div class="amount-breakdown">
                  <div class="breakdown-item">
                    <span class="breakdown-label">${receiptData.item1}</span>
                    <span class="breakdown-value">${formatCurrency(receiptData.amount1)}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">${receiptData.item2}</span>
                    <span class="breakdown-value">${formatCurrency(receiptData.amount2)}</span>
                  </div>
                </div>
              </div>
            ` : `
              <div class="amount-container">
                <div class="amount-label">Transaction Amount</div>
                <div class="amount-value">${formatCurrency(receiptData.amount1 || receiptData.total || 0)}</div>
              </div>
            `}
            
            <div class="divider"></div>
            
            ${!isWalletReceipt ? `
              <div class="section-title">Beneficiary Details</div>
              <div class="detail-row">
                <span class="detail-label">Account Number</span>
                <span class="detail-value">${receiptData.account}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Beneficiary Name</span>
                <span class="detail-value">${receiptData.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IFSC Code</span>
                <span class="detail-value">${receiptData.ifsc}</span>
              </div>
              
              <div class="divider"></div>
              
              <div class="section-title">Transaction Details</div>
              <div class="detail-row">
                <span class="detail-label">Mode</span>
                <span class="mode-badge">${receiptData.mode}</span>
              </div>
            ` : `
              <div class="section-title">Transaction Details</div>
              ${receiptData.type ? `
                <div class="detail-row">
                  <span class="detail-label">Transaction Type</span>
                  <span class="detail-value">${receiptData.type}</span>
                </div>
              ` : ''}
              ${receiptData.opening !== undefined ? `
                <div class="detail-row">
                  <span class="detail-label">Opening Balance</span>
                  <span class="detail-value">${formatCurrency(receiptData.opening)}</span>
                </div>
              ` : ''}
              ${receiptData.closing !== undefined ? `
                <div class="detail-row">
                  <span class="detail-label">Closing Balance</span>
                  <span class="detail-value">${formatCurrency(receiptData.closing)}</span>
                </div>
              ` : ''}
              ${receiptData.remark ? `
                <div class="detail-row">
                  <span class="detail-label">Remark</span>
                  <span class="detail-value">${receiptData.remark}</span>
                </div>
              ` : ''}
              ${receiptData.related_id && receiptData.related_id > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">Related ID</span>
                  <span class="detail-value">${receiptData.related_id}</span>
                </div>
              ` : ''}
            `}
            
            <div class="support-section">
              <span>📞</span>
              <span class="support-text">For support, contact:</span>
              <span class="support-email">${receiptData.support || 'support@example.com'}</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">Thank you for banking with us</div>
            <div class="footer-small">This is a computer generated receipt</div>
            <div class="footer-small">Generated on: ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share Transaction Receipt',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert('PDF Generated', `PDF saved at: ${uri}`, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF receipt. Please try again.');
      console.error('PDF Generation Error:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const renderStatusBadge = () => {
    if (isWalletReceipt && receiptData.txntype) {
      const isCredit = receiptData.txntype === 'CREDIT';
      return (
        <View style={[styles.statusBadge, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
          <MaterialIcons 
            name={isCredit ? "check-circle" : "error"} 
            size={16} 
            color={isCredit ? '#16A34A' : '#DC2626'} 
          />
          <Text style={[styles.statusText, { color: isCredit ? '#16A34A' : '#DC2626' }]}>
            {receiptData.txntype}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
        <Text style={styles.statusText}>SUCCESS</Text>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={['#4F1CA9', '#350083']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                {company?.logo && (
                  <Image
                    source={company.logo}
                    style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#fff', padding: 4 }}
                  />
                )}
                <View>
                  <Text style={styles.headerTitle}>Transaction Receipt</Text>
                  <Text style={styles.headerSubtitle}>
                    {message || 'Your transaction has been completed'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Transaction ID */}
            <View style={styles.txnIdContainer}>
              <Text style={styles.txnIdLabel}>Transaction ID</Text>
              <Text style={styles.txnIdValue}>{receiptData.txnid}</Text>
            </View>

            {/* Status Row */}
            <View style={styles.statusContainer}>
              {renderStatusBadge()}
              <Text style={styles.dateText}>
                {receiptData.date 
                  ? formatDate(receiptData.date) 
                  : `${formatAPIDate(receiptData.created_at)} ${formatTime(receiptData.created_at)}`}
              </Text>
            </View>

            {/* Amount Section */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>
                {isWalletReceipt ? 'Transaction Amount' : 'Total Amount'}
              </Text>
              <Text style={[
                styles.amountValue,
                isWalletReceipt && receiptData.txntype === 'DEBIT' && { color: '#DC2626' }
              ]}>
                {isWalletReceipt 
                  ? formatCurrency(receiptData.amount1 || receiptData.total || 0)
                  : formatCurrency(receiptData.total)}
              </Text>
              {!isWalletReceipt && (
                <View style={styles.amountBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{receiptData.item1}</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(receiptData.amount1)}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{receiptData.item2}</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(receiptData.amount2)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Details Section */}
            {!isWalletReceipt ? (
              <>
                {/* Beneficiary Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Beneficiary Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number</Text>
                    <Text style={styles.detailValue}>{receiptData.account}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Beneficiary Name</Text>
                    <Text style={styles.detailValue}>{receiptData.name}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IFSC Code</Text>
                    <Text style={styles.detailValue}>{receiptData.ifsc}</Text>
                  </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Transaction Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mode</Text>
                    <View style={styles.modeBadge}>
                      <Text style={styles.modeText}>{receiptData.mode}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>{formatDate(receiptData.date)}</Text>
                  </View>
                  
                  {receiptData.rrn && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>RRN</Text>
                      <Text style={styles.detailValue}>{receiptData.rrn}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                {/* Wallet Transaction Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Transaction Details</Text>
                  
                  {receiptData.type && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transaction Type</Text>
                      <Text style={styles.detailValue}>{receiptData.type}</Text>
                    </View>
                  )}
                  
                  {receiptData.opening !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Opening Balance</Text>
                      <Text style={styles.detailValue}>{formatCurrency(receiptData.opening)}</Text>
                    </View>
                  )}
                  
                  {receiptData.closing !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Closing Balance</Text>
                      <Text style={styles.detailValue}>{formatCurrency(receiptData.closing)}</Text>
                    </View>
                  )}
                  
                  {receiptData.remark && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Remark</Text>
                      <Text style={styles.detailValue}>{receiptData.remark}</Text>
                    </View>
                  )}
                  
                  {receiptData.related_id && receiptData.related_id > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Related ID</Text>
                      <Text style={styles.detailValue}>{receiptData.related_id}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Support Section */}
            <View style={styles.supportContainer}>
              <Ionicons name="headset" size={20} color="#4F1CA9" />
              <Text style={styles.supportText}>For support, contact: </Text>
              <Text style={styles.supportEmail}>{receiptData.support || 'support@example.com'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={generatePDFReceipt}
                disabled={generatingPDF}
              >
                <LinearGradient
                  colors={['#4F1CA9', '#350083']}
                  style={styles.downloadGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {generatingPDF ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <FontAwesome name="file-pdf-o" size={20} color="#FFFFFF" />
                      <Text style={styles.downloadButtonText}>PDF Receipt</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  body: {
    padding: 20,
  },
  txnIdContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  txnIdLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  txnIdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 13,
    color: '#999',
  },
  amountContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 15,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F1CA9',
    textAlign: 'center',
    marginBottom: 12,
  },
  amountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  modeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginVertical: 16,
  },
  supportText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  supportEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F1CA9',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 150,
  },
  downloadButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    flex: 0.4,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});