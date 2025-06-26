import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { LinearGradient } from 'expo-linear-gradient'; // Comentado para evitar dependencia
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase/Config';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PerfilUsuarioScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const { isDarkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    inputBackground: isDarkMode ? '#252541' : '#F9FAFB',
  };

  // Estados iniciales para detectar cambios
  const [initialData, setInitialData] = useState({
    nombre: '',
    telefono: '',
    fechaNacimiento: '',
  });

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user) return;
      try {
        const snapshot = await get(ref(database, `users/${user.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userData = {
            email: data.email || '',
            nombre: data.nombre || '',
            telefono: data.telefono || '',
            fechaNacimiento: data.fechaNacimiento || '',
          };
          
          setEmail(userData.email);
          setNombre(userData.nombre);
          setTelefono(userData.telefono);
          setFechaNacimiento(userData.fechaNacimiento);
          
          setInitialData({
            nombre: userData.nombre,
            telefono: userData.telefono,
            fechaNacimiento: userData.fechaNacimiento,
          });
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [user]);

  // Detectar cambios
  useEffect(() => {
    const currentData = { nombre, telefono, fechaNacimiento };
    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  }, [nombre, telefono, fechaNacimiento, initialData]);

  const validarFecha = (fecha: string) => {
    if (!fecha) return true; // Fecha opcional
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;
    
    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date.getTime()) && fecha === date.toISOString().split('T')[0];
  };

  const guardarPerfil = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    if (fechaNacimiento && !validarFecha(fechaNacimiento)) {
      Alert.alert('Error', 'La fecha de nacimiento debe tener el formato AAAA-MM-DD');
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      await update(ref(database, `users/${user.uid}`), {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        fechaNacimiento: fechaNacimiento.trim(),
      });
      
      // Actualizar datos iniciales
      setInitialData({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        fechaNacimiento: fechaNacimiento.trim(),
      });
      
      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const descartarCambios = () => {
    Alert.alert(
      'Descartar cambios',
      '¿Estás seguro de que quieres descartar los cambios realizados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            setNombre(initialData.nombre);
            setTelefono(initialData.telefono);
            setFechaNacimiento(initialData.fechaNacimiento);
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {/* Header con color sólido */}
      <View
        style={[styles.solidHeader, { backgroundColor: colors.primary }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Icon
              name={isDarkMode ? 'light-mode' : 'dark-mode'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar y información básica */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            {nombre ? (
              <Text style={styles.avatarText}>{getInitials(nombre)}</Text>
            ) : (
              <Icon name="person" size={40} color="#FFFFFF" />
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {nombre || 'Sin nombre'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {email}
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Información Personal
          </Text>

          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Nombre completo *
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Icon name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor={colors.textSecondary}
                value={nombre}
                onChangeText={setNombre}
                maxLength={50}
              />
            </View>
          </View>

          {/* Campo Teléfono */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Teléfono
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Icon name="phone" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ingresa tu número de teléfono"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
                maxLength={15}
              />
            </View>
          </View>

          {/* Campo Fecha de Nacimiento */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Fecha de nacimiento
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Icon name="cake" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="AAAA-MM-DD (ej: 1990-05-15)"
                placeholderTextColor={colors.textSecondary}
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                maxLength={10}
              />
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Formato: Año-Mes-Día (AAAA-MM-DD)
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          {hasChanges && (
            <TouchableOpacity
              style={[styles.discardButton, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
              onPress={descartarCambios}
            >
              <Icon name="refresh" size={20} color={colors.error} />
              <Text style={[styles.discardButtonText, { color: colors.error }]}>
                Descartar
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: hasChanges ? colors.primary : colors.surfaceVariant,
                opacity: saving ? 0.7 : 1,
              }
            ]}
            onPress={guardarPerfil}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="save" size={20} color={hasChanges ? "#FFFFFF" : colors.textSecondary} />
            )}
            <Text style={[
              styles.saveButtonText,
              { color: hasChanges ? "#FFFFFF" : colors.textSecondary }
            ]}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  solidHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 12,
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});