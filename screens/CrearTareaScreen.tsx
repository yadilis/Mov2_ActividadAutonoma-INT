import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ref, push, set } from 'firebase/database';
import { database } from '../firebase/Config';

type DrawerParamList = {
  Crear: undefined;
  Gestion: undefined;
  Lista: undefined;
};

type NavigationProp = DrawerNavigationProp<DrawerParamList, 'Crear'>;

export default function CrearTareaScreen() {
  const [tarea, setTareaTexto] = useState('');
  const navigation = useNavigation<NavigationProp>();

  const guardarTarea = async () => {
    if (tarea.trim() === '') return;

    const nuevaRef = push(ref(database, 'tareas'));
    await set(nuevaRef, {
      texto: tarea,
      completada: false,
    });

    setTareaTexto('');
    navigation.navigate('Lista'); // redirige a la lista después de guardar
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear Nueva Tarea</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe una tarea"
        value={tarea}
        onChangeText={setTareaTexto}
      />
      <Button title="Guardar Tarea" onPress={guardarTarea} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
