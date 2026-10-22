import * as IntentLauncher from "expo-intent-launcher";
import { useState } from "react";
import { Alert } from "react-native";
// import { useSelector } from "react-redux";

interface FingerprintPayload {
  dsrno: string;
  pidType: string;
  pidData: string;
  ci: string;
  dc: string;
  dpId: string;
  errorCode: number;
  fCount: number;
  fType: number;
  hmac: string;
  mc: string;
  mi: string;
  nmPoints: number;
  qScore: string;
  rdsId: string;
  rdsVer: string;
  sessionKey: string;
  errorInfo: string;
}

interface IntentResponse {
  resultCode?: number;
  data?: string;
  extra?: {
    PID_DATA?: string;
    [key: string]: any;
  };
}

const useFingerprintCapture = () => {
  const [loading, setLoading] = useState(false);

  // const AepsOtp = useSelector((state:any) => state.aeps.aepsOtp)

  const parseFingerprintResponse = (
    responseData: IntentResponse,
  ): FingerprintPayload | null => {
    try {
      const xmlString = responseData?.extra?.PID_DATA;

      if (!xmlString) {
        throw new Error("No PID_DATA found");
      }

      const extractAttribute = (tag: string, attr: string): string => {
        const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`);
        const match = xmlString.match(regex);
        return match ? match[1] : "";
      };

      const extractTagContent = (tag: string): string => {
        // Fixed to handle tags with attributes
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
        const match = xmlString.match(regex);
        return match ? match[1].trim() : "";
      };

      const extractSrno = (): string => {
        const paramRegex =
          /<Param\s+name=["']srno["']\s+value=["']([^"']+)["']\s*\/?>/;
        const match = xmlString.match(paramRegex);
        return match ? match[1] : "";
      };

      const extractSessionKey = (): string => {
        // Extract the text content between <Skey> and </Skey> tags (with or without attributes)
        const regex = /<Skey[^>]*>([\s\S]*?)<\/Skey>/;
        const match = xmlString.match(regex);
        return match ? match[1].trim() : "";
      };

      const extractPidData = (): string => {
        const dataContent = extractTagContent("Data");
        if (dataContent) return dataContent;

        const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/;
        const cdataMatch = xmlString.match(cdataRegex);
        if (cdataMatch) return cdataMatch[1];

        return extractTagContent("PidData") || "";
      };

      const errCode = parseInt(extractAttribute("Resp", "errCode") || "0");
      const errInfo = extractAttribute("Resp", "errInfo") || "";

      // pidType: extractAttribute('Data', 'type') || 'X',
      // Create base result object
      const result: FingerprintPayload = {
        dsrno: extractSrno() || extractAttribute("DeviceInfo", "srno") || "",
        pidType: "X",
        pidData: extractPidData(),
        ci: extractAttribute("Skey", "ci") || "",
        dc: extractAttribute("DeviceInfo", "dc") || "",
        dpId: extractAttribute("DeviceInfo", "dpId") || "",
        errorCode: errCode,
        fCount: parseInt(extractAttribute("Resp", "fCount") || "2"),
        fType: parseInt(extractAttribute("Resp", "fType") || "2"),
        hmac: extractTagContent("Hmac") || "",
        mc: extractAttribute("DeviceInfo", "mc") || "",
        mi: extractAttribute("DeviceInfo", "mi") || "",
        nmPoints: parseInt(extractAttribute("Resp", "nmPoints") || "0"),
        qScore: extractAttribute("Resp", "qScore") || "50",
        rdsId: extractAttribute("DeviceInfo", "rdsId") || "",
        rdsVer: extractAttribute("DeviceInfo", "rdsVer") || "",
        sessionKey: extractSessionKey(),
        errorInfo: errInfo || "Success",
      };

      return result;
    } catch (error) {
      console.error("Parse error:", error);
      return null;
    }
  };

  const captureFingerprint = async (): Promise<FingerprintPayload | null> => {
    setLoading(true);

    try {
      const xmlData = `<?xml version='1.0' encoding='UTF-8'?>
<PidOptions ver='1.0' env='P' posh='UNKNOWN'>
  <Opts 
    fCount='1' 
    fType='2' 
    iCount='0' 
    iType='0' 
    pCount='0' 
    pType='0' 
    format='0' 
    pidVer='2.0' 
    timeout='60000' 
    wadh='' 
  />
</PidOptions>`;

      

      const res = await IntentLauncher.startActivityAsync(
        "in.gov.uidai.rdservice.fp.CAPTURE",
        {
          extra: { PID_OPTIONS: xmlData },
        },
      );

      const parsedData = parseFingerprintResponse(res as any);

      // console.log(res)

      if (parsedData) {
        return parsedData;
      }

      Alert.alert("Error", "Failed to parse fingerprint data");
      return null;
    } catch (error: any) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Fingerprint capture failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const captureFingerprintOTP = async (
    AepsOtp: any,
  ): Promise<FingerprintPayload | null> => {
    setLoading(true);

    try {
      const xmlData = `<?xml version='1.0' encoding='UTF-8'?>
<PidOptions ver='1.0' env='P' posh='UNKNOWN'>
  <Opts 
    fCount='1' 
    fType='2' 
    iCount='0' 
    iType='0' 
    pCount='0' 
    pType='0' 
    format='0' 
    pidVer='2.0' 
    timeout='60000' 
    ${AepsOtp ? `otp='${AepsOtp}'` : `otp=''`}
    wadh='' 
  />
</PidOptions>`;

      console.log(xmlData);

      const res = await IntentLauncher.startActivityAsync(
        "in.gov.uidai.rdservice.fp.CAPTURE",
        {
          extra: { PID_OPTIONS: xmlData },
        },
      );

      const parsedData = parseFingerprintResponse(res as any);

      // console.log(res)

      if (parsedData) {
        return parsedData;
      }

      Alert.alert("Error", "Failed to parse fingerprint data");
      return null;
    } catch (error: any) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Fingerprint capture failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    captureFingerprint,
    captureFingerprintOTP,
    loading,
  };
};

export default useFingerprintCapture;
export type { FingerprintPayload };
