'use client';
import { useState, useEffect } from 'react';
import { productService } from '../services/products';

export default function WeightProductForm({ onProductAdded, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    weightUnit: 'kg',
    totalWeight: '',
    buyPricePerUnit: '',
    sellPricePerUnit: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [calculations, setCalculations] = useState({
    totalInvested: 0,
    totalProfit: 0
  });

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
      const result = await productService.createWeightProduct(formData);
      if (result.success) {
        setMessage('¡Producto registrado exitosamente!');
        setFormData({
          name: '',
          weightUnit: 'kg',
          totalWeight: '',
          buyPricePerUnit: '',
          sellPricePerUnit: ''
        });
        setTimeout(() => {
          onProductAdded && onProductAdded(result.product);
        }, 1000);
      }
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      }
      setMessage(error.message || 'Error al registrar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-container">
      <div className="product-form">
        <div className="form-header">
          <h3>Registrar Producto por Peso</h3>
          <button onClick={onCancel} className="close-btn" data-testid="weight-form-close">
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
              data-testid="weight-name-input"
            />
            {errors.name && (
              <span className="error-text" data-testid="weight-name-error">
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
                data-testid="weight-unit-select"
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
                data-testid="total-weight-input"
              />
              {errors.totalWeight && (
                <span className="error-text" data-testid="total-weight-error">
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
                data-testid="weight-buy-price-input"
              />
              {errors.buyPricePerUnit && (
                <span className="error-text" data-testid="weight-buy-price-error">
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
                data-testid="weight-sell-price-input"
              />
              {errors.sellPricePerUnit && (
                <span className="error-text" data-testid="weight-sell-price-error">
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
                <span className="calc-value" data-testid="weight-total-units">
                  {formData.totalWeight} {formData.weightUnit}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Invertido:</span>
                <span className="calc-value invested" data-testid="weight-total-invested">
                  ${calculations.totalInvested}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Ganancia:</span>
                <span className={`calc-value ${calculations.totalProfit >= 0 ? 'profit' : 'loss'}`} data-testid="weight-total-profit">
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
              data-testid="weight-form-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              data-testid="weight-form-submit"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}