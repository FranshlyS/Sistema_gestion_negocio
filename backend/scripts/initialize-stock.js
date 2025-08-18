#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeStock() {
  console.log('Inicializando stock de productos...');
  
  try {
    // Obtener todos los productos sin stock inicializado
    const products = await prisma.product.findMany({
      where: {
        currentStock: 0
      }
    });

    console.log(`Encontrados ${products.length} productos para inicializar stock`);

    for (const product of products) {
      // Inicializar stock con las unidades totales
      await prisma.product.update({
        where: { id: product.id },
        data: {
          currentStock: product.totalUnits
        }
      });

      console.log(`Stock inicializado para "${product.name}": ${product.totalUnits} unidades`);
    }

    console.log('Inicialización de stock completada');

  } catch (error) {
    console.error('Error inicializando stock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initializeStock().catch(console.error);
}

module.exports = { initializeStock };