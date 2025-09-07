import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReportsScreen } from '../screens/ReportsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Reports">
        <Stack.Screen name="Reports" component={ReportsScreen} />
        {/* Agrega otras pantallas si existen */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;