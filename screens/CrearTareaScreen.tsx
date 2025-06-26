import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ref, push, set, update } from 'firebase/database';
import { database } from '../firebase/Config';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

type DrawerParamList = {
  Crear: { id?: string; title?: string; categoria?: string; dueDate?: string } | undefined;
  Gestion: undefined;
  Lista: undefined;
};

type CrearScreenRouteProp = RouteProp<DrawerParamList, 'Crear'>;
type NavigationProp = DrawerNavigationProp<DrawerParamList, 'Crear'>;

export default function CrearTareaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CrearScreenRouteProp>();

  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('Personal');
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;

  const { isDarkMode, toggleTheme } = useTheme();
  const colorScheme = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    if (route.params?.title) setTexto(route.params.title);
    if (route.params?.categoria) setCategoria(route.params.categoria);
    if (route.params?.dueDate) setFechaVencimiento(new Date(route.params.dueDate));
  }, [route.params]);

  const guardarTarea = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar tareas');
      return;
    }
    if (texto.trim() === '') {
      Alert.alert('Error', 'El texto no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      if (route.params?.id) {
        await update(ref(database, `users/${user.uid}/tasks/${route.params.id}`), {
          title: texto,
          categoria,
          dueDate: fechaVencimiento?.toISOString() || null,
        });
        Alert.alert('Éxito', 'Tarea actualizada correctamente');
      } else {
        const nuevaRef = push(ref(database, `users/${user.uid}/tasks`));
        await set(nuevaRef, {
          title: texto,
          categoria,
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: fechaVencimiento?.toISOString() || null,
        });
        Alert.alert('Éxito', 'Tarea creada correctamente');
      }

      setTexto('');
      setCategoria('Personal');
      setFechaVencimiento(null);
      navigation.navigate('Lista');
    } catch (error) {
      console.error('Error guardando tarea:', error);
      Alert.alert('Error', 'No se pudo guardar la tarea. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Personal': return 'person-outline';
      case 'Trabajo': return 'briefcase-outline';
      case 'Estudios': return 'school-outline';
      default: return 'list-outline';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Personal': return '#FF6B6B';
      case 'Trabajo': return '#4ECDC4';
      case 'Estudios': return '#45B7D1';
      default: return '#6C63FF';
    }
  };

  const styles = getStyles(colorScheme);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Icon name="arrow-back" size={24} color="#6C63FF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleTheme} style={styles.toggleButton}>
            <Icon
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={isDarkMode ? '#FFD700' : '#6C63FF'}
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Icon 
                name={route.params?.id ? "create-outline" : "add-circle-outline"} 
                size={40} 
                color="#6C63FF" 
              />
            </View>
            <Text style={styles.title}>
              {route.params?.id ? 'Editar Tarea' : 'Nueva Tarea'}
            </Text>
            <Text style={styles.subtitle}>
              {route.params?.id ? 'Modifica los detalles de tu tarea' : 'Organiza tu día, crea una nueva tarea'}
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Input de título */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Título de la tarea</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'titulo' && styles.inputContainerFocused
            ]}>
              <Icon name="create-outline" size={20} color={focusedInput === 'titulo' ? "#6C63FF" : (isDarkMode ? "#888" : "#9CA3AF")} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="¿Qué necesitas hacer?"
                placeholderTextColor={isDarkMode ? '#888' : '#9CA3AF'}
                value={texto}
                onChangeText={setTexto}
                editable={!loading}
                multiline
                onFocus={() => setFocusedInput('titulo')}
                onBlur={() => setFocusedInput('')}
              />
            </View>
          </View>

          {/* Selector de categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.categoriaContainer}>
              {['Personal', 'Trabajo', 'Estudios'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoriaBoton,
                    { borderColor: getCategoryColor(cat) },
                    categoria === cat && [
                      styles.categoriaSeleccionada,
                      { backgroundColor: getCategoryColor(cat) }
                    ],
                  ]}
                  onPress={() => setCategoria(cat)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={getCategoryIcon(cat)} 
                    size={18} 
                    color={categoria === cat ? '#fff' : getCategoryColor(cat)}
                    style={styles.categoriaIcon}
                  />
                  <Text
                    style={[
                      styles.categoriaTexto,
                      {
                        color: categoria === cat 
                          ? '#fff' 
                          : isDarkMode 
                            ? '#ccc' 
                            : getCategoryColor(cat)
                      }
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selector de fecha */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha de vencimiento</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={[
                styles.inputContainer,
                focusedInput === 'fecha' && styles.inputContainerFocused
              ]}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Icon 
                name="calendar-outline" 
                size={20} 
                color={fechaVencimiento ? "#6C63FF" : (isDarkMode ? "#888" : "#9CA3AF")} 
                style={styles.inputIcon} 
              />
              <Text style={[
                styles.dateText,
                {
                  color: fechaVencimiento 
                    ? (isDarkMode ? '#fff' : '#1F2937')
                    : (isDarkMode ? '#888' : '#9CA3AF')
                }
              ]}>
                {fechaVencimiento
                  ? fechaVencimiento.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Seleccionar fecha de vencimiento'}
              </Text>
              {fechaVencimiento && (
                <TouchableOpacity
                  onPress={() => setFechaVencimiento(null)}
                  style={styles.clearDateButton}
                >
                  <Icon name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={fechaVencimiento || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setFechaVencimiento(selectedDate);
              }}
            />
          )}

          {/* Botón de guardar */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={guardarTarea}
            disabled={loading || texto.trim() === ''}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon 
                  name={route.params?.id ? "checkmark-circle-outline" : "add-circle-outline"} 
                  size={20} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon} 
                />
                <Text style={styles.saveButtonText}>
                  {route.params?.id ? 'Guardar Cambios' : 'Crear Tarea'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: 24,
      paddingBottom: 20,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      left: 24,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E0E7FF',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    toggleButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 24,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E0E7FF',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    headerContent: {
      alignItems: 'center',
      marginTop: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E0E7FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colorScheme === 'dark' ? '#F1F5F9' : '#1F2937',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#94A3B8' : '#6B7280',
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    form: {
      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      flex: 1,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1.5,
      borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB',
      borderRadius: 12,
      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F9FAFB',
      paddingHorizontal: 16,
      paddingVertical: 16,
      minHeight: 56,
    },
    inputContainerFocused: {
      borderColor: '#6C63FF',
      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
      shadowColor: '#6C63FF',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colorScheme === 'dark' ? '#F1F5F9' : '#1F2937',
      paddingVertical: 0,
      textAlignVertical: 'top',
    },
    categoriaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoriaBoton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 25,
      borderWidth: 2,
      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F9FAFB',
      minWidth: 100,
    },
    categoriaSeleccionada: {
      shadowColor: '#6C63FF',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    categoriaIcon: {
      marginRight: 8,
    },
    categoriaTexto: {
      fontSize: 14,
      fontWeight: '600',
    },
    dateText: {
      flex: 1,
      fontSize: 16,
      textTransform: 'capitalize',
    },
    clearDateButton: {
      marginLeft: 8,
      padding: 4,
    },
    saveButton: {
      backgroundColor: '#6C63FF',
      borderRadius: 12,
      height: 56,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      shadowColor: '#6C63FF',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonIcon: {
      marginRight: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });