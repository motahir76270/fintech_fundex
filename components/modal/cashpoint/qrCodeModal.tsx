// components/modal/cashpoint/qrCodeModal.tsx
import { checkPaymentStatusOfCashpointApiCall } from "@/hooks/servies/chasPointApi";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  BackHandler,
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  payloadData: any;
  qrData: any;
  title?: string;
  subtitle?: string;
  onCheckStatus?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const QR_SIZE = Math.min(260, SCREEN_WIDTH - 120);

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  payloadData,
  qrData,
  title = "Scan to Pay",
  subtitle,
  onCheckStatus,
}) => {
  const isDark = useColorScheme() === "dark";
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // --- Success animation values ---
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  // --- Countdown state ---
  // value.expiryTime is in MINUTES (e.g. 5 = 5 minutes)
  const expiryMinutes = Number(payloadData?.expiryTime) || 0;
  const totalSeconds = expiryMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [resData, setResData] = useState<any>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);

  // --- Refs to avoid stale closures / unnecessary effect re-runs ---
  const isCheckingRef = useRef(false);
  const showSuccessRef = useRef(false);

  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);

  useEffect(() => {
    showSuccessRef.current = showSuccess;
  }, [showSuccess]);

  // ---------- Success animation trigger ----------
  useEffect(() => {
    if (showSuccess) {
      circleScale.setValue(0);
      checkScale.setValue(0);
      successFade.setValue(0);

      Animated.sequence([
        Animated.timing(successFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(circleScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuccess]);

  // ---------- Check status handler (stable identity) ----------
  const handleCheckStatus = useCallback(async () => {
    if (isCheckingRef.current || showSuccessRef.current) return;

    try {
      setIsChecking(true);
      isCheckingRef.current = true;

      const date = new Date(Date.now());
      const formattedDate = date.toISOString().slice(0, 10);

      const payload = {
        clientRefId: qrData?.clientRefId,
        TxnDate: formattedDate,
      };

      const res = await checkPaymentStatusOfCashpointApiCall(payload);

      if (res?.status === "SUCCESS") {
        // Stop the countdown immediately
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setResData(res);
        setShowSuccess(true);
        showSuccessRef.current = true;
        onCheckStatus?.();
      } else {
        // Alert.alert(
        //   res?.status || "PENDING",
        //   res?.message || "Payment not completed yet"
        // );
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to check payment status");
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, [onCheckStatus, qrData?.clientRefId]);

  // Keep latest handler in a ref so countdown effect never needs to re-run
  const handleCheckStatusRef = useRef(handleCheckStatus);
  useEffect(() => {
    handleCheckStatusRef.current = handleCheckStatus;
  }, [handleCheckStatus]);

  // ---------- Resolve image URI ----------
  const buildQRImageUri = useCallback((val: any): string | null => {
    if (val === null || val === undefined) return null;

    const qrData: string =
      typeof val === "string"
        ? val
        : typeof val === "object"
        ? String(val?.qrData ?? val?.qrImage ?? val?.image ?? "")
        : String(val);

    const trimmed = qrData.trim();
    if (!trimmed) return null;

    if (trimmed.indexOf("data:image") === 0) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed.replace(/\s/g, "")}`;
  }, []);

  const qrImageUri = buildQRImageUri(qrData);

  // ---------- Measure natural size ----------
  const [qrNaturalSize, setQrNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!qrImageUri) {
      setQrNaturalSize(null);
      return;
    }

    let cancelled = false;

    Image.getSize(
      qrImageUri,
      (w, h) => {
        if (cancelled) return;
        if (w > 0 && h > 0) setQrNaturalSize({ width: w, height: h });
      },
      (err) => {
        if (cancelled) return;
        console.warn("[QRCodeModal] failed to load QR image:", err);
        setQrNaturalSize(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [qrImageUri]);

  const renderSize = (() => {
    if (!qrNaturalSize) return QR_SIZE;
    const { width, height } = qrNaturalSize;
    const scale = Math.min(QR_SIZE / width, QR_SIZE / height, 1);
    return Math.round(Math.min(width, height) * scale);
  })();

  // ---------- Countdown effect ----------
  useEffect(() => {
    // Reset everything when modal closes
    if (!visible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasTriggeredRef.current = false;
      setShowSuccess(false);
      showSuccessRef.current = false;
      setIsChecking(false);
      isCheckingRef.current = false;
      return;
    }

    // Don't start countdown if already success
    if (showSuccess) return;

    // Only reset secondsLeft when timer isn't already running
    // (prevents reset when effect re-runs due to showSuccess changes)
    if (intervalRef.current === null) {
      setSecondsLeft(totalSeconds);
      hasTriggeredRef.current = false;
    }

    if (totalSeconds <= 0) return;

    // If interval already running, don't create another one
    if (intervalRef.current !== null) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        // ✅ Call API every 60 seconds while counting down (60, 120, 180...)
        if (prev > 1 && prev % 60 === 0) {
          setTimeout(() => {
            handleCheckStatusRef.current?.();
          }, 0);
        }

        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // ✅ Trigger status check once when timer hits 0
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setTimeout(() => {
              handleCheckStatusRef.current?.();
            }, 0);
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // ⚠️ Intentionally excluding handleCheckStatus to prevent timer restart
  }, [visible, totalSeconds, showSuccess]);

  // ---------- Format mm:ss ----------
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isExpiringSoon = secondsLeft > 0 && secondsLeft <= 30;
  const isExpired = secondsLeft === 0 && !showSuccess;

  // ---------- Colors ----------
  const colors = {
    backdrop: "rgba(0,0,0,0.8)",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#0b1f26",
    subText: isDark ? "#94a3b8" : "#64748b",
    primaryButton: isDark ? "#0ea5b7" : "#350083",
    primaryButtonText: "#ffffff",
    secondaryButtonText: isDark ? "#7dd3fc" : "#350083",
    secondaryButtonBorder: isDark ? "#1e4d5c" : "#e5e7eb",
    border: isDark ? "#1e3a44" : "#eef2f6",
    qrBg: "#ffffff",
    badgeBg: isDark ? "rgba(14,165,183,0.15)" : "rgba(53,0,131,0.08)",
    badgeText: isDark ? "#5eead4" : "#350083",
    divider: isDark ? "#1e3a44" : "#f1f5f9",
    timerBg: isDark ? "rgba(14,165,183,0.12)" : "rgba(53,0,131,0.06)",
    timerText: isDark ? "#5eead4" : "#350083",
    timerWarningBg: "rgba(239,68,68,0.12)",
    timerWarningText: "#ef4444",
    expiredBg: "rgba(239,68,68,0.15)",
    expiredText: "#dc2626",
    // Success colors
    successBg: "#22c55e",
    successRing: "rgba(34,197,94,0.18)",
    successText: isDark ? "#4ade80" : "#16a34a",
    successBadgeBg: "rgba(34,197,94,0.15)",
  };

  // ---------- Entrance animation ----------
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // ---------- Block Android hardware back ----------
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => backHandler.remove();
  }, [visible]);

  // ---------- Timer colors ----------
  const timerBg = isExpired
    ? colors.expiredBg
    : isExpiringSoon
    ? colors.timerWarningBg
    : colors.timerBg;

  const timerTextColor = isExpired
    ? colors.expiredText
    : isExpiringSoon
    ? colors.timerWarningText
    : colors.timerText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {showSuccess ? (
            /* ==================== SUCCESS STATE ==================== */
            <Animated.View
              style={[styles.successContainer, { opacity: successFade }]}
            >
              {/* Animated success badge */}
              <View style={styles.successIconWrap}>
                {/* Outer pulsing ring */}
                <View
                  style={[
                    styles.successRingOuter,
                    { backgroundColor: colors.successRing },
                  ]}
                />
                {/* Green circle */}
                <Animated.View
                  style={[
                    styles.successCircle,
                    {
                      backgroundColor: colors.successBg,
                      transform: [{ scale: circleScale }],
                    },
                  ]}
                >
                  {/* Animated checkmark */}
                  <Animated.View
                    style={[
                      styles.checkWrapper,
                      { transform: [{ scale: checkScale }] },
                    ]}
                  >
                    <Ionicons name="checkmark" size={44} color="#dadada" />
                  </Animated.View>
                </Animated.View>
              </View>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.successBadgeBg, marginTop: 22 },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.successText }]}>
                  ✓ PAYMENT SUCCESSFUL
                </Text>
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                {resData?.statusDesc || "Payment Received"}
              </Text>

              <Text style={[styles.subtitle, { color: colors.subText }]}>
                Your payment has been completed successfully. You can close this
                window now.
              </Text>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.divider, marginTop: 22 },
                ]}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.successBg },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.primaryButtonText },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            /* ==================== QR STATE ==================== */
            <>
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[styles.badge, { backgroundColor: colors.badgeBg }]}
                >
                  <Text
                    style={[styles.badgeText, { color: colors.badgeText }]}
                  >
                    ⚡ SECURE PAYMENT
                  </Text>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.subText }]}>
                  {subtitle ||
                    "Open your payment app and scan the code below"}
                </Text>
              </View>

              {/* Timer pill */}
              {totalSeconds > 0 && (
                <View style={[styles.timerPill, { backgroundColor: timerBg }]}>
                  <Text
                    style={[styles.timerLabel, { color: timerTextColor }]}
                  >
                    {isExpired ? "EXPIRED" : "EXPIRES IN"}
                  </Text>
                  <Text
                    style={[styles.timerValue, { color: timerTextColor }]}
                  >
                    {formatTime(secondsLeft)}
                  </Text>
                </View>
              )}

              {/* QR area */}
              <Animated.View
                style={[
                  styles.qrOuterRing,
                  {
                    borderColor: colors.border,
                    opacity: isExpired ? 0.35 : 1,
                  },
                ]}
              >
                <View
                  style={[styles.qrWrapper, { backgroundColor: "#ffffff" }]}
                >
                  {qrImageUri ? (
                    <Image
                      source={{ uri: qrImageUri }}
                      style={{
                        width: renderSize,
                        height: renderSize,
                        backgroundColor: "#ffffff",
                      }}
                      resizeMode="stretch"
                      fadeDuration={0}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Text
                        style={[styles.emptyText, { color: colors.subText }]}
                      >
                        No QR data
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Hint */}
              <View style={styles.hintRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: colors.primaryButton },
                  ]}
                />
                <Text style={[styles.hint, { color: colors.subText }]}>
                  {isExpired
                    ? "QR expired — tap Check Payment Status"
                    : "Keep this screen open until payment completes"}
                </Text>
              </View>

              {/* Divider */}
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primaryButton,
                      opacity: isChecking ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleCheckStatus}
                  activeOpacity={0.85}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: colors.primaryButtonText, marginLeft: 8 },
                        ]}
                      >
                        Checking...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.primaryButtonText },
                      ]}
                    >
                      Check Payment Status
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.secondaryButtonBorder },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.secondaryButtonText },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default QRCodeModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: "96%",
    borderRadius: 6,
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 6,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
    gap: 8,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
  },
  qrOuterRing: {
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  qrWrapper: {
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: QR_SIZE + 24,
    minHeight: QR_SIZE + 24,
  },
  emptyState: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  hint: {
    fontSize: 11.5,
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 18,
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------- SUCCESS STATE STYLES ---------- */
  successContainer: {
    width: "100%",
    alignItems: "center",
  },
  successIconWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  successRingOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  checkWrapper: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "0deg" }],
  },
  // Short bar of the check (left)
  checkShort: {
    position: "absolute",
    width: 6,
    height: 16,
    backgroundColor: "#ffffff",
    borderTopStartRadius: 3,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    left: 10,
    top: 18,
    transform: [{ rotate: "-45deg" }],
  },
  // Long bar of the check (right)
  checkLong: {
    position: "absolute",
    width: 6,
    height: 28,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    right: 12,
    top: 8,
    transform: [{ rotate: "45deg" }],
  },
});