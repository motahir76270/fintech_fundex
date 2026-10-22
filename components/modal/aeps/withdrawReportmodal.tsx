import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface BalanceReportModalProps {
  visible: boolean;
  onClose: () => void;
  data: any;
  isLoading?: boolean;
  theme: any;
}

export const WithdrawReportmodal: React.FC<BalanceReportModalProps> = ({
  visible,
  onClose,
  data,
  isLoading = false,
  theme,
}) => {
  // Safely parse the response data
  let resData = null;
  
  try {
    if (
      data?.data?.receiptData?.response &&
      typeof data.data.receiptData.response === "string"
    ) {
      resData = JSON.parse(data.data.receiptData.response);
    } else if (data?.data?.receiptData?.response) {
      resData = data.data.receiptData.response;
    }else{
      resData = data
    }
  } catch (error) {
    console.error("Error parsing response:", error);
  }

  // Determine transaction status from response
  const isTransactionSuccessful = data?.data?.receiptData?.status === "SUCCESS";
  const statusMessage = resData?.status || data?.data?.receiptData?.message || "Unknown error";

  // Extract data from response
  const transactionData = resData?.data || {};
  const externalRef = transactionData?.externalRef || data?.data?.receiptData?.txnid;
  const bankName = transactionData?.bankName || data?.data?.receiptData?.bank;
  const accountNumber = transactionData?.accountNumber || data?.data?.receiptData?.aadhar;
  const transactionValue = transactionData?.transactionValue || data?.data?.receiptData?.txnamount;

  // Function to generate PDF HTML
  const generatePDFHTML = () => {
    const isSuccess = data?.data?.receiptData?.status === "SUCCESS";
    const statusColor = isSuccess ? "#22C55E" : "#EF4444";
    const statusText = isSuccess ? "SUCCESSFUL" : "FAILED";
    const statusMsg = resData?.status || data?.data?.receiptData?.message || "N/A";

    const amount = transactionValue || data?.data?.receiptData?.txnamount || "0.00";
    const txnId = externalRef || "N/A";
    const dateTime = data?.data?.receiptData?.date || resData?.timestamp || new Date().toLocaleString();
    const mobile = data?.data?.receiptData?.mobile || "N/A";
    const bank = bankName || "N/A";
    const account = accountNumber || "N/A";;
    const transactionMode = transactionData?.transactionMode || "N/A";
    const support = data?.data?.receiptData?.support || "support@example.com";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
        <title>Withdrawal Report</title>
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
          .amount {
            font-size: 20px;
            color: #3b82f6;
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
            <h1>🏦 Withdrawal Report</h1>
            <div class="status-badge">${statusText}</div>
          </div>

          <div class="section">
            <div class="section-title">💰 Transaction Details</div>
            <div class="info-row">
              <div class="label">Status</div>
              <div class="value">${statusMsg}</div>
            </div>
            <div class="info-row">
              <div class="label">Transaction Amount</div>
              <div class="value amount">₹${amount}</div>
            </div>
            <div class="info-row">
              <div class="label">Transaction ID</div>
              <div class="value">${txnId}</div>
            </div>
            <div class="info-row">
              <div class="label">Date & Time</div>
              <div class="value">${dateTime}</div>
            </div>
            <div class="info-row">
              <div class="label">Mobile Number</div>
              <div class="value">${mobile}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏦 Account Details</div>
            <div class="info-row">
              <div class="label">Bank Name</div>
              <div class="value">${bank}</div>
            </div>
            <div class="info-row">
              <div class="label">Account Number</div>
              <div class="value">${account}</div>
            </div>
            <div class="info-row">
              <div class="label">Transaction Mode</div>
              <div class="value">${transactionMode}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">💵 Balance Details</div>
            <div class="info-row">
              <div class="label">Transaction Amount</div>
              <div class="value">₹${amount}</div>
            </div>
          </div>

          <div class="footer">
            <p>For support, contact: ${support}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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
          dialogTitle: "Share Withdrawal Report",
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

  const renderInfoRow = (
    label: string,
    value: string | number,
    icon: string,
  ) => {
    if (
      !value ||
      value === "NA" ||
      value === "null" ||
      value === null ||
      value === ""
    )
      return null;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={theme.primary}
          style={{ width: 30 }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.textLight,
              marginBottom: 4,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.text,
            }}
          >
            {value}
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
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
            minHeight: "60%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={
                  isTransactionSuccessful ? "checkmark-circle" : "alert-circle"
                }
                size={28}
                color={isTransactionSuccessful ? theme.success : theme.error}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: theme.text,
                  marginLeft: 12,
                }}
              >
                Withdrawal Report
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {!isLoading && data && (
                <TouchableOpacity
                  onPress={handleGeneratePDF}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={{ marginTop: 16, color: theme.textLight }}>
                Loading report...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              {/* Transaction Details */}
              {(externalRef ||
                transactionValue ||
                data?.data?.receiptData?.date) && (
                <View
                  style={{
                    backgroundColor: theme.inputBg,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: theme.text,
                      marginBottom: 12,
                    }}
                  >
                    Transaction Details
                  </Text>

                  {renderInfoRow(
                    "Status",
                    statusMessage,
                    "information-circle-outline",
                  )}
                  {renderInfoRow(
                    "Transaction Amount",
                    transactionValue || data?.data?.receiptData?.txnamount,
                    "cash-outline",
                  )}
                  {renderInfoRow(
                    "Transaction ID",
                    externalRef,
                    "receipt-outline",
                  )}
                  {renderInfoRow(
                    "Date & Time",
                    data?.data?.receiptData?.date || resData?.timestamp,
                    "calendar-outline",
                  )}
                  {renderInfoRow(
                    "Mobile Number",
                    data?.data?.receiptData?.mobile,
                    "call-outline",
                  )}
                </View>
              )}

              {/* Account Details */}
              {(bankName || accountNumber) && (
                <View
                  style={{
                    backgroundColor: theme.inputBg,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: theme.text,
                      marginBottom: 12,
                    }}
                  >
                    Account Details
                  </Text>

                  {renderInfoRow("Bank Name", bankName, "business-outline")}
                  {renderInfoRow(
                    "Account Number",
                    accountNumber,
                    "person-outline",
                  )}
                  {renderInfoRow(
                    "Bank Account Balance",
                    transactionData?.bankAccountBalance,
                    "business-outline",
                  )}
                  {renderInfoRow(
                    "IPay ID",
                    transactionData?.ipayId || data?.data?.receiptData?.uid,
                    "card-outline",
                  )}
                  {renderInfoRow(
                    "Transaction Mode",
                    transactionData?.transactionMode,
                    "swap-horizontal-outline",
                  )}
                </View>
              )}

              {/* Support Info */}
              <View
                style={{
                  backgroundColor: theme.inputBg,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text
                  style={{ marginLeft: 12, color: theme.textLight, flex: 1 }}
                >
                  For support, contact:{" "}
                  {data?.data?.receiptData?.support || "support@example.com"}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: Platform.OS === "ios" ? 80 : 80 }}>
                {/* PDF Button */}
                <TouchableOpacity
                  onPress={handleGeneratePDF}
                  style={{
                    flex: 1,
                    backgroundColor: theme.inputBg,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginTop: 4,
                    }}
                  >
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
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.textWhite,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
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