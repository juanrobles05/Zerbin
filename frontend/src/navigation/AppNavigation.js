import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReportScreen } from '../screens/reports/ReportScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Report">
        <Stack.Screen name="Report" component={ReportScreen} />
        {/* Agrega otras pantallas si existen */}
      </Stack.Navigator>
      <Stack.Navigator initialRouteName="History">
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;