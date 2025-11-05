import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReportScreen } from '../screens/reports/ReportScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ 
            title: 'Registro',
            headerBackTitle: 'Volver'
          }}
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="Home" 
          component={ReportScreen}
          options={{ title: 'Reportar Residuos' }}
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen}
          options={{ title: 'Nuevo Reporte' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'Mis Reportes' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;