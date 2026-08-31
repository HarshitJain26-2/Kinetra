import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { WorkoutDetailsScreen } from '../screens/WorkoutDetailsScreen';
import { LiveWorkoutScreen } from '../screens/LiveWorkoutScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { MealRecommendationsScreen } from '../screens/MealRecommendationsScreen';
import { MealDetailsScreen } from '../screens/MealDetailsScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const KinetraDarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold,
    background: colors.background,
    card: colors.surface,
    text: colors.primaryText,
    border: colors.border,
    notification: colors.crimson,
  },
};

export const RootNavigator: React.FC = () => {
  const { session } = useAuth();

  return (
    <NavigationContainer theme={KinetraDarkNavTheme}>
      <Stack.Navigator
        initialRouteName={session ? 'Main' : 'Splash'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="HomePlaceholder" component={BottomTabNavigator} />
        <Stack.Screen
          name="WorkoutDetails"
          component={WorkoutDetailsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="LiveWorkout"
          component={LiveWorkoutScreen}
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Nutrition"
          component={NutritionScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="MealRecommendations"
          component={MealRecommendationsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="MealDetails"
          component={MealDetailsScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
