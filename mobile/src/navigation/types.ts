import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutItem, MealPlanItem } from '../api/client';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  HomePlaceholder?: undefined;
  WorkoutDetails: {
    workoutId: string;
    initialWorkout?: WorkoutItem;
  };
  LiveWorkout: {
    workoutId: string;
    workout?: WorkoutItem;
    exercise?: { id?: string; name?: string };
    setNumber?: number;
  };
  Nutrition: undefined;
  MealRecommendations: {
    initialDietType?: string;
  } | undefined;
  MealDetails: {
    meal: MealPlanItem;
    dietType?: string;
  };
  Onboarding: undefined;
  EditProfile: undefined;
  CreateWorkout: undefined;
  ManualWorkout: {
    workoutId: string;
    workout?: WorkoutItem;
  };
  ExerciseProgress: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Train: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type ScreenNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
