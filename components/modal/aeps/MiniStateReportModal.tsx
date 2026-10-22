import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface MiniStatementReportModalProps {
  visible: boolean;
  onClose: () => void;
  data: any;
  isLoading?: boolean;
  theme: any;
}

export const MiniStatementReportModal: React.FC<
  MiniStatementReportModalProps
> = ({ visible, onClose, data, isLoading = false, theme }) => {
  // Extract the receipt data from the nested structure
  const receiptData = data?.data?.receiptData || data?.receiptData || data;

  // Parse the response string if it exists
  let parsedResponse = null;
  if (receiptData?.response && typeof receiptData.response === "string") {
    try {
      parsedResponse = JSON.parse(receiptData.response);
    } catch (error) {
      console.error("Error parsing response:", error);
    }
  }

  // Extract values from receiptData (use actual data structure)
  const transactionStatus = receiptData?.status || "FAILED";
  const isSuccess = transactionStatus === "SUCCESS";

  // Get values from receiptData - using correct field names from your data
  const transactionAmount = receiptData?.amount || receiptData?.txnamount || 0;
  const rrn = receiptData?.rrn || "-";
  const date = receiptData?.date || "-";
  const bankName = receiptData?.bank || "-";
  const accountNumber = receiptData?.aadhar || "-";
  const mobileNumber = receiptData?.mobile || "-";
  const message = receiptData?.message || "No message";
  const support = receiptData?.support || "-";
  const txnId = receiptData?.txnid || "-";
  const transactionType = receiptData?.type || "-";

  // Get mini statement data from receiptData
  let miniStatementData = receiptData?.ministatement || [];

  // Also check parsed response for mini statement
  if (
    (!miniStatementData || miniStatementData.length === 0) &&
    parsedResponse?.data?.miniStatement
  ) {
    miniStatementData = parsedResponse.data.miniStatement;
  }

  // Get parsed response data for additional info
  const parsedData = parsedResponse?.data || {};
  const errorStatus = parsedResponse?.status || "";
  const errorCode = parsedResponse?.statuscode || "";
  const environment = parsedResponse?.environment || "";
  const ipayUuid = parsedResponse?.ipay_uuid || "";
  const orderId = parsedResponse?.orderid || "";
  const bankAccountBalance =
    parsedData?.bankAccountBalance || receiptData?.amount;

  // Format date for better display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
    if (dateStr.includes("/") && dateStr.length < 10) {
      return dateStr;
    }
    try {
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      // Return original if parsing fails
    }
    return dateStr;
  };

  // Format transaction amount with sign
  const formatTransactionAmount = (amount: string, narration: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return `₹${amount}`;

    const isCredit = narration?.includes("C") && !narration?.includes("D");
    const isDebit = narration?.includes("D") && !narration?.includes("C");

    if (isCredit) {
      return `+ ₹${numAmount.toFixed(2)}`;
    } else if (isDebit) {
      return `- ₹${numAmount.toFixed(2)}`;
    }
    return `₹${numAmount.toFixed(2)}`;
  };

  // Get color for transaction amount
  const getTransactionColor = (narration: string, theme: any) => {
    const isCredit = narration?.includes("C") && !narration?.includes("D");
    const isDebit = narration?.includes("D") && !narration?.includes("C");

    if (isCredit) return "#10b981";
    if (isDebit) return "#ef4444";
    return theme.text;
  };

  // Generate PDF HTML
  const generatePDFHTML = () => {
    const balanceAmount = typeof bankAccountBalance === "number" 
      ? bankAccountBalance.toFixed(2) 
      : bankAccountBalance || "0.00";

    // Generate transactions HTML
    let transactionsHTML = "";
    if (miniStatementData && miniStatementData.length > 0) {
      miniStatementData.forEach((transaction: any, index: number) => {
        const amount = transaction.amount || "0";
        const txnType = transaction.txnType || "";
        const narration = transaction.narration || "";
        const transDate = transaction.date || "";
        const formattedAmount = formatTransactionAmount(amount, narration);
        const amountColor = getTransactionColor(narration, theme);
        
        transactionsHTML += `
          <div class="transaction-item">
            <div class="transaction-header">
              <span class="transaction-date">${formatDate(transDate)}</span>
              <span class="transaction-amount" style="color: ${amountColor}">${formattedAmount}</span>
            </div>
            <div class="transaction-type">${txnType}</div>
            <div class="transaction-narration">${narration}</div>
            ${index < miniStatementData.length - 1 ? '<hr class="transaction-divider"/>' : ''}
          </div>
        `;
      });
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mini Statement Report</title>
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
            background-color: ${isSuccess ? '#22C55E15' : '#EF444415'};
            color: ${isSuccess ? '#22C55E' : '#EF4444'};
            font-weight: bold;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 8px;
          }
          .balance-card {
            background-color: #3b82f610;
            border: 1px solid #3b82f630;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 24px;
          }
          .balance-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .balance-amount {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
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
          .transaction-item {
            margin-bottom: 16px;
            padding-bottom: 12px;
          }
          .transaction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .transaction-date {
            font-size: 12px;
            color: #6b7280;
            font-family: monospace;
          }
          .transaction-amount {
            font-size: 14px;
            font-weight: 600;
          }
          .transaction-type {
            font-size: 13px;
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .transaction-narration {
            font-size: 11px;
            color: #6b7280;
            line-height: 16px;
          }
          .transaction-divider {
            margin: 12px 0;
            border: none;
            border-top: 1px solid #e5e7eb;
          }
          .error-section {
            background-color: #fee2e2;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .error-title {
            font-size: 14px;
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }
          .no-data {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Mini Statement Report</h1>
            <div class="status-badge">${transactionStatus}</div>
          </div>

          ${bankAccountBalance ? `
          <div class="balance-card">
            <div class="balance-label">Available Balance</div>
            <div class="balance-amount">₹${balanceAmount}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">💰 Transaction Details</div>
            <div class="info-row">
              <div class="label">Transaction ID</div>
              <div class="value">${txnId}</div>
            </div>
            <div class="info-row">
              <div class="label">RRN / Order ID</div>
              <div class="value">${rrn || orderId}</div>
            </div>
            <div class="info-row">
              <div class="label">Date & Time</div>
              <div class="value">${formatDate(date)}</div>
            </div>
            <div class="info-row">
              <div class="label">Transaction Type</div>
              <div class="value">${transactionType}</div>
            </div>
            ${transactionAmount !== 0 && transactionAmount !== "0" ? `
            <div class="info-row">
              <div class="label">Transaction Amount</div>
              <div class="value">₹${transactionAmount}</div>
            </div>
            ` : ''}
            ${message && message !== "NA" && message !== "-" ? `
            <div class="info-row">
              <div class="label">Message</div>
              <div class="value">${message}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">🏦 Account Details</div>
            <div class="info-row">
              <div class="label">Mobile Number</div>
              <div class="value">${mobileNumber}</div>
            </div>
            <div class="info-row">
              <div class="label">Account Number</div>
              <div class="value">${accountNumber}</div>
            </div>
            <div class="info-row">
              <div class="label">Bank Name</div>
              <div class="value">${bankName}</div>
            </div>
            ${parsedData?.ipayId ? `
            <div class="info-row">
              <div class="label">IPay ID</div>
              <div class="value">${parsedData.ipayId}</div>
            </div>
            ` : ''}
          </div>

          ${miniStatementData && miniStatementData.length > 0 ? `
          <div class="section">
            <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span>📋 Transaction History</span>
              <span style="font-size: 12px; font-weight: normal;">${miniStatementData.length} transactions</span>
            </div>
            ${transactionsHTML}
          </div>
          ` : `
          <div class="section">
            <div class="no-data">
              <p>No transactions found</p>
              <p style="font-size: 12px; margin-top: 8px;">Unable to fetch mini statement</p>
            </div>
          </div>
          `}

          ${!isSuccess && errorCode === "ERR" ? `
          <div class="error-section">
            <div class="error-title">⚠️ Error Details</div>
            <div class="info-row">
              <div class="label">Status Code</div>
              <div class="value">${errorCode}</div>
            </div>
            <div class="info-row">
              <div class="label">Error Message</div>
              <div class="value">${errorStatus}</div>
            </div>
            ${environment ? `
            <div class="info-row">
              <div class="label">Environment</div>
              <div class="value">${environment}</div>
            </div>
            ` : ''}
            ${ipayUuid ? `
            <div class="info-row">
              <div class="label">UUID</div>
              <div class="value" style="font-size: 10px; font-family: monospace;">${ipayUuid}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${support && support !== "-" ? `
          <div class="footer">
            <p>📧 For support, contact: ${support}</p>
            <p>✨ Generated on: ${new Date().toLocaleString()}</p>
            <p>Thank you for banking with us</p>
          </div>
          ` : `
          <div class="footer">
            <p>✨ Generated on: ${new Date().toLocaleString()}</p>
            <p>Thank you for banking with us</p>
          </div>
          `}
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
          dialogTitle: "Share Mini Statement",
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
      value === "" ||
      value === null ||
      value === "-"
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

  const renderStatusBadge = (status: string) => {
    const isSuccessStatus = status?.toUpperCase() === "SUCCESS";
    const bgColor = isSuccessStatus ? theme.successBg : theme.errorBg;
    const textColor = isSuccessStatus ? theme.success : theme.error;

    return (
      <View
        style={{
          backgroundColor: bgColor,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          alignSelf: "flex-start",
        }}
      >
        <Text
          style={{
            color: textColor,
            fontWeight: "600",
            fontSize: 12,
          }}
        >
          {status || "FAILED"}
        </Text>
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
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Ionicons
                name={isSuccess ? "document-text" : "alert-circle"}
                size={28}
                color={isSuccess ? theme.success : theme.error}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: theme.text,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Mini Statement
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* PDF Button */}
              {!isLoading && data && (
                <TouchableOpacity
                  onPress={handleGeneratePDF}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={theme.primary}
                  />
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
                Loading mini statement...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            >
              {/* Status Section */}
              <View
                style={{
                  backgroundColor: theme.inputBg,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textLight }}>
                    Transaction Status
                  </Text>
                  {renderStatusBadge(transactionStatus)}
                </View>
                {message && message !== "NA" && message !== "-" && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: !isSuccess ? theme.error : theme.success,
                      marginTop: 12,
                      fontWeight: "500",
                    }}
                  >
                    {message}
                  </Text>
                )}
              </View>

              {/* Account Balance */}
              {bankAccountBalance && (
                <View
                  style={{
                    backgroundColor: theme.primary + "10",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: theme.primary + "30",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textLight,
                      marginBottom: 4,
                    }}
                  >
                    Available Balance
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      color: theme.primary,
                    }}
                  >
                    ₹
                    {typeof bankAccountBalance === "number"
                      ? bankAccountBalance.toFixed(2)
                      : bankAccountBalance}
                  </Text>
                </View>
              )}

              {/* Transaction Details */}
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

                {renderInfoRow("Transaction ID", txnId, "receipt-outline")}
                {renderInfoRow(
                  "RRN / Order ID",
                  rrn || orderId,
                  "qr-code-outline",
                )}
                {renderInfoRow(
                  "Date & Time",
                  formatDate(date),
                  "calendar-outline",
                )}
                {renderInfoRow(
                  "Transaction Type",
                  transactionType,
                  "swap-horizontal-outline",
                )}
                {transactionAmount !== 0 &&
                  transactionAmount !== "0" &&
                  renderInfoRow(
                    "Transaction Amount",
                    `₹${transactionAmount}`,
                    "cash-outline",
                  )}
              </View>

              {/* Account Details */}
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

                {renderInfoRow("Mobile Number", mobileNumber, "call-outline")}
                {renderInfoRow("Aadhar Number", accountNumber, "card-outline")}
                {renderInfoRow("Bank Name", bankName, "business-outline")}
                {parsedData?.ipayId &&
                  renderInfoRow(
                    "IPay ID",
                    parsedData.ipayId,
                    "id-card-outline",
                  )}
                {parsedData?.operatorId &&
                  renderInfoRow(
                    "Operator ID",
                    parsedData.operatorId,
                    "person-outline",
                  )}
              </View>

              {/* Mini Statement Transactions */}
              {miniStatementData && miniStatementData.length > 0 && (
                <View
                  style={{
                    backgroundColor: theme.inputBg,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: theme.text,
                      }}
                    >
                      Transaction History
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textLight }}>
                      {miniStatementData.length} transactions
                    </Text>
                  </View>

                  {miniStatementData.map((transaction: any, index: number) => {
                    const amount = transaction.amount || "0";
                    const txnType = transaction.txnType || "";
                    const narration = transaction.narration || "";
                    const transDate = transaction.date || "";
                    const amountColor = getTransactionColor(narration, theme);
                    const formattedAmount = formatTransactionAmount(
                      amount,
                      narration,
                    );

                    return (
                      <View
                        key={index}
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth:
                            index < miniStatementData.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.textLight,
                              fontSize: 12,
                              fontFamily:
                                Platform.OS === "ios" ? "Menlo" : "monospace",
                            }}
                          >
                            {formatDate(transDate)}
                          </Text>
                          <Text
                            style={{
                              color: amountColor,
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {formattedAmount}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 13,
                            marginBottom: 4,
                            fontWeight: "500",
                          }}
                        >
                          {txnType}
                        </Text>
                        <Text
                          style={{
                            color: theme.textLight,
                            fontSize: 11,
                            lineHeight: 16,
                          }}
                        >
                          {narration}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* No Transactions Message */}
              {(!miniStatementData || miniStatementData.length === 0) && (
                <View
                  style={{
                    backgroundColor: theme.inputBg,
                    borderRadius: 16,
                    padding: 40,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={theme.textLight}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: theme.textLight,
                      marginTop: 12,
                      textAlign: "center",
                    }}
                  >
                    No transactions found
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textLight,
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    Unable to fetch mini statement
                  </Text>
                </View>
              )}

              {/* Error Details for Failed Transaction */}
              {!isSuccess && errorCode === "ERR" && (
                <View
                  style={{
                    backgroundColor: theme.errorBg,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name="bug-outline"
                      size={20}
                      color={theme.error}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: theme.error,
                        marginLeft: 8,
                      }}
                    >
                      Error Details
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textLight,
                      marginBottom: 4,
                    }}
                  >
                    Status Code: {errorCode}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textLight,
                      marginBottom: 4,
                    }}
                  >
                    Error Message: {errorStatus}
                  </Text>
                  {environment && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textLight,
                        marginBottom: 4,
                      }}
                    >
                      Environment: {environment}
                    </Text>
                  )}
                  {ipayUuid && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: theme.textLight,
                        fontFamily: "monospace",
                        marginTop: 4,
                      }}
                    >
                      UUID: {ipayUuid}
                    </Text>
                  )}
                </View>
              )}

              {/* Support Info */}
              {support && support !== "-" && (
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
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text
                    style={{ marginLeft: 12, color: theme.textLight, flex: 1 }}
                  >
                    For support, contact: {support}
                  </Text>
                </View>
              )}

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