import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export default function PreviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<PreviewScreenRouteProp>();
  const { photo } = route.params;

  const handleContinue = () => {
    Alert.alert(
      'Proof Accepted',
      `Verification proof successfully captured and marked!\n\nLocation: ${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}\nTime: ${photo.timestamp}`,
      [{ text: 'Done', onPress: () => navigation.navigate('Camera') }]
    );
  };

  const imageUri = photo.uri.startsWith('file://')
    ? photo.uri
    : photo.uri.startsWith('file:/')
      ? photo.uri.replace('file:/', 'file:///')
      : `file://${photo.uri}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Proof Photo</Text>
        <Text style={styles.headerSubtitle}>Watermark is burned directly into the image pixels</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16', // Deep elegant dark blue-gray
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#020617', // Pitch dark for contrast
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0EA5E9', // Vibrant blue HSL accent
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
