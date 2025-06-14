import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.himeras.materialmanagement',
  appName: 'material-management-app',
  webDir: 'dist',
  android: {

    allowMixedContent: true, // Allow mixed content for development
    backgroundColor: "#ffffff" // Set a default background color
  },
  ios: {
    contentInset: "always"
  },
  plugins: {
    BarcodeScanner: {
      // Optional: Configure Google Barcode Scanner options here
      // "barcodeFormats": ["QR_CODE", "EAN_13", "UPC_A"], // Example
      // "lensFacing": "back", // "front" or "back"
      // "usePreferPerformanceFocus": true,
    },
    SplashScreen: {
      launchShowDuration: 0 // Optional: disable splash screen for faster debug
    },
    PushNotifications: {
      presentationOptions: ['alert', 'badge', 'sound']
    }
  }
};

export default config;
