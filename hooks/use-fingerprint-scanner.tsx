import { useState } from 'react';
import { Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

interface FingerprintPayload {
  pid_data: string;
}

const useFingerprintCapture = () => {
  const [loading, setLoading] = useState(false);

  const captureFingerprint = async (): Promise<FingerprintPayload | null> => {
    setLoading(true);

    try {
      const xmlData = `<PidOptions ver="1.0">
        <Opts 
          fCount="1" 
          fType="2" 
          iCount="0" 
          pCount="0"
          format="0"
          pidVer="2.0"
          timeout="30000"
          posh="UNKNOWN"
          env="P" />
      </PidOptions>`;

      const res = await IntentLauncher.startActivityAsync(
        'in.gov.uidai.rdservice.fp.CAPTURE',
        {
          extra: { PID_OPTIONS: xmlData },
        }
      );
  
      
      let completeXmlData = (res as any)?.extra?.PID_DATA;
      
      
      if (!completeXmlData) {
        Alert.alert('Error', 'No fingerprint data received');
        return null;
      }

      if (completeXmlData.includes('errCode="') && !completeXmlData.includes('errCode="0"')) {
        const errorMatch = completeXmlData.match(/errInfo="([^"]*)"/);
        const errorMsg = errorMatch ? errorMatch[1] : 'Failed to capture fingerprint';
        Alert.alert('Fingerprint Error', errorMsg);
        return null;
      }

      // Transform to exact format with proper ordering and indentation
      const formattedXml = transformToExactFormat(completeXmlData);

      return {
        pid_data: formattedXml
      };
      
    } catch (error: any) {
      console.error('Capture error:', error);
      Alert.alert('RD Service Error', 'Please make sure RD Service app is installed on your device');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const transformToExactFormat = (xmlData: string): string => {
    // Parse the XML data to extract components
    const respMatch = xmlData.match(/<Resp\s+([^>]+)\/>/);
    const deviceInfoMatch = xmlData.match(/<DeviceInfo\s+([^>]+)>([\s\S]*?)<\/DeviceInfo>/);
    const skeyMatch = xmlData.match(/<Skey\s+([^>]+)>([^<]+)<\/Skey>/);
    const hmacMatch = xmlData.match(/<Hmac>([^<]+)<\/Hmac>/);
    const dataMatch = xmlData.match(/<Data\s+([^>]+)>([\s\S]*?)<\/Data>/);
    
    // Extract attributes
    const respAttrs = respMatch ? respMatch[1] : '';
    const deviceInfoAttrs = deviceInfoMatch ? deviceInfoMatch[1] : '';
    const deviceInfoContent = deviceInfoMatch ? deviceInfoMatch[2] : '';
    const skeyAttrs = skeyMatch ? skeyMatch[1] : '';
    const skeyValue = skeyMatch ? skeyMatch[2] : '';
    const hmacValue = hmacMatch ? hmacMatch[1] : '';
    const dataAttrs = dataMatch ? dataMatch[1] : '';
    const dataValue = dataMatch ? dataMatch[2] : '';
    
    // Format additional_info with proper indentation
    let formattedAdditionalInfo = '';
    if (deviceInfoContent) {
      const paramMatches = deviceInfoContent.matchAll(/<Param\s+name="([^"]+)"\s+value="([^"]+)"\s*\/>/g);
      const params = Array.from(paramMatches);
      
      if (params.length > 0) {
        formattedAdditionalInfo = '\n<additional_info>';
        params.forEach(param => {
          formattedAdditionalInfo += `\n<Param name="${param[1]}" value="${param[2]}"/>`;
        });
        formattedAdditionalInfo += '\n</additional_info>\n  ';
      }
    }
    
    // Build the formatted XML with exact structure
    let formatted = '<?xml version="1.0"?>\r\n';
    formatted += '<PidData>\r\n';
    formatted += `  <Resp ${respAttrs}/>\r\n`;
    formatted += `  <DeviceInfo ${deviceInfoAttrs}${formattedAdditionalInfo ? '>' : ''}`;
    
    if (formattedAdditionalInfo) {
      formatted += `${formattedAdditionalInfo}</DeviceInfo>\r\n`;
    } else {
      formatted += ' />\r\n';
    }
    
    formatted += `  <Skey ${skeyAttrs}>${skeyValue}</Skey>\r\n`;
    formatted += `  <Hmac>${hmacValue}</Hmac>\r\n`;
    formatted += `  <Data ${dataAttrs}>${dataValue}</Data>\r\n`;
    formatted += '</PidData>';
    
    return formatted;
  };

  return { captureFingerprint, loading };
};

export default useFingerprintCapture;
export type { FingerprintPayload };