import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Teacher, UserRole } from '../types';
import { api } from '../services/api';
import { useBrand } from './BrandContext';
import { useLanguage } from '../i18n/LanguageContext';

interface AuthContextType {
  currentUser: Student | Teacher | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (gymCode: string, email: string) => Promise<{ success: boolean; error?: string }>;
  quickLoginAsStudent: (studentId?: string) => Promise<void>;
  quickLoginAsTeacher: (teacherId?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_USER_KEY = 'gymapp_auth_user_id';
const AUTH_ROLE_KEY = 'gymapp_auth_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { brand } = useBrand();
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<Student | Teacher | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session or bootstrap default demo student
  useEffect(() => {
    async function initAuth() {
      try {
        const savedId = localStorage.getItem(AUTH_USER_KEY);
        const savedRole = localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null;

        if (savedId && savedRole) {
          if (savedRole === 'student') {
            const student = await api.getStudentById(savedId);
            if (student) {
              setCurrentUser(student);
              setRole('student');
              setIsLoading(false);
              return;
            }
          } else if (savedRole === 'teacher') {
            const teacher = await api.getTeacherById(savedId);
            if (teacher) {
              setCurrentUser(teacher);
              setRole('teacher');
              setIsLoading(false);
              return;
            }
          }
        }

        // Default demo student matching current brand
        const students = await api.getStudents(brand.gymCode);
        const defaultStudent = students[0] || (await api.getStudents())[0];
        if (defaultStudent) {
          setCurrentUser(defaultStudent);
          setRole('student');
          localStorage.setItem(AUTH_USER_KEY, defaultStudent.id);
          localStorage.setItem(AUTH_ROLE_KEY, 'student');
        }
      } catch (err) {
        console.error('Failed to init auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [brand.gymCode, language]);

  const login = async (gymCode: string, email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = gymCode.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check students
    const students = await api.getStudents();
    const matchedStudent = students.find(
      (s) => s.gymCode.toUpperCase() === cleanCode && s.email.toLowerCase() === cleanEmail
    );
    if (matchedStudent) {
      setCurrentUser(matchedStudent);
      setRole('student');
      localStorage.setItem(AUTH_USER_KEY, matchedStudent.id);
      localStorage.setItem(AUTH_ROLE_KEY, 'student');
      return { success: true };
    }

    // Check teachers
    const teachers = await api.getTeachers();
    const matchedTeacher = teachers.find(
      (t) => t.gymCode.toUpperCase() === cleanCode && t.email.toLowerCase() === cleanEmail
    );
    if (matchedTeacher) {
      setCurrentUser(matchedTeacher);
      setRole('teacher');
      localStorage.setItem(AUTH_USER_KEY, matchedTeacher.id);
      localStorage.setItem(AUTH_ROLE_KEY, 'teacher');
      return { success: true };
    }

    return { success: false, error: 'Credenciais inválidas ou código de academia incorreto' };
  };

  const quickLoginAsStudent = async (studentId?: string) => {
    const students = await api.getStudents();
    let target = students[0];
    if (studentId) {
      target = students.find((s) => s.id === studentId) || target;
    } else {
      // Find matching current brand if possible
      const brandMatch = students.find((s) => s.gymCode === brand.gymCode);
      if (brandMatch) target = brandMatch;
    }

    if (target) {
      setCurrentUser(target);
      setRole('student');
      localStorage.setItem(AUTH_USER_KEY, target.id);
      localStorage.setItem(AUTH_ROLE_KEY, 'student');
    }
  };

  const quickLoginAsTeacher = async (teacherId?: string) => {
    const teachers = await api.getTeachers();
    let target = teachers[0];
    if (teacherId) {
      target = teachers.find((t) => t.id === teacherId) || target;
    } else {
      const brandMatch = teachers.find((t) => t.gymCode === brand.gymCode);
      if (brandMatch) target = brandMatch;
    }

    if (target) {
      setCurrentUser(target);
      setRole('teacher');
      localStorage.setItem(AUTH_USER_KEY, target.id);
      localStorage.setItem(AUTH_ROLE_KEY, 'teacher');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setRole(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
  };

  const refreshUser = async () => {
    if (!currentUser || !role) return;
    if (role === 'student') {
      const refreshed = await api.getStudentById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
    } else {
      const refreshed = await api.getTeacherById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        login,
        quickLoginAsStudent,
        quickLoginAsTeacher,
        logout,
        refreshUser,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
