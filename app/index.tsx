import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KRAS_MODULES } from '../src/constants/modules';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.eyebrow}>Kras OS</Text>
          <Text style={styles.title}>Business Dashboard</Text>
          <Text style={styles.subtitle}>
            The foundational workspace for Kras Digital operations, organized
            around the 12 core software modules.
          </Text>
        </View>

        <View style={styles.modulesSection}>
          {KRAS_MODULES.map((module, index) => (
            <View key={module.name} style={styles.moduleCard}>
              <Text style={styles.moduleIndex}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.moduleName}>{module.name}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  heroSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#d9e0e7',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#5f6b76',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#16202a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#52606d',
  },
  modulesSection: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d9e0e7',
    gap: 6,
  },
  moduleIndex: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#7b8794',
  },
  moduleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16202a',
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52606d',
  },
});
