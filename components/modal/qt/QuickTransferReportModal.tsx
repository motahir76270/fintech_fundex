// components/QuickTransferReportModal.tsx
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



interface QuickTransferReportModalProps {
  visible: boolean;
  onClose: () => void;
  transactionData: any ;
}

export default function QuickTransferReportModal({
  visible,
  onClose,
  transactionData,
}: QuickTransferReportModalProps) {
  const qtData = transactionData?.data?.qtData;
  const closingBalance = transactionData?.closing;

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toFixed(2)}`;
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
    const status = qtData?.status || "UNKNOWN";
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quick Transfer Report</title>
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
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }
          .info-text {
            font-size: 13px;
            color: #6b7280;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="status-icon">
              ${status === "SUCCESS" ? "✓" : status === "PENDING" ? "⏰" : "✗"}
            </div>
            <h1>Quick Transfer ${statusText}</h1>
            <p style="opacity: 0.9;">${qtData?.item1 || "Quick Transfer"}</p>
          </div>

          <div class="transaction-id">
            <div class="transaction-id-label">Transaction ID / RRN</div>
            <div class="transaction-id-value">${qtData?.txnid || "N/A"} / ${qtData?.rrn || "N/A"}</div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="detail-row">
              <span class="detail-label">Beneficiary Name</span>
              <span class="detail-value">${qtData?.name || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${qtData?.account || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">IFSC Code</span>
              <span class="detail-value">${qtData?.ifsc || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Amount</span>
              <span class="detail-value amount-value">${formatAmount(qtData?.amount1 || 0)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${qtData?.item2 || "Charge"}</span>
              <span class="detail-value">${formatAmount(qtData?.amount2 || 0)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Amount</span>
              <span class="detail-value amount-value">${formatAmount(qtData?.total || 0)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Date</span>
              <span class="detail-value">${qtData?.date || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="status-badge">${qtData?.status || "N/A"}</span>
            </div>
          </div>

          <div class="balance-card">
            <span class="balance-label">Closing Balance</span>
            <span class="balance-value">${formatAmount(closingBalance || 0)}</span>
          </div>

          <div class="footer">
            <p>For support: ${qtData?.support || "support@example.com"}</p>
            <p>✨ Generated on: ${new Date().toLocaleString()}</p>
            <p>Thank you for using our service</p>
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
          dialogTitle: "Share Quick Transfer Report",
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
              getStatusColor(qtData?.status || ""),
              getStatusColor(qtData?.status || ""),
            ]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={getStatusIcon(qtData?.status || "")}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.title}>
                Quick Transfer {getStatusText(qtData?.status || "")}
              </Text>
              <Text style={styles.subtitle}>
                {qtData?.item1 || "Quick Transfer"}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Transaction ID and RRN */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Feather name="hash" size={18} color="#6B7280" />
                <Text style={styles.infoLabel}>Transaction ID</Text>
                <Text style={styles.infoValue}>{qtData?.txnid || "N/A"}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Feather name="credit-card" size={18} color="#6B7280" />
                <Text style={styles.infoLabel}>RRN</Text>
                <Text style={styles.infoValue}>{qtData?.rrn || "N/A"}</Text>
              </View>
            </View>

            {/* Transaction Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>

              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Beneficiary Name</Text>
                  <Text style={styles.detailValue}>{qtData?.name || "N/A"}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailValue}>{qtData?.account || "N/A"}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IFSC Code</Text>
                  <Text style={styles.detailValue}>{qtData?.ifsc || "N/A"}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Amount</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    {formatAmount(qtData?.amount1 || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{qtData?.item2 || "Charge"}</Text>
                  <Text style={styles.detailValue}>
                    {formatAmount(qtData?.amount2 || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    {formatAmount(qtData?.total || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Date</Text>
                  <Text style={styles.detailValue}>{qtData?.date || "N/A"}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(qtData?.status || "") + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(qtData?.status || "") },
                      ]}
                    >
                      {qtData?.status || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Balance Information */}
            <View style={styles.section}>
              <View style={styles.balanceCard}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Closing Balance</Text>
                  <Text style={styles.balanceValue}>
                    {formatAmount(closingBalance || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Support Information */}
            <View style={styles.supportCard}>
              <Feather name="mail" size={16} color="#6B7280" />
              <Text style={styles.supportText}>For support: {qtData?.support || "support@example.com"}</Text>
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
                  <Ionicons name="share-outline" size={24} color="black" />
                  <Text style={styles.pdfButtonText}>Share</Text>
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
    paddingVertical: 4,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
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
  amountText: {
    color: "#4F1CA9",
    fontWeight: "700",
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
  balanceCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 12,
  },
  balanceRow: {
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  supportText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 60,
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