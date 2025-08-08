'use client';
import { useState, useEffect } from 'react';
import { productService } from '../services/products';

export default function EditWeightProductForm({ productId, onProductUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    weightUnit: 'kg',
    totalWeight: '',
    buyPricePerUnit: '',
    sellPricePerUnit: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [message, setMessage] = useState('');
  const [calculations, setCalculations] = useState({
    totalInvested: 0,
    totalProfit: 0
  });

  // Cargar datos del producto
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoadingProduct(true);
        const result = await productService.getProduct(productId);
        if (result.success) {
          const product = result.product;
          setFormData({
            name: product.name,
            weightUnit: product.weightUnit,
            totalWeight: product.totalWeight.toString(),
            buyPricePerUnit: product.buyPricePerUnit.toString(),
            sellPricePerUnit: product.sellPricePerUnit.toString()
          });
        }
      } catch (error) {
        setMessage(error.message || 'Error al cargar producto');
      } finally {
        setLoadingProduct(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Calcular valores automáticamente
  useEffect(() => {
    const { totalWeight, buyPricePerUnit, sellPricePerUnit } = formData;
    
    if (totalWeight && buyPricePerUnit && sellPricePerUnit) {
      const weight = parseFloat(totalWeight) || 0;
      const buyPrice = parseFloat(buyPricePerUnit) || 0;
      const sellPrice = parseFloat(sellPricePerUnit) || 0;
      
      const totalInvested = weight * buyPrice;
      const totalProfit = (sellPrice * weight) - totalInvested;
      
      setCalculations({
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2))
      });
    } else {
      setCalculations({
        totalInvested: 0,
        totalProfit: 0
      });
    }
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es obligatorio';
    }

    if (!formData.totalWeight || parseFloat(formData.totalWeight) <= 0) {
      newErrors.totalWeight = 'El peso total debe ser mayor a 0';
    }

    if (!formData.buyPricePerUnit || parseFloat(formData.buyPricePerUnit) <= 0) {
      newErrors.buyPricePerUnit = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.sellPricePerUnit || parseFloat(formData.sellPricePerUnit) <= 0) {
      newErrors.sellPricePerUnit = 'El precio de venta debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await productService.updateWeightProduct(productId, formData);
      if (result.success) {
        setMessage('¡Producto actualizado exitosamente!');
        setTimeout(() => {
          onProductUpdated && onProductUpdated(result.product);
        }, 1000);
      }
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      }
      setMessage(error.message || 'Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="product-form-container">
        <div className="product-form">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-form-container">
      <div className="product-form">
        <div className="form-header">
          <h3>Editar Producto por Peso</h3>
          <button onClick={onCancel} className="close-btn" data-testid="edit-weight-form-close">
            ×
          </button>
        </div>

        {message && (
            <div className={`message ${message.includes('exitosamente') || message.includes('exitoso') || message.includes('actualizado') ? 'success' : 'error'}`}>
                {message}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Producto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Ejemplo: Arroz Premium"
              data-testid="edit-weight-name-input"
            />
            {errors.name && (
              <span className="error-text" data-testid="edit-weight-name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weightUnit">Unidad de Peso *</label>
              <select
                id="weightUnit"
                name="weightUnit"
                value={formData.weightUnit}
                onChange={handleChange}
                data-testid="edit-weight-unit-select"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="totalWeight">Peso Total *</label>
              <input
                type="number"
                step="0.01"
                id="totalWeight"
                name="totalWeight"
                value={formData.totalWeight}
                onChange={handleChange}
                className={errors.totalWeight ? 'error' : ''}
                placeholder="50.5"
                min="0.01"
                data-testid="edit-total-weight-input"
              />
              {errors.totalWeight && (
                <span className="error-text" data-testid="edit-total-weight-error">
                  {errors.totalWeight}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="buyPricePerUnit">Precio Compra/{formData.weightUnit} *</label>
              <input
                type="number"
                step="0.01"
                id="buyPricePerUnit"
                name="buyPricePerUnit"
                value={formData.buyPricePerUnit}
                onChange={handleChange}
                className={errors.buyPricePerUnit ? 'error' : ''}
                placeholder="3.50"
                min="0.01"
                data-testid="edit-weight-buy-price-input"
              />
              {errors.buyPricePerUnit && (
                <span className="error-text" data-testid="edit-weight-buy-price-error">
                  {errors.buyPricePerUnit}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sellPricePerUnit">Precio Venta/{formData.weightUnit} *</label>
              <input
                type="number"
                step="0.01"
                id="sellPricePerUnit"
                name="sellPricePerUnit"
                value={formData.sellPricePerUnit}
                onChange={handleChange}
                className={errors.sellPricePerUnit ? 'error' : ''}
                placeholder="5.00"
                min="0.01"
                data-testid="edit-weight-sell-price-input"
              />
              {errors.sellPricePerUnit && (
                <span className="error-text" data-testid="edit-weight-sell-price-error">
                  {errors.sellPricePerUnit}
                </span>
              )}
            </div>
          </div>

          {/* Cálculos automáticos */}
          <div className="calculations">
            <h4>Cálculos Automáticos</h4>
            <div className="calc-row">
              <div className="calc-item">
                <span className="calc-label">Peso Total:</span>
                <span className="calc-value" data-testid="edit-weight-total-units">
                  {formData.totalWeight} {formData.weightUnit}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Invertido:</span>
                <span className="calc-value invested" data-testid="edit-weight-total-invested">
                  ${calculations.totalInvested}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Ganancia:</span>
                <span className={`calc-value ${calculations.totalProfit >= 0 ? 'profit' : 'loss'}`} data-testid="edit-weight-total-profit">
                  ${calculations.totalProfit}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              data-testid="edit-weight-form-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              data-testid="edit-weight-form-submit"
            >
              {loading ? 'Actualizando...' : 'Actualizar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}