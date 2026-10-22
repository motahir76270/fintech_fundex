import * as IntentLauncher from "expo-intent-launcher";
import { useState } from "react";
import { Alert, Platform } from "react-native";

interface FacePayload {
  dsrno: string;
  pidDataType: string;
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
  sysid: any;
  ts: any;
}

interface IntentResponse {
  resultCode?: number;
  data?: string;
  extra?: {
    response?: string;
    [key: string]: any;
  };
}

const useFaceCapture = () => {
  const [loading, setLoading] = useState(false);

  const parseFaceResponse = (
    responseData: IntentResponse,
  ): FacePayload | null => {
    try {
      const xmlString = responseData?.extra?.response;

      if (!xmlString) {
        throw new Error("No response data found");
      }

      const extractAttribute = (tag: string, attr: string): string => {
        const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`);
        const match = xmlString.match(regex);
        return match ? match[1] : "";
      };

      const extractTagContent = (tag: string): string => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
        const match = xmlString.match(regex);
        return match ? match[1].trim() : "";
      };

      const extractParamValue = (name: string): string => {
        const paramRegex = new RegExp(
          `<Param\\s+name=["']${name}["']\\s+value=["']([^"']+)["']\\s*\\/?>`,
        );
        const match = xmlString.match(paramRegex);
        return match ? match[1] : "";
      };

      const extractSessionKey = (): string => {
        const regex = /<Skey[^>]*>([\s\S]*?)<\/Skey>/;
        const match = xmlString.match(regex);
        
        return match ? match[1].trim() : "";
      };

      const extractPidData = (): string => {
        const dataContent = extractTagContent("Data");
        if (dataContent) return dataContent;
        return "";
      };

      const errorCode = parseInt(extractAttribute("Resp", "errCode") || "0");
      const errInfo = extractAttribute("Resp", "errInfo") || "";

      const result: any = {
        dsrno: extractParamValue("dsrno") || extractParamValue("txnId") || "",
        pidDataType: "X",
        pidData: extractPidData(),
        ci: extractAttribute("Skey", "ci") || "",
        dc: extractAttribute("DeviceInfo", "dc") || "",
        dpId: extractAttribute("DeviceInfo", "dpId") || "",
        errorCode: errorCode,
        fCount: parseInt(extractAttribute("Resp", "fCount") || "0"),
        fType: parseInt(extractAttribute("Resp", "fType") || "2"),
        hmac: extractTagContent("Hmac") || "",
        mc: extractAttribute("DeviceInfo", "mc") || "",
        mi: extractAttribute("DeviceInfo", "mi") || "",
        nmPoints: parseInt(extractAttribute("Resp", "nmPoints") || "0"),
        qScore: extractAttribute("Resp", "qScore") || "-1",
        rdsId: extractAttribute("DeviceInfo", "rdsId") || "",
        rdsVer: extractAttribute("DeviceInfo", "rdsVer") || "",
        sessionKey: extractSessionKey(),
        errorInfo: errInfo || (errorCode === 0 ? "Success" : "Failed"),
        sysid: null,
        ts: null,
      };

      return result;
    } catch (error) {
      console.error("Parse error:", error);
      return null;
    }
  };

  const captureFace = async (): Promise<FacePayload | null> => {
    if (Platform.OS !== "android") {
      Alert.alert("Error", "Face capture is only available on Android");
      return null;
    }

    setLoading(true);

    try {
      const facePidOptions = `<?xml version='1.0' encoding='UTF-8'?>
<PidOptions ver='1.0' env='P'>
  <Opts fCount='0' fType='2' iCount='0' iType='' pCount='0' pType='' format='0' pidVer='2.0' timeout='60000' opt=''  wadh='' posh='UNKNOWN' />
  <CustOpts>
    <Param name='txnId' value='${Date.now()}'/>
    <Param name='purpose' value='auth'/>
    <Param name='language' value='en'/>
  </CustOpts>
</PidOptions>`;

      const result = await IntentLauncher.startActivityAsync(
        "in.gov.uidai.rdservice.face.CAPTURE",
        {
          packageName: "in.gov.uidai.facerd",
          extra: {
            request: facePidOptions,
          },
        },
      );

      const parsedData = parseFaceResponse(result as IntentResponse);

      if (parsedData) {
        if (parsedData.errorCode === 0) {
          console.log("Face capture successful");
          return parsedData;
        } else {
          Alert.alert("Error", `Face capture failed: ${parsedData.errorInfo}`);
          return null;
        }
      }

      Alert.alert("Error", "Failed to parse face capture data");
      return null;
    } catch (error: any) {
      console.error("Face capture error:", error);
      Alert.alert("Error", "Failed to capture face: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { captureFace, loading };
};

export default useFaceCapture;
export type { FacePayload };

