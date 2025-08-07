'use client';
import { useEffect, useState } from 'react';
import { authService } from '../../services/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const userData = authService.getCurrentUser();
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>Bienvenido, {user.fullName}!</h1>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          data-testid="logout-button"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}