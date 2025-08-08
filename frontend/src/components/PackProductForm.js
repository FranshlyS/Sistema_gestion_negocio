'use client';
import { useState, useEffect } from 'react';
import { productService } from '../services/products';

export default function PackProductForm({ onProductAdded, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    packQuantity: '',
    productsPerPack: '',
    buyPricePerPack: '',
    sellPricePerUnit: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [calculations, setCalculations] = useState({
    totalUnits: 0,
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
    const { packQuantity, productsPerPack, buyPricePerPack, sellPricePerUnit } = formData;
    
    if (packQuantity && productsPerPack && buyPricePerPack && sellPricePerUnit) {
      const packs = parseInt(packQuantity) || 0;
      const perPack = parseInt(productsPerPack) || 0;
      const buyPrice = parseFloat(buyPricePerPack) || 0;
      const sellPrice = parseFloat(sellPricePerUnit) || 0;
      
      const totalUnits = packs * perPack;
      const totalInvested = packs * buyPrice;
      const totalProfit = (sellPrice * totalUnits) - totalInvested;
      
      setCalculations({
        totalUnits,
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2))
      });
    } else {
      setCalculations({
        totalUnits: 0,
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

    if (!formData.packQuantity || parseInt(formData.packQuantity) <= 0) {
      newErrors.packQuantity = 'La cantidad de packs debe ser mayor a 0';
    }

    if (!formData.productsPerPack || parseInt(formData.productsPerPack) <= 0) {
      newErrors.productsPerPack = 'Los productos por pack deben ser mayor a 0';
    }

    if (!formData.buyPricePerPack || parseFloat(formData.buyPricePerPack) <= 0) {
      newErrors.buyPricePerPack = 'El precio de compra debe ser mayor a 0';
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
      const result = await productService.createPackProduct(formData);
      if (result.success) {
        setMessage('¡Producto registrado exitosamente!');
        setFormData({
          name: '',
          packQuantity: '',
          productsPerPack: '',
          buyPricePerPack: '',
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
          <h3>Registrar Producto por Pack</h3>
          <button onClick={onCancel} className="close-btn" data-testid="pack-form-close">
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
              placeholder="Ejemplo: Galletas Oreo"
              data-testid="pack-name-input"
            />
            {errors.name && (
              <span className="error-text" data-testid="pack-name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="packQuantity">Cantidad de Packs *</label>
              <input
                type="number"
                id="packQuantity"
                name="packQuantity"
                value={formData.packQuantity}
                onChange={handleChange}
                className={errors.packQuantity ? 'error' : ''}
                placeholder="10"
                min="1"
                data-testid="pack-quantity-input"
              />
              {errors.packQuantity && (
                <span className="error-text" data-testid="pack-quantity-error">
                  {errors.packQuantity}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="productsPerPack">Productos por Pack *</label>
              <input
                type="number"
                id="productsPerPack"
                name="productsPerPack"
                value={formData.productsPerPack}
                onChange={handleChange}
                className={errors.productsPerPack ? 'error' : ''}
                placeholder="12"
                min="1"
                data-testid="products-per-pack-input"
              />
              {errors.productsPerPack && (
                <span className="error-text" data-testid="products-per-pack-error">
                  {errors.productsPerPack}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="buyPricePerPack">Precio Compra/Pack *</label>
              <input
                type="number"
                step="0.01"
                id="buyPricePerPack"
                name="buyPricePerPack"
                value={formData.buyPricePerPack}
                onChange={handleChange}
                className={errors.buyPricePerPack ? 'error' : ''}
                placeholder="15.50"
                min="0.01"
                data-testid="buy-price-pack-input"
              />
              {errors.buyPricePerPack && (
                <span className="error-text" data-testid="buy-price-pack-error">
                  {errors.buyPricePerPack}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sellPricePerUnit">Precio Venta/Unidad *</label>
              <input
                type="number"
                step="0.01"
                id="sellPricePerUnit"
                name="sellPricePerUnit"
                value={formData.sellPricePerUnit}
                onChange={handleChange}
                className={errors.sellPricePerUnit ? 'error' : ''}
                placeholder="2.00"
                min="0.01"
                data-testid="sell-price-unit-input"
              />
              {errors.sellPricePerUnit && (
                <span className="error-text" data-testid="sell-price-unit-error">
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
                <span className="calc-label">Total Unidades:</span>
                <span className="calc-value" data-testid="pack-total-units">
                  {calculations.totalUnits}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Invertido:</span>
                <span className="calc-value invested" data-testid="pack-total-invested">
                  ${calculations.totalInvested}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Total Ganancia:</span>
                <span className={`calc-value ${calculations.totalProfit >= 0 ? 'profit' : 'loss'}`} data-testid="pack-total-profit">
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
              data-testid="pack-form-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              data-testid="pack-form-submit"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}