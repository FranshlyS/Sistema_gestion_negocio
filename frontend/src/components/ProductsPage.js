'use client';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { useRouter } from 'next/navigation';
import PackProductForm from './PackProductForm';
import WeightProductForm from './WeightProductForm';
import EditPackProductForm from './EditPackProductForm';
import EditWeightProductForm from './EditWeightProductForm';
import ProductList from './ProductList';

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [showPackForm, setShowPackForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showEditPackForm, setShowEditPackForm] = useState(false);
  const [showEditWeightForm, setShowEditWeightForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const userData = authService.getCurrentUser();
    setUser(userData);
  }, [router]);

  const handleProductAdded = (product) => {
    setShowPackForm(false);
    setShowWeightForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProductUpdated = (product) => {
    setShowEditPackForm(false);
    setShowEditWeightForm(false);
    setEditingProduct(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    if (product.type === 'pack') {
      setShowEditPackForm(true);
    } else {
      setShowEditWeightForm(true);
    }
  };

  const handleCancelEdit = () => {
    setShowEditPackForm(false);
    setShowEditWeightForm(false);
    setEditingProduct(null);
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Gestión de Productos</h1>
            <p>Bienvenido, {user.fullName}</p>
          </div>
          <div className="header-right">
            <button 
              onClick={goToDashboard}
              className="nav-btn"
              data-testid="go-to-dashboard"
            >
              Dashboard
            </button>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              data-testid="logout-button"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button
          onClick={() => setShowPackForm(true)}
          className="add-product-btn pack"
          data-testid="add-pack-product-btn"
          disabled={showPackForm || showWeightForm || showEditPackForm || showEditWeightForm}
        >
          Agregar Producto por Pack
        </button>
        <button
          onClick={() => setShowWeightForm(true)}
          className="add-product-btn weight"
          data-testid="add-weight-product-btn"
          disabled={showPackForm || showWeightForm || showEditPackForm || showEditWeightForm}
        >
          Agregar Producto por Peso
        </button>
      </div>

      {/* Formularios modales - Crear */}
      {showPackForm && (
        <div className="modal-overlay">
          <PackProductForm
            onProductAdded={handleProductAdded}
            onCancel={() => setShowPackForm(false)}
          />
        </div>
      )}

      {showWeightForm && (
        <div className="modal-overlay">
          <WeightProductForm
            onProductAdded={handleProductAdded}
            onCancel={() => setShowWeightForm(false)}
          />
        </div>
      )}

      {/* Formularios modales - Editar */}
      {showEditPackForm && editingProduct && (
        <div className="modal-overlay">
          <EditPackProductForm
            productId={editingProduct.id}
            onProductUpdated={handleProductUpdated}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {showEditWeightForm && editingProduct && (
        <div className="modal-overlay">
          <EditWeightProductForm
            productId={editingProduct.id}
            onProductUpdated={handleProductUpdated}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Lista de productos */}
      <ProductList 
        refreshTrigger={refreshTrigger} 
        onEditProduct={handleEditProduct}
      />
    </div>
  );
}