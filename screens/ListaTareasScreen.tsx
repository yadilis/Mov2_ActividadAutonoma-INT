import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient'; // Si usas Expo
// Si no usas Expo, usa: import LinearGradient from 'react-native-linear-gradient';

import { useNavigation } from '@react-navigation/native';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../firebase/Config';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

interface Tarea {
  title: string;
  completed: boolean;
  createdAt?: string;
}

type DrawerParamList = {
  Crear: { id?: string; title?: string } | undefined;
  Gestion: undefined;
  Lista: undefined;
};

export default function ListaTareasScreen() {
  const [tareas, setTareas] = useState<{ id: string; data: Tarea }[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'fecha_desc' | 'fecha_asc' | 'az' | 'za'>('fecha_desc');
  const [showFilters, setShowFilters] = useState(false);

  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const auth = getAuth();
  const user = auth.currentUser;

  const { isDarkMode, toggleTheme } = useTheme();

  // Colores del tema
  const colors = {
    primary: isDarkMode ? '#6C63FF' : '#5A52FF',
    primaryLight: isDarkMode ? '#8B84FF' : '#7B73FF',
    secondary: isDarkMode ? '#FF6B9D' : '#FF5722',
    background: isDarkMode ? '#0F0F23' : '#F8F9FE',
    surface: isDarkMode ? '#1A1A2E' : '#FFFFFF',
    surfaceVariant: isDarkMode ? '#252541' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#1A1A2E',
    textSecondary: isDarkMode ? '#B8B8CC' : '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: isDarkMode ? '#2D2D44' : '#E5E7EB',
  };

  useEffect(() => {
    if (!user) return;

    const tareasRef = ref(database, `users/${user.uid}/tasks`);

    const unsubscribe = onValue(tareasRef, (snapshot) => {
      const data = snapshot.val() || {};
      const tareasArray = Object.entries(data).map(([id, tarea]) => ({
        id,
        data: tarea as Tarea,
      }));
      setTareas(tareasArray);
    });

    return () => unsubscribe();
  }, [user]);

  const tareasFiltradas = tareas
    .filter((tarea) =>
      tarea.data.title.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      if (orden === 'fecha_desc') {
        return new Date(b.data.createdAt || '').getTime() - new Date(a.data.createdAt || '').getTime();
      } else if (orden === 'fecha_asc') {
        return new Date(a.data.createdAt || '').getTime() - new Date(b.data.createdAt || '').getTime();
      } else if (orden === 'az') {
        return a.data.title.localeCompare(b.data.title);
      } else if (orden === 'za') {
        return b.data.title.localeCompare(a.data.title);
      }
      return 0;
    });

  const tareasCompletadas = tareasFiltradas.filter(t => t.data.completed).length;
  const tareasTotal = tareasFiltradas.length;

  const marcarCompletada = (id: string, completed: boolean) => {
    if (!user) return;
    update(ref(database, `users/${user.uid}/tasks/${id}`), {
      completed: !completed,
    });
  };

  const eliminarTarea = (id: string) => {
    if (!user) return;
    remove(ref(database, `users/${user.uid}/tasks/${id}`));
  };

  const editarTarea = (id: string, title: string) => {
    navigation.navigate('Crear', { id, title });
  };

  const renderItem = ({ item, index }: { item: { id: string; data: Tarea }, index: number }) => {
    const { id, data } = item;

    return (
      <Animated.View style={[
        styles.taskCard,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [{ scale: 1 }],
        }
      ]}>
        <View style={styles.taskHeader}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { 
                backgroundColor: data.completed ? colors.success : 'transparent',
                borderColor: data.completed ? colors.success : colors.border,
              }
            ]}
            onPress={() => marcarCompletada(id, data.completed)}
          >
            {data.completed && (
              <Icon name="check" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <Text style={[
            styles.taskTitle,
            { 
              color: data.completed ? colors.textSecondary : colors.text,
              textDecorationLine: data.completed ? 'line-through' : 'none',
            }
          ]}>
            {data.title}
          </Text>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
            onPress={() => editarTarea(id, data.title)}
          >
            <Icon name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]}
            onPress={() => eliminarTarea(id)}
          >
            <Icon name="delete" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Estadísticas */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{tareasTotal}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.success }]}>{tareasCompletadas}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{tareasTotal - tareasCompletadas}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar tareas..."
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : colors.surfaceVariant }]}
        >
          <Icon name="tune" size={20} color={showFilters ? '#FFFFFF' : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Ordenar por:</Text>
          <View style={styles.filterOptions}>
            {[
              { label: 'Más recientes', value: 'fecha_desc', icon: 'access-time' },
              { label: 'Más antiguos', value: 'fecha_asc', icon: 'history' },
              { label: 'A-Z', value: 'az', icon: 'sort-by-alpha' },
              { label: 'Z-A', value: 'za', icon: 'sort-by-alpha' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  { 
                    backgroundColor: orden === option.value ? colors.primary : colors.surfaceVariant,
                  }
                ]}
                onPress={() => setOrden(option.value as any)}
              >
                <Icon 
                  name={option.icon} 
                  size={16} 
                  color={orden === option.value ? '#FFFFFF' : colors.textSecondary} 
                />
                <Text style={[
                  styles.filterOptionText,
                  { color: orden === option.value ? '#FFFFFF' : colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <View style={styles.emptyState}>
          <Icon name="account-circle" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Inicia Sesión
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Por favor, inicia sesión para ver tus tareas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Mis Tareas</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Icon
              name={isDarkMode ? 'light-mode' : 'dark-mode'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={tareasFiltradas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="assignment" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {busqueda ? 'Sin resultados' : 'No hay tareas'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {busqueda 
                ? 'No se encontraron tareas que coincidan con tu búsqueda' 
                : 'Comienza creando tu primera tarea'
              }
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  taskCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});