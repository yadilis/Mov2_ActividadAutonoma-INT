import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert
} from 'react-native';
import { ref, onValue, update, remove } from 'firebase/database';
import { auth, database } from '../firebase/Config';

type Tarea = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export default function GestiónScreen({ navigation }: any) {
  const [tareas, setTareas] = useState<Tarea[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Referencia a las tareas del usuario actual
    const tareasRef = ref(database, `users/${user.uid}/tasks`);

    // Listener para detectar cambios en tareas y actualizar estado
    const unsubscribe = onValue(tareasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tareasArray = Object.entries(data).map(([id, tarea]: any) => ({
          id,
          title: tarea.title,
          completed: tarea.completed,
          createdAt: tarea.createdAt,
        }));
        console.log('Tareas cargadas:', tareasArray);
        setTareas(tareasArray);
      } else {
        setTareas([]);
      }
    });

    // Cleanup del listener al desmontar
    return () => unsubscribe();
  }, []);

  // Cambiar el estado completado de una tarea
  const toggleCompletada = async (tarea: Tarea) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const tareaRef = ref(database, `users/${user.uid}/tasks/${tarea.id}`);
      await update(tareaRef, { completed: !tarea.completed });
      Alert.alert('Éxito', 'Estado de tarea actualizado');
    } catch (error) {
      console.log('Error actualizar tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  // Eliminar una tarea con confirmación
  const eliminarTarea = (tareaId: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro de que quieres eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            console.log('Intentando eliminar tarea con ID:', tareaId);
            try {
              const tareaRef = ref(database, `users/${user.uid}/tasks/${tareaId}`);
              await remove(tareaRef);
              Alert.alert('Éxito', 'Tarea eliminada correctamente');
            } catch (error) {
              console.log('Error al eliminar tarea:', error);
              Alert.alert('Error', 'No se pudo eliminar la tarea');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Crear')}
      >
        <Text style={styles.createButtonText}>Crear Nueva Tarea</Text>
      </TouchableOpacity>

      <FlatList
        data={tareas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tarea}>
            <Text style={[styles.title, item.completed && styles.completed]}>
              {item.title}
            </Text>
            <Text>Creada: {item.createdAt}</Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => toggleCompletada(item)}
              >
                <Text style={styles.buttonText}>
                  {item.completed ? 'Marcar Pendiente' : 'Marcar Completada'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Crear', { tarea: item })}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => eliminarTarea(item.id)}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No hay tareas aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  createButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tarea: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  buttonsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
});
