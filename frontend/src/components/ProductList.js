'use client';
import { useState, useEffect } from 'react';
import { productService } from '../services/products';

export default function ProductList({ refreshTrigger, onEditProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productService.getProducts();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (error) {
      setError(error.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!confirm(`¿Estás seguro de eliminar "${productName}"?`)) {
      return;
    }

    try {
      const result = await productService.deleteProduct(productId);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (error) {
      alert(error.message || 'Error al eliminar producto');
    }
  };

  const handleEdit = (product) => {
    onEditProduct && onEditProduct(product);
  };

  // ... resto de las funciones de formato se mantienen igual ...

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  const getProductTypeLabel = (type) => {
    return type === 'pack' ? 'Pack' : 'Peso';
  };

  const getProductTypeIcon = (type) => {
    return type === 'pack' ? '' : '';
  };

  const getUnitDisplay = (product) => {
    if (product.type === 'pack') {
      return `${product.totalUnits} unidades`;
    } else {
      return `${product.totalUnits} ${product.weightUnit}`;
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    if (filterType === 'all') return true;
    return product.type === filterType;
  });

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calcular totales
  const totals = filteredProducts.reduce((acc, product) => {
    acc.totalInvested += product.totalInvested;
    acc.totalProfit += product.totalProfit;
    return acc;
  }, { totalInvested: 0, totalProfit: 0 });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button onClick={loadProducts} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="list-header">
        <h3>Inventario de Productos</h3>
        
        {/* Totales generales */}
        <div className="totals-summary">
          <div className="total-item">
            <span className="total-label">Total Invertido:</span>
            <span className="total-value invested" data-testid="total-invested">
              {formatCurrency(totals.totalInvested)}
            </span>
          </div>
          <div className="total-item">
            <span className="total-label">Ganancia Total:</span>
            <span className={`total-value ${totals.totalProfit >= 0 ? 'profit' : 'loss'}`} data-testid="total-profit">
              {formatCurrency(totals.totalProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros y ordenamiento */}
      <div className="controls">
        <div className="filter-controls">
          <label htmlFor="filterType">Filtrar por tipo:</label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            data-testid="filter-type-select"
          >
            <option value="all">Todos</option>
            <option value="pack">Por Pack</option>
            <option value="weight">Por Peso</option>
          </select>
        </div>

        <div className="sort-controls">
          <label htmlFor="sortBy">Ordenar por:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            data-testid="sort-by-select"
          >
            <option value="createdAt">Fecha de Creación</option>
            <option value="name">Nombre</option>
            <option value="totalInvested">Total Invertido</option>
            <option value="totalProfit">Ganancia</option>
          </select>
          
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
            data-testid="sort-order-toggle"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Lista de productos */}
      {sortedProducts.length === 0 ? (
        <div className="empty-state" data-testid="empty-products">
          <p>No hay productos registrados aún.</p>
          <p>¡Agrega tu primer producto para comenzar!</p>
        </div>
      ) : (
        <div className="products-grid">
          {sortedProducts.map((product) => (
            <div key={product.id} className="product-card" data-testid={`product-card-${product.id}`}>
              <div className="product-header">
                <div className="product-title">
                  <span className="product-icon">
                    {getProductTypeIcon(product.type)}
                  </span>
                  <h4>{product.name}</h4>
                </div>
                <div className="product-type">
                  <span className={`type-badge ${product.type}`}>
                    {getProductTypeLabel(product.type)}
                  </span>
                </div>
              </div>

              <div className="product-details">
                <div className="detail-row">
                  <span className="detail-label">Cantidad:</span>
                  <span className="detail-value" data-testid={`product-units-${product.id}`}>
                    {getUnitDisplay(product)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Precio de Venta:</span>
                  <span className="detail-value">
                    {formatCurrency(product.sellPricePerUnit)}/
                    {product.type === 'pack' ? 'unidad' : product.weightUnit}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Total Invertido:</span>
                  <span className="detail-value invested" data-testid={`product-invested-${product.id}`}>
                    {formatCurrency(product.totalInvested)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Ganancia Total:</span>
                  <span className={`detail-value ${product.totalProfit >= 0 ? 'profit' : 'loss'}`} data-testid={`product-profit-${product.id}`}>
                    {formatCurrency(product.totalProfit)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Registrado:</span>
                  <span className="detail-value text-muted">
                    {formatDate(product.createdAt)}
                  </span>
                </div>
              </div>

              <div className="product-actions">
                <button
                  onClick={() => handleEdit(product)}
                  className="edit-btn"
                  data-testid={`edit-product-${product.id}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="delete-btn"
                  data-testid={`delete-product-${product.id}`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}