import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../auth/LoginScreen';
import RegistroScreen from '../auth/RegistroScreen';

import { createDrawerNavigator } from '@react-navigation/drawer';
import CrearTareaScreen from '../screens/CrearTareaScreen';

import ListaTareasScreen from '../screens/ListaTareasScreen';
import PerfilUsuarioScreen from '../screens/PerfilUsuarioScreen';


const Drawer = createDrawerNavigator();

function MyDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Crear">
      <Drawer.Screen name="Crear" component={CrearTareaScreen} />
      <Drawer.Screen name='Perfil' component={PerfilUsuarioScreen} />
      <Drawer.Screen name="Lista" component={ListaTareasScreen} />
     
    </Drawer.Navigator>
  );
}

const Stack = createStackNavigator();

export default function Navegador() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="Drawer" component={MyDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
