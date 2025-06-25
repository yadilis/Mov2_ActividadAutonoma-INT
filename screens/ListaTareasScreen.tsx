import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../firebase/Config';
import { DrawerNavigationProp } from '@react-navigation/drawer';

interface Tarea {
  texto: string;
  completada: boolean;
}

type DrawerParamList = {
  Crear: { id?: string; texto?: string } | undefined;
  Gestion: undefined;
  Lista: undefined;
};

export default function ListaTareasScreen() {
  const [tareas, setTareas] = useState<Record<string, Tarea>>({});
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  useEffect(() => {
    const tareasRef = ref(database, 'tareas');

    const unsubscribe = onValue(tareasRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTareas(data);
    });

    return () => unsubscribe();
  }, []);

  const marcarCompletada = (id: string, completada: boolean) => {
    update(ref(database, `tareas/${id}`), {
      completada: !completada,
    });
  };

  const eliminarTarea = (id: string) => {
    remove(ref(database, `tareas/${id}`));
  };

  const editarTarea = (id: string, texto: string) => {
    navigation.navigate('Crear', { id, texto });
  };

  const renderItem = ({ item }: { item: string }) => {
    const tarea = tareas[item];

    return (
      <View style={styles.item}>
        <Text style={tarea.completada ? styles.completada : styles.texto}>
          {tarea.texto}
        </Text>
        <View style={styles.botones}>
          <TouchableOpacity
            style={styles.boton}
            onPress={() => marcarCompletada(item, tarea.completada)}
          >
            <Text style={styles.botonTexto}>
              {tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boton}
            onPress={() => editarTarea(item, tarea.texto)}
          >
            <Text style={styles.botonTexto}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boton}
            onPress={() => eliminarTarea(item)}
          >
            <Text style={[styles.botonTexto, { color: 'red' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Tareas</Text>
      <FlatList
        data={Object.keys(tareas)}
        renderItem={renderItem}
        keyExtractor={(item) => item}
      />
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
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#f3f3f3',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
  },
  texto: {
    fontSize: 18,
    marginBottom: 8,
  },
  completada: {
    fontSize: 18,
    marginBottom: 8,
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  botones: {
    flexDirection: 'column',
    gap: 10,
  },
  boton: {
    marginVertical: 4,
    paddingVertical: 6,
    backgroundColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '500',
  },
});
