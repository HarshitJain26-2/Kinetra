import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { KinetraButton } from '../components/KinetraButton';
import { images } from '../assets';
import { spacing } from '../theme';

export const SplashScreen: React.FC<ScreenProps<'Splash'>> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Welcome');
  };

  return (
    <ScreenBackground
      backgroundImage={images.splashBg}
      overlayOpacity={0.82}
      contentContainerStyle={styles.container}
    >
      <View style={styles.centerSection}>
        <BrandLogo
          size="large"
          showEmblem={true}
          showTagline={true}
          taglineText="ELITE INTELLIGENCE. REFINED PERFORMANCE."
        />
      </View>

      <View style={styles.bottomSection}>
        <KinetraButton
          title="GET STARTED  →"
          variant="darkOutline"
          onPress={handleGetStarted}
          testID="splash-get-started-button"
        />
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.xxl,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.md,
  },
});
