// components/RechargeReportModal.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface RechargeData {
  amount1: number;
  amount2: number;
  date: string;
  item1: string;
  item2: string;
  mobile: string;
  operator: string;
  status: string;
  support: string;
  total: number;
  txnid: string;
}

interface RechargeResponse {
  closing: number;
  data: {
    recentTxn?: any[];
    rechargeData: RechargeData;
  };
  message: string;
  status: string;
}

interface RechargeReportModalProps {
  visible: boolean;
  onClose: () => void;
  transactionData: RechargeResponse | null;
}

export default function RechargeReportModal({
  visible,
  onClose,
  transactionData,
}: RechargeReportModalProps) {
  const rechargeData = transactionData?.data?.rechargeData;
  const closingBalance = transactionData?.closing;

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "#10B981";
      case "PENDING":
        return "#F59E0B";
      case "FAILED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "checkmark-circle";
      case "PENDING":
        return "time-outline";
      case "FAILED":
        return "close-circle";
      default:
        return "alert-circle";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "Successful";
      case "PENDING":
        return "Pending";
      case "FAILED":
        return "Failed";
      default:
        return status || "Unknown";
    }
  };

  // Generate PDF HTML
  const generatePDFHTML = () => {
    const status = rechargeData?.status || "UNKNOWN";
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const statusMessage = transactionData?.message || "Transaction has been processed";
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recharge Report</title>
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
            background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%);
            padding: 30px 20px;
            border-radius: 16px;
            color: white;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .status-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .transaction-id {
            background-color: #f3f4f6;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: center;
          }
          .transaction-id-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .transaction-id-value {
            font-size: 16px;
            font-weight: 600;
            color: #4F1CA9;
            font-family: monospace;
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
            border-left: 4px solid ${statusColor};
            padding-left: 12px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-size: 14px;
            color: #6b7280;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
          }
          .amount-value {
            color: #4F1CA9;
            font-weight: 700;
          }
          .commission-value {
            color: #10B981;
            font-weight: 600;
          }
          .total-value {
            color: #4F1CA9;
            font-weight: 700;
            font-size: 16px;
          }
          .status-badge {
            display: inline-block;
            background-color: ${statusColor}20;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: ${statusColor};
          }
          .balance-card {
            background-color: #f0fdf4;
            border: 1px solid #d1fae5;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .balance-label {
            font-size: 14px;
            font-weight: 500;
            color: #065f46;
          }
          .balance-value {
            font-size: 18px;
            font-weight: 700;
            color: #065f46;
          }
          .support-card {
            background-color: #fef3c7;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }
          .support-text {
            font-size: 12px;
            color: #92400e;
          }
          .support-email {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
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
            <div class="status-icon">
              ${status === "SUCCESS" ? "✓" : status === "PENDING" ? "⏰" : "✗"}
            </div>
            <h1>Recharge ${statusText}</h1>
            <p style="opacity: 0.9;">${statusMessage}</p>
          </div>

          <div class="transaction-id">
            <div class="transaction-id-label">Transaction ID</div>
            <div class="transaction-id-value">${rechargeData?.txnid || "N/A"}</div>
          </div>

          <div class="section">
            <div class="section-title">Recharge Details</div>
            <div class="detail-row">
              <span class="detail-label">Mobile Number</span>
              <span class="detail-value">${rechargeData?.mobile || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Operator</span>
              <span class="detail-value">${rechargeData?.operator?.trim() || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">${formatDate(rechargeData?.date || "")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="status-badge">${rechargeData?.status || "N/A"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Amount Breakdown</div>
            <div class="detail-row">
              <span class="detail-label">${rechargeData?.item1 || "Recharge Amount"}</span>
              <span class="detail-value amount-value">${formatAmount(rechargeData?.amount1 || 0)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${rechargeData?.item2 || "Commission"}</span>
              <span class="detail-value commission-value">- ${formatAmount(Math.abs(rechargeData?.amount2 || 0))}</span>
            </div>
            <div class="detail-row" style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 12px;">
              <span class="detail-label" style="font-weight: 600;">Total Amount</span>
              <span class="detail-value total-value">${formatAmount(rechargeData?.total || 0)}</span>
            </div>
          </div>

          ${closingBalance ? `
          <div class="balance-card">
            <span class="balance-label">Closing Balance</span>
            <span class="balance-value">${formatAmount(closingBalance)}</span>
          </div>
          ` : ''}

          <div class="support-card">
            <span>📧</span>
            <span class="support-text">For support, contact:</span>
            <span class="support-email">${rechargeData?.support || "support@example.com"}</span>
          </div>

          <div class="footer">
            <p>✨ Generated on: ${new Date().toLocaleString()}</p>
            <p>Thank you for recharging with us</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // PDF Generation Handler for Expo
  const handleGeneratePDF = async () => {
    

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
          dialogTitle: "Share Recharge Report",
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

        <View style={[styles.modalContent, { backgroundColor: "#FFFFFF" }]}>
          {/* Header */}
          <LinearGradient
            colors={[
              getStatusColor(rechargeData?.status || ""),
              getStatusColor(rechargeData?.status || ""),
            ]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={getStatusIcon(rechargeData?.status || "")}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.title}>
                Recharge {getStatusText(rechargeData?.status || "")}
              </Text>
              <Text style={styles.subtitle}>
                {transactionData?.message || "Transaction has been processed"}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Transaction ID */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Feather name="hash" size={18} color="#6B7280" />
                <Text style={styles.infoLabel}>Transaction ID</Text>
                <Text style={styles.infoValue}>
                  {rechargeData?.txnid || "N/A"}
                </Text>
              </View>
            </View>

            {/* Recharge Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recharge Details</Text>

              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile Number</Text>
                  <Text style={styles.detailValue}>
                    {rechargeData?.mobile || "N/A"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Operator</Text>
                  <Text style={styles.detailValue}>
                    {rechargeData?.operator?.trim() || "N/A"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(rechargeData?.date || "")}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(rechargeData?.status || "") + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(rechargeData?.status || "") },
                      ]}
                    >
                      {rechargeData?.status || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Amount Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount Breakdown</Text>

              <View style={styles.amountCard}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    {rechargeData?.item1 || "Recharge Amount"}
                  </Text>
                  <Text style={[styles.amountValue, styles.rechargeAmount]}>
                    {formatAmount(rechargeData?.amount1 || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    {rechargeData?.item2 || "Commission"}
                  </Text>
                  <Text style={[styles.amountValue, styles.commissionAmount]}>
                    - {formatAmount(Math.abs(rechargeData?.amount2 || 0))}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>
                    {formatAmount(rechargeData?.total || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Closing Balance */}
            {closingBalance && (
              <View style={styles.section}>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Closing Balance</Text>
                  <Text style={styles.balanceValue}>
                    {formatAmount(closingBalance)}
                  </Text>
                </View>
              </View>
            )}

            {/* Support Contact */}
            <View style={styles.supportCard}>
              <Feather name="mail" size={16} color="#92400E" />
              <Text style={styles.supportText}>For support, contact: </Text>
              <Text style={styles.supportEmail}>
                {rechargeData?.support || "support@example.com"}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              {/* PDF Button */}
              <TouchableOpacity 
                style={styles.pdfButton} 
                onPress={handleGeneratePDF}
              >
                <LinearGradient
                  colors={['#6B7280', '#4B5563']}
                  style={styles.pdfGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.pdfButtonText}>PDF</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Done Button */}
              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <LinearGradient
                  colors={["#4F1CA9", "#350083"]}
                  style={styles.doneGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    maxHeight: "90%",
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  statusIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  body: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F1CA9",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  amountCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  rechargeAmount: {
    color: "#4F1CA9",
    fontWeight: "700",
  },
  commissionAmount: {
    color: "#10B981",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4F1CA9",
  },
  balanceCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#065F46",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#065F46",
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    marginBottom: 80,
    flexWrap: "wrap",
  },
  supportText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 6,
  },
  supportEmail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom:60
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  pdfButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  pdfGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  doneButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  doneGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});