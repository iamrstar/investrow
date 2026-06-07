import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, BackHandler, Linking, Platform, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// Replace this URL with your local machine's IP address if testing on a physical device
// Example: const CRM_URL = 'http://192.168.1.5:3000';
// For Android emulator, 10.0.2.2 points to the host machine's localhost.
const CRM_URL = 'http://172.20.10.2:3000';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle hardware back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
          return true; // prevent default behavior (exit app)
        }
        return false; // exit app
      };
      
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, [canGoBack]);

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    // Intercept external links like phone, email, and whatsapp
    if (
      url.startsWith('tel:') || 
      url.startsWith('mailto:') || 
      url.startsWith('whatsapp:') || 
      url.startsWith('sms:')
    ) {
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            console.warn(`Cannot handle URL: ${url}`);
          }
        })
        .catch(err => console.error('An error occurred', err));
        
      return false; // Do not load in WebView
    }
    
    return true; // Let WebView load it
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: CRM_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        // Allow geolocation if the CRM needs it
        geolocationEnabled={true}
        // Allow file upload support
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Match your CRM's background color
  },
  webview: {
    flex: 1,
  },
});
