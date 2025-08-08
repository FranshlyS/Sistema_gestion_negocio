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

  const goToProducts = () => {
    router.push('/products');
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>Panel de Control</h1>
        
        <div className="user-info">
          <h2>Bienvenido, {user.fullName}!</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>

        <div className="dashboard-actions">
          <button 
            onClick={goToProducts}
            className="action-btn primary"
            data-testid="go-to-products"
          >
            📦 Gestionar Productos
          </button>
          
          <button 
            onClick={handleLogout} 
            className="action-btn secondary"
            data-testid="logout-button"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}