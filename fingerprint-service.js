// Initialize FingerprintJS from the CDN
const fpPromise = import("https://openfpcdn.io/fingerprintjs/v4").then(
  (FingerprintJS) => FingerprintJS.load()
);

/**
 * FingerprintService - Handles device identification and tracking
 */
class FingerprintService {
  /**
   * Generates a fingerprint and device information
   * @returns {Promise<Object>} Object containing fingerprint and device info
   */
  static async getFingerprint() {
    try {
      const fp = await fpPromise;
      const result = await fp.get();
      const visitorId = result.visitorId;

      // Extract device information from the components and user agent
      const userAgent = navigator.userAgent;
      const deviceInfo = this.#getDeviceInfo(result, userAgent);

      console.log("Fingerprint generated:", visitorId);
      console.log("Device info:", deviceInfo);

      return {
        fingerprint: visitorId,
        deviceInfo: deviceInfo,
      };
    } catch (error) {
      console.error("Error generating fingerprint:", error);
      throw error;
    }
  }

  /**
   * Send fingerprint data to the specified API
   * @param {string} fingerprint - The visitor ID from fingerprint
   * @param {Object} deviceInfo - Device information object
   * @param {string} apiEndpoint - API endpoint URL
   * @returns {Promise<Object>} The API response
   */
  static async sendFingerprintToAPI(fingerprint, deviceInfo, apiEndpoint) {
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fp: fingerprint,
          device: `${deviceInfo.mobile} | ${deviceInfo.manufacturer} | ${deviceInfo.osType}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending fingerprint:", error);
      console.error(error);
      throw error;
    }
  }

  /**
   * Download a file
   * @param {string} fileUrl - URL of the file to download
   * @param {string} fileName - Suggested name for the downloaded file
   */
  static downloadFile(fileUrl, fileName) {
    console.log(`Starting download of ${fileName}...`);

    // Create an invisible anchor element to trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = fileUrl;
    downloadLink.download = fileName;
    downloadLink.style.display = "none";

    // Add to DOM, click to start download, then remove
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Give the browser some time to start the download before removing the element
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      console.log(`Download initiated for ${fileName}`);
    }, 100);
  }

  /**
   * Private method to extract device information
   * @private
   */
  static #getDeviceInfo(fpResult, userAgent) {
    // Function to detect device manufacturer
    const deviceManufacturer = this.#detectDeviceManufacturer(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    return {
      browser: fpResult.components.browserName?.value || "",
      os: fpResult.components.os?.value || "",
      device: fpResult.components.deviceMemory?.value
        ? fpResult.components.deviceMemory.value < 4
          ? "low-end"
          : "high-end"
        : "unknown",
      mobile: fpResult.components.mobile?.value ? "mobile" : "desktop",
      platform: navigator.platform,
      userAgent: userAgent,
      manufacturer: deviceManufacturer,
      osType: isAndroid ? "Android" : isIOS ? "iOS" : "other",
    };
  }

  /**
   * Private method to detect device manufacturer
   * @private
   */
  static #detectDeviceManufacturer(ua) {
    const patterns = {
      Samsung: /Samsung|SM-|GT-|SCH-|SHV-/i,
      Oppo: /OPPO|CPH[0-9]{4}|PKQ[0-9]/i,
      Xiaomi: /Xiaomi|Redmi|MI |POCO|MIUI/i,
      Huawei: /HUAWEI|HW-|Honor/i,
      Vivo: /vivo|V[0-9]+[A-Z]?/i,
      Realme: /Realme|RMX[0-9]{4}/i,
      OnePlus: /OnePlus|ONEPLUS/i,
      Google: /Pixel|Google/i,
      Apple: /iPhone|iPad|iPod/i,
      Motorola: /Motorola|Moto/i,
      Nokia: /Nokia|NOK/i,
      Sony: /Sony|Xperia/i,
      LG: /LG|LG-/i,
      HTC: /HTC|HTC_/i,
      Asus: /ASUS|ZenFone/i,
    };

    for (const [manufacturer, pattern] of Object.entries(patterns)) {
      if (pattern.test(ua)) {
        return manufacturer;
      }
    }

    return "Unknown";
  }
}
