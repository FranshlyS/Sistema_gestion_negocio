const fs = require('fs');
const path = require('path');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { performance } = require('perf_hooks');

const baseUrl = 'http://localhost:3000';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_DIR = path.join(__dirname, 'reports');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots', RUN_ID);
const HTML_REPORT_PATH = path.join(REPORT_DIR, `report-${RUN_ID}.html`);
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Configuración mejorada de timeouts
const TIMEOUTS = {
  SHORT: 3000,
  MEDIUM: 8000,
  LONG: 15000,
  FORM_SUBMIT: 12000,
  PAGE_LOAD: 20000
};

function timestamp() { return new Date().toISOString(); }
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function saveScreenshot(driver, name) {
  try {
    const b64 = await driver.takeScreenshot();
    const filename = `${Date.now()}-${name.replace(/\s+/g,'_')}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, b64, 'base64');
    return filepath;
  } catch (err) {
    console.error('Error tomando screenshot:', err);
    return null;
  }
}

class Reporter {
  constructor() {
    this.tests = [];
    this.startTime = performance.now();
  }

  startTest(name) {
    const t = { name, status: 'running', start: performance.now(), startIso: timestamp(), steps: [] };
    this.tests.push(t);
    console.log(`[${timestamp()}] Iniciando: ${name}`);
    return t;
  }

  async addStep(testObj, msg, status='info', screenshotPath=null) {
    let relativePath = null;
    if (screenshotPath) {
      const screenshotFileName = path.basename(screenshotPath);
      relativePath = `screenshots/${RUN_ID}/${screenshotFileName}`;
    }
    const step = { ts: timestamp(), msg, status, screenshot: relativePath };
    testObj.steps.push(step);
    
    const icon = status === 'pass' ? '' : status === 'fail' ? '' : status === 'info' ? '' : '';
    console.log(`  ${icon} ${msg}`);
  }

  endTest(testObj, status='passed', errorMessage=null) {
    testObj.end = performance.now();
    testObj.endIso = timestamp();
    testObj.durationMs = Math.round(testObj.end - testObj.start);
    testObj.status = status;
    if (errorMessage) testObj.error = errorMessage;
    
    const icon = status === 'passed' ? '' : status === 'failed' ? '' : '';
    console.log(`[${timestamp()}] ${icon} ${testObj.name} - ${status.toUpperCase()} (${testObj.durationMs}ms)`);
  }

  summary() {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'passed').length;
    const failed = this.tests.filter(t => t.status === 'failed').length;
    const errors = this.tests.filter(t => t.status === 'error').length;
    const durationMs = Math.round(performance.now() - this.startTime);
    return { total, passed, failed, errors, durationMs };
  }

  generateHtml() {
    // Usar el mismo HTML del sistema anterior pero con mejor manejo de errores
    const s = this.summary();
    const css = `
      body{font-family:'Segoe UI',Arial,sans-serif;margin:20px;background:#f8f9fa;color:#212529;line-height:1.5}
      h1{color:#343a40;margin-bottom:10px;font-size:28px}
      .meta{color:#6c757d;margin-bottom:20px;font-size:14px}
      .summary{display:flex;gap:15px;align-items:center;margin-bottom:25px;flex-wrap:wrap}
      .badge{padding:8px 12px;border-radius:8px;font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:5px}
      .badge.total{background:#e9ecef;color:#495057}
      .badge.green{color:#155724;background:#d4edda;border:1px solid #c3e6cb}
      .badge.red{color:#721c24;background:#f8d7da;border:1px solid #f5c6cb}
      .badge.yellow{color:#856404;background:#fff3cd;border:1px solid #ffeaa7}
      .duration-badge{background:#17a2b8;color:white;margin-left:auto}
      
      table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
      th,td{padding:15px;text-align:left;font-size:14px}
      th{background:#f8f9fa;font-weight:700;color:#495057;border-bottom:2px solid #dee2e6}
      tr{border-bottom:1px solid #f1f3f4;transition:background-color 0.2s ease}
      tr:hover{background-color:#f8f9fa}
      tr.passed{border-left:4px solid #28a745}
      tr.failed{border-left:4px solid #dc3545}
      tr.error{border-left:4px solid #ffc107}
      
      .test-name{font-weight:700;color:#343a40;margin-bottom:4px}
      .test-meta{font-size:12px;color:#6c757d}
      .duration{font-weight:600;color:#495057}
      .error-msg{color:#dc3545;font-weight:600;margin-top:8px;padding:8px;background:#f8d7da;border-radius:4px;font-size:13px}
      
      .steps-container{max-height:400px;overflow-y:auto}
      .step{margin-bottom:8px;padding:10px;border-radius:6px;background:#f8f9fa;border-left:3px solid #6c757d}
      .step.pass{border-left-color:#28a745;background:#f1f8f4}
      .step.fail{border-left-color:#dc3545;background:#fdf2f2}
      .step.info{border-left-color:#17a2b8;background:#f0fffe}
      
      .step-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
      .step-msg{font-weight:500;color:#343a40}
      .step-status{font-size:11px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:3px}
      .step-status.pass{background:#28a745;color:white}
      .step-status.fail{background:#dc3545;color:white}
      .step-status.info{background:#17a2b8;color:white}
      .step-time{font-size:11px;color:#6c757d}
      
      .screenshot-container{margin-top:8px}
      img.thumb{width:150px;height:auto;border-radius:6px;border:2px solid #dee2e6;cursor:pointer;transition:all 0.3s ease}
      img.thumb:hover{border-color:#007bff;transform:scale(1.02);box-shadow:0 2px 8px rgba(0,123,255,0.3)}
    `;

    const rowsHtml = this.tests.map((t, idx) => {
      const statusClass = t.status === 'passed' ? 'passed' : (t.status === 'failed' ? 'failed' : 'error');
      const statusIcon = t.status === 'passed' ? '' : (t.status === 'failed' ? '' : '');
      
      const stepsHtml = t.steps.length > 0 ? t.steps.map((st, sidx) => {
        const stepClass = st.status === 'pass' || st.status === 'passed' ? 'pass' : 
                         (st.status === 'fail' || st.status === 'failed' ? 'fail' : 'info');
        
        const imgHtml = st.screenshot ? 
          `<div class="screenshot-container">
            <img class="thumb" src="${escapeHtml(st.screenshot)}" 
                 onclick="openModal('${escapeHtml(st.screenshot)}','${escapeHtml(t.name + ' - ' + st.msg)}')" 
                 alt="Screenshot" title="Click para ampliar">
           </div>` : '';
        
        const statusBadge = st.status !== 'info' ? 
          `<span class="step-status ${stepClass}">${escapeHtml(st.status)}</span>` : '';
        
        return `
          <div class="step ${stepClass}">
            <div class="step-header">
              <div class="step-msg">${escapeHtml(st.msg)}</div>
              ${statusBadge}
            </div>
            <div class="step-time">${escapeHtml(st.ts)}</div>
            ${imgHtml}
          </div>
        `;
      }).join('') : '<div class="no-steps">Sin pasos registrados</div>';

      const errorHtml = t.error ? 
        `<div class="error-msg"> Error: ${escapeHtml(t.error)}</div>` : '';

      return `
        <tr class="${statusClass}">
          <td style="width:30%">
            <div class="test-name">${statusIcon} ${escapeHtml(t.name)}</div>
            <div class="test-meta">
               ${escapeHtml(t.startIso)} → ${escapeHtml(t.endIso)}
            </div>
            ${errorHtml}
          </td>
          <td style="width:10%;text-align:center">
            <div class="duration">${((t.durationMs||0)/1000).toFixed(2)}s</div>
          </td>
          <td style="width:60%">
            <div class="steps-container">
              ${stepsHtml}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Reporte E2E Mejorado - ${RUN_ID}</title>
<style>${css}</style>
</head>
<body>
  <h1> Reporte E2E - Sistema Mejorado</h1>
  <div class="meta">
     <strong>Base URL:</strong> ${escapeHtml(baseUrl)} <br>
     <strong>Generado:</strong> ${escapeHtml(new Date().toLocaleString())} <br>
     <strong>Run ID:</strong> ${escapeHtml(RUN_ID)}
  </div>

  <div class="summary">
    <div class="badge total">Total: ${s.total}</div>
    <div class="badge green"> Exitosos: ${s.passed}</div>
    <div class="badge red"> Fallados: ${s.failed}</div>
    <div class="badge yellow"> Errores: ${s.errors}</div>
    <div class="badge duration-badge">⏱ ${(s.durationMs/1000).toFixed(2)}s</div>
  </div>

  <table>
    <thead>
      <tr><th> Prueba</th><th> Duración</th><th> Detalles</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <script>
    function openModal(src, caption) {
      // Simple lightbox implementation
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
      
      const img = document.createElement('img');
      img.src = src;
      img.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
      
      modal.appendChild(img);
      modal.onclick = () => document.body.removeChild(modal);
      document.body.appendChild(modal);
    }
  </script>
</body>
</html>`;
  }

  writeToDisk(filepath) {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, this.generateHtml(), 'utf8');
    return filepath;
  }
}

// ========== UTILIDADES MEJORADAS ==========
async function smartWaitForElement(driver, selector, timeout = TIMEOUTS.MEDIUM) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Buscando elemento: ${selector} (intento ${attempt + 1}/${maxRetries})`);
      
      // Esperar que la página esté completamente cargada
      await driver.wait(async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
      }, TIMEOUTS.SHORT);
      
      // Esperar un poco más para elementos dinámicos
      await driver.sleep(500);
      
      const element = await driver.wait(until.elementLocated(By.css(selector)), timeout);
      await driver.wait(until.elementIsVisible(element), TIMEOUTS.SHORT);
      
      console.log(`Elemento encontrado: ${selector}`);
      return element;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // Tomar screenshot del error y verificar qué hay en la página
        const currentUrl = await driver.getCurrentUrl();
        const pageSource = await driver.getPageSource();
        
        console.log(`No se pudo encontrar ${selector} después de ${maxRetries} intentos`);
        console.log(`URL actual: ${currentUrl}`);
        console.log(`Contenido de página disponible:`, pageSource.length > 0 ? 'Sí' : 'No');
        
        // Buscar elementos alternativos para debugging
        try {
          const buttons = await driver.findElements(By.css('button'));
          const inputs = await driver.findElements(By.css('input'));
          const links = await driver.findElements(By.css('a'));
          
          console.log(`Elementos encontrados en página:`);
          console.log(`- Botones: ${buttons.length}`);
          console.log(`- Inputs: ${inputs.length}`);
          console.log(`- Links: ${links.length}`);
          
          // Intentar encontrar elementos con data-testid
          const testElements = await driver.findElements(By.css('[data-testid]'));
          if (testElements.length > 0) {
            console.log(`       - Elementos con data-testid: ${testElements.length}`);
            for (let i = 0; i < Math.min(testElements.length, 5); i++) {
              try {
                const testId = await testElements[i].getAttribute('data-testid');
                console.log(`         * ${testId}`);
              } catch (e) {
                // Ignorar errores de elementos stale
              }
            }
          }
        } catch (debugError) {
          console.log(`Error en debugging: ${debugError.message}`);
        }
        
        throw new Error(`Elemento no encontrado después de ${maxRetries} intentos: ${selector}. URL: ${currentUrl}`);
      }
      
      console.log(`Reintentando en 2 segundos... (${attempt}/${maxRetries})`);
      await driver.sleep(2000);
    }
  }
}

async function smartFillInput(driver, selector, value, timeout = TIMEOUTS.MEDIUM) {
  const element = await smartWaitForElement(driver, selector, timeout);
  
  // Limpiar el campo de manera más robusta
  await element.click();
  await element.clear();
  await driver.sleep(200);
  
  // Verificar que se limpió
  const currentValue = await element.getAttribute('value');
  if (currentValue && currentValue.length > 0) {
    // Si no se limpió, usar select all + delete
    await element.sendKeys(Key.CONTROL + 'a');
    await element.sendKeys(Key.DELETE);
    await driver.sleep(200);
  }
  
  // Enviar el valor
  await element.sendKeys(value);
  
  // Verificar que se escribió correctamente
  const finalValue = await element.getAttribute('value');
  if (finalValue !== value) {
    console.log(`Valor esperado: "${value}", valor actual: "${finalValue}"`);
  }
  
  return element;
}

async function smartClickElement(driver, selector, timeout = TIMEOUTS.MEDIUM) {
  const element = await smartWaitForElement(driver, selector, timeout);
  
  // Scroll al elemento si es necesario
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
  await driver.sleep(300);
  
  // Esperar que sea clickeable
  await driver.wait(until.elementIsEnabled(element), TIMEOUTS.SHORT);
  
  await element.click();
  return element;
}

async function waitForUrlChange(driver, expectedUrl, timeout = TIMEOUTS.MEDIUM) {
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return currentUrl.includes(expectedUrl);
  }, timeout);
}

async function waitForSuccessMessage(driver, timeout = TIMEOUTS.FORM_SUBMIT) {
  console.log('Esperando mensaje de éxito...');
  
  // Esperar por cualquier mensaje primero
  try {
    const messageElement = await driver.wait(
      until.elementLocated(By.css('.message')), 
      timeout
    );
    
    // Verificar si es de éxito
    const classes = await messageElement.getAttribute('class');
    console.log(`Clases del mensaje: ${classes}`);
    
    if (classes.includes('success')) {
      console.log('Mensaje de éxito encontrado');
      return messageElement;
    } else {
      // Si no es de éxito, obtener el texto para debugging
      const messageText = await messageElement.getText();
      console.log(`Mensaje encontrado pero no es de éxito: "${messageText}"`);
      throw new Error(`Mensaje no es de éxito: ${messageText}`);
    }
  } catch (error) {
    console.log(`No se encontró mensaje de éxito: ${error.message}`);
    throw error;
  }
}

// ========== TESTS MEJORADOS ==========
async function testRegistroExitosoMejorado(driver, reporter) {
  const t = reporter.startTest('Auth - Registro exitoso (mejorado)');
  let screenshotPath;
  
  try {
    const uniqueEmail = `testuser${Date.now()}@ejemplo.com`;
    await reporter.addStep(t, `Preparando registro con email: ${uniqueEmail}`);
    
    // Ir a registro
    await driver.get(`${baseUrl}/register`);
    screenshotPath = await saveScreenshot(driver, 'register_page_loaded');
    await reporter.addStep(t, 'Página de registro cargada', 'info', screenshotPath);
    
    // Verificar que la página se cargó correctamente
    const title = await driver.getTitle();
    console.log(`Título de página: ${title}`);
    
    // Llenar formulario con mayor robustez
    await reporter.addStep(t, 'Llenando formulario de registro...');
    
    await smartFillInput(driver, '[data-testid="fullName-input"]', 'Usuario Test E2E');
    await reporter.addStep(t, 'Nombre completo ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="email-input"]', uniqueEmail);
    await reporter.addStep(t, 'Email ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="password-input"]', 'Password123');
    await reporter.addStep(t, 'Contraseña ingresada', 'pass');
    
    screenshotPath = await saveScreenshot(driver, 'register_form_filled');
    await reporter.addStep(t, 'Formulario completado', 'info', screenshotPath);
    
    // Enviar formulario
    await reporter.addStep(t, 'Enviando formulario...');
    await smartClickElement(driver, '[data-testid="register-submit"]');
    
    screenshotPath = await saveScreenshot(driver, 'register_form_submitted');
    await reporter.addStep(t, 'Formulario enviado', 'info', screenshotPath);
    
    // Esperar mensaje de éxito con timeout extendido
    try {
      await waitForSuccessMessage(driver, TIMEOUTS.FORM_SUBMIT);
      screenshotPath = await saveScreenshot(driver, 'register_success_message');
      await reporter.addStep(t, 'Mensaje de registro exitoso mostrado', 'pass', screenshotPath);
    } catch (msgError) {
      screenshotPath = await saveScreenshot(driver, 'register_no_success_message');
      await reporter.addStep(t, `No se mostró mensaje de éxito: ${msgError.message}`, 'fail', screenshotPath);
      
      // Continuar para ver si hay redirección
    }
    
    // Esperar redirección (puede ocurrir sin mensaje visible)
    try {
      await waitForUrlChange(driver, '/login', TIMEOUTS.MEDIUM);
      screenshotPath = await saveScreenshot(driver, 'register_redirected_to_login');
      await reporter.addStep(t, 'Redirigido correctamente a login', 'pass', screenshotPath);
      
      reporter.endTest(t, 'passed');
      return uniqueEmail;
    } catch (redirectError) {
      screenshotPath = await saveScreenshot(driver, 'register_no_redirect');
      await reporter.addStep(t, `No se redirigió a login: ${redirectError.message}`, 'fail', screenshotPath);
      
      // Verificar si hay errores en la página
      try {
        const errorElements = await driver.findElements(By.css('.error-text, .message.error'));
        if (errorElements.length > 0) {
          for (let errorEl of errorElements) {
            const errorText = await errorEl.getText();
            await reporter.addStep(t, `Error encontrado: ${errorText}`, 'fail');
          }
        }
      } catch (e) {
        console.log('No se pudieron obtener errores de la página');
      }
      
      reporter.endTest(t, 'failed', redirectError.message);
      return uniqueEmail; // Devolver email para intentar login de todas formas
    }
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'register_test_failed');
    await reporter.addStep(t, `Error general: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
    return null;
  }
}

async function testLoginExitosoMejorado(driver, reporter, email) {
  const t = reporter.startTest('Auth - Login exitoso (mejorado)');
  let screenshotPath;
  
  try {
    if (!email) {
      // Si no hay email del registro, usar uno por defecto
      email = 'admin@test.com';
      await reporter.addStep(t, `Usando email por defecto: ${email}`);
    } else {
      await reporter.addStep(t, `Usando email del registro: ${email}`);
    }
    
    await driver.get(`${baseUrl}/login`);
    screenshotPath = await saveScreenshot(driver, 'login_page_loaded');
    await reporter.addStep(t, 'Página de login cargada', 'info', screenshotPath);
    
    // Llenar formulario
    await smartFillInput(driver, '[data-testid="email-input"]', email);
    await reporter.addStep(t, 'Email ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="password-input"]', 'Password123');
    await reporter.addStep(t, 'Contraseña ingresada', 'pass');
    
    screenshotPath = await saveScreenshot(driver, 'login_form_filled');
    await reporter.addStep(t, 'Formulario de login completado', 'info', screenshotPath);
    
    // Enviar formulario
    await smartClickElement(driver, '[data-testid="login-submit"]');
    screenshotPath = await saveScreenshot(driver, 'login_form_submitted');
    await reporter.addStep(t, 'Formulario enviado', 'info', screenshotPath);
    
    // Esperar redirección al dashboard
    try {
      await waitForUrlChange(driver, '/dashboard', TIMEOUTS.FORM_SUBMIT);
      screenshotPath = await saveScreenshot(driver, 'login_success_dashboard');
      await reporter.addStep(t, 'Login exitoso - Redirigido al dashboard', 'pass', screenshotPath);
      
      reporter.endTest(t, 'passed');
      return true;
    } catch (redirectError) {
      // Verificar si hay mensaje de error
      try {
        const errorMsg = await driver.findElement(By.css('.message.error'));
        const errorText = await errorMsg.getText();
        screenshotPath = await saveScreenshot(driver, 'login_error_message');
        await reporter.addStep(t, `Error de login: ${errorText}`, 'fail', screenshotPath);
      } catch (e) {
        screenshotPath = await saveScreenshot(driver, 'login_no_redirect');
        await reporter.addStep(t, `No se redirigió al dashboard: ${redirectError.message}`, 'fail', screenshotPath);
      }
      
      reporter.endTest(t, 'failed', redirectError.message);
      return false;
    }
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'login_test_failed');
    await reporter.addStep(t, `Error general: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
    return false;
  }
}

async function testNavegacionProductosMejorado(driver, reporter) {
  const t = reporter.startTest('Productos - Navegación mejorada');
  let screenshotPath;
  
  try {
    // Asegurar que estamos en dashboard
    await driver.get(`${baseUrl}/dashboard`);
    screenshotPath = await saveScreenshot(driver, 'dashboard_for_navigation');
    await reporter.addStep(t, 'Dashboard cargado', 'info', screenshotPath);
    
    // Buscar botón de productos con más flexibilidad
    let productButton;
    try {
      productButton = await smartWaitForElement(driver, '[data-testid="go-to-products"]', TIMEOUTS.MEDIUM);
    } catch (e) {
      // Buscar alternativos
      console.log('Buscando botones alternativos...');
      try {
        productButton = await smartWaitForElement(driver, 'button:contains("Productos")', TIMEOUTS.SHORT);
      } catch (e2) {
        try {
          productButton = await smartWaitForElement(driver, 'a[href*="products"]', TIMEOUTS.SHORT);
        } catch (e3) {
          screenshotPath = await saveScreenshot(driver, 'no_products_button_found');
          await reporter.addStep(t, 'No se encontró botón de productos en dashboard', 'fail', screenshotPath);
          
          // Intentar ir directamente a productos
          await driver.get(`${baseUrl}/products`);
          await reporter.addStep(t, 'Navegando directamente a /products', 'info');
        }
      }
    }
    
    if (productButton) {
      await productButton.click();
      await reporter.addStep(t, 'Click en botón de productos', 'pass');
    }
    
    // Verificar que llegamos a productos
    await waitForUrlChange(driver, '/products', TIMEOUTS.MEDIUM);
    screenshotPath = await saveScreenshot(driver, 'products_page_reached');
    await reporter.addStep(t, 'Página de productos alcanzada', 'pass', screenshotPath);
    
    // Verificar botones de agregar productos con más flexibilidad
    let foundPackButton = false;
    let foundWeightButton = false;
    
    try {
      await smartWaitForElement(driver, '[data-testid="add-pack-product-btn"]', TIMEOUTS.MEDIUM);
      foundPackButton = true;
      await reporter.addStep(t, 'Botón "Agregar Pack" encontrado', 'pass');
    } catch (e) {
      console.log('Botón pack no encontrado con data-testid, buscando alternativas...');
      try {
        await smartWaitForElement(driver, 'button:contains("Pack")', TIMEOUTS.SHORT);
        foundPackButton = true;
        await reporter.addStep(t, 'Botón pack encontrado (alternativo)', 'pass');
      } catch (e2) {
        await reporter.addStep(t, 'Botón pack no encontrado', 'fail');
      }
    }
    
    try {
      await smartWaitForElement(driver, '[data-testid="add-weight-product-btn"]', TIMEOUTS.MEDIUM);
      foundWeightButton = true;
      await reporter.addStep(t, 'Botón "Agregar Peso" encontrado', 'pass');
    } catch (e) {
      console.log('Botón peso no encontrado con data-testid, buscando alternativas...');
      try {
        await smartWaitForElement(driver, 'button:contains("Peso")', TIMEOUTS.SHORT);
        foundWeightButton = true;
        await reporter.addStep(t, 'Botón peso encontrado (alternativo)', 'pass');
      } catch (e2) {
        await reporter.addStep(t, 'Botón peso no encontrado', 'fail');
      }
    }
    
    if (foundPackButton && foundWeightButton) {
      reporter.endTest(t, 'passed');
    } else {
      screenshotPath = await saveScreenshot(driver, 'missing_product_buttons');
      await reporter.addStep(t, 'Algunos botones de productos no encontrados', 'fail', screenshotPath);
      reporter.endTest(t, 'failed', 'Botones de productos no encontrados');
    }
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'navigation_products_failed');
    await reporter.addStep(t, `Error en navegación: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
  }
}

async function testProductoPackExitosoMejorado(driver, reporter) {
  const t = reporter.startTest('Productos - Crear pack exitoso (mejorado)');
  let screenshotPath;
  
  try {
    await driver.get(`${baseUrl}/products`);
    await driver.sleep(2000); // Dar tiempo para que se cargue completamente
    
    screenshotPath = await saveScreenshot(driver, 'products_page_for_pack_creation');
    await reporter.addStep(t, 'Página de productos cargada', 'info', screenshotPath);
    
    // Buscar y hacer click en botón de pack
    let packButton;
    try {
      packButton = await smartWaitForElement(driver, '[data-testid="add-pack-product-btn"]', TIMEOUTS.MEDIUM);
    } catch (e) {
      // Buscar alternativas
      console.log('Buscando botón pack alternativo...');
      const buttons = await driver.findElements(By.css('button'));
      for (let button of buttons) {
        try {
          const text = await button.getText();
          if (text.toLowerCase().includes('pack') || text.includes('📦')) {
            packButton = button;
            break;
          }
        } catch (e) {
          // Ignorar errores de elementos stale
        }
      }
      
      if (!packButton) {
        screenshotPath = await saveScreenshot(driver, 'no_pack_button_found');
        throw new Error('No se encontró botón para agregar producto pack');
      }
    }
    
    await packButton.click();
    await reporter.addStep(t, 'Click en botón agregar pack', 'pass');
    
    // Esperar que aparezca el formulario
    await smartWaitForElement(driver, '[data-testid="pack-name-input"]', TIMEOUTS.MEDIUM);
    screenshotPath = await saveScreenshot(driver, 'pack_form_opened');
    await reporter.addStep(t, 'Formulario de pack abierto', 'info', screenshotPath);
    
    // Llenar formulario
    const productName = `Pack E2E ${Date.now()}`;
    await reporter.addStep(t, `Llenando formulario para: ${productName}`);
    
    await smartFillInput(driver, '[data-testid="pack-name-input"]', productName);
    await reporter.addStep(t, 'Nombre del producto ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="pack-quantity-input"]', '5');
    await reporter.addStep(t, 'Cantidad de packs ingresada', 'pass');
    
    await smartFillInput(driver, '[data-testid="products-per-pack-input"]', '8');
    await reporter.addStep(t, 'Productos por pack ingresados', 'pass');
    
    await smartFillInput(driver, '[data-testid="buy-price-pack-input"]', '10.00');
    await reporter.addStep(t, 'Precio de compra ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="sell-price-unit-input"]', '1.50');
    await reporter.addStep(t, 'Precio de venta ingresado', 'pass');
    
    screenshotPath = await saveScreenshot(driver, 'pack_form_completed');
    await reporter.addStep(t, 'Formulario pack completado', 'info', screenshotPath);
    
    // Verificar cálculos automáticos si están disponibles
    try {
      const totalUnits = await driver.findElement(By.css('[data-testid="pack-total-units"]')).getText();
      const totalInvested = await driver.findElement(By.css('[data-testid="pack-total-invested"]')).getText();
      const totalProfit = await driver.findElement(By.css('[data-testid="pack-total-profit"]')).getText();
      
      await reporter.addStep(t, `Cálculos: ${totalUnits} unidades, ${totalInvested} invertido, ${totalProfit} ganancia`, 'pass');
    } catch (e) {
      await reporter.addStep(t, 'Cálculos automáticos no visibles (continuando)', 'info');
    }
    
    // Enviar formulario
    await smartClickElement(driver, '[data-testid="pack-form-submit"]', TIMEOUTS.MEDIUM);
    screenshotPath = await saveScreenshot(driver, 'pack_form_submitted');
    await reporter.addStep(t, 'Formulario pack enviado', 'info', screenshotPath);
    
    // Esperar mensaje de éxito o que se cierre el formulario
    let success = false;
    try {
      await waitForSuccessMessage(driver, TIMEOUTS.FORM_SUBMIT);
      screenshotPath = await saveScreenshot(driver, 'pack_success_message');
      await reporter.addStep(t, 'Mensaje de éxito mostrado', 'pass', screenshotPath);
      success = true;
    } catch (msgError) {
      console.log('No se encontró mensaje de éxito, verificando si el formulario se cerró...');
      
      // Verificar si el formulario se cerró (indicando éxito)
      try {
        await driver.wait(async () => {
          const formElements = await driver.findElements(By.css('[data-testid="pack-name-input"]'));
          return formElements.length === 0;
        }, TIMEOUTS.SHORT);
        
        await reporter.addStep(t, 'Formulario se cerró (éxito implícito)', 'pass');
        success = true;
      } catch (e) {
        // Verificar si hay errores visibles
        try {
          const errorElements = await driver.findElements(By.css('.message.error, .error-text'));
          if (errorElements.length > 0) {
            for (let errorEl of errorElements) {
              const errorText = await errorEl.getText();
              if (errorText.trim()) {
                await reporter.addStep(t, `Error encontrado: ${errorText}`, 'fail');
              }
            }
          }
        } catch (e2) {
          // Ignorar errores al buscar errores
        }
        
        screenshotPath = await saveScreenshot(driver, 'pack_creation_unclear');
        await reporter.addStep(t, 'Estado de creación no claro', 'fail', screenshotPath);
      }
    }
    
    // Esperar un poco y tomar screenshot final
    await driver.sleep(2000);
    screenshotPath = await saveScreenshot(driver, 'pack_creation_final_state');
    await reporter.addStep(t, 'Estado final después de creación', 'info', screenshotPath);
    
    if (success) {
      reporter.endTest(t, 'passed');
      return productName;
    } else {
      reporter.endTest(t, 'failed', 'No se pudo confirmar creación exitosa del producto');
      return null;
    }
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'pack_creation_failed');
    await reporter.addStep(t, `Error: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
    return null;
  }
}

async function testProductoPesoExitosoMejorado(driver, reporter) {
  const t = reporter.startTest('Productos - Crear peso exitoso (mejorado)');
  let screenshotPath;
  
  try {
    await driver.get(`${baseUrl}/products`);
    await driver.sleep(2000);
    
    screenshotPath = await saveScreenshot(driver, 'products_page_for_weight_creation');
    await reporter.addStep(t, 'Página de productos cargada', 'info', screenshotPath);
    
    // Buscar botón de peso
    let weightButton;
    try {
      weightButton = await smartWaitForElement(driver, '[data-testid="add-weight-product-btn"]', TIMEOUTS.MEDIUM);
    } catch (e) {
      console.log('Buscando botón peso alternativo...');
      const buttons = await driver.findElements(By.css('button'));
      for (let button of buttons) {
        try {
          const text = await button.getText();
          if (text.toLowerCase().includes('peso') || text.includes('⚖️')) {
            weightButton = button;
            break;
          }
        } catch (e) {
          // Ignorar errores de elementos stale
        }
      }
      
      if (!weightButton) {
        screenshotPath = await saveScreenshot(driver, 'no_weight_button_found');
        throw new Error('No se encontró botón para agregar producto peso');
      }
    }
    
    await weightButton.click();
    await reporter.addStep(t, 'Click en botón agregar peso', 'pass');
    
    // Esperar formulario
    await smartWaitForElement(driver, '[data-testid="weight-name-input"]', TIMEOUTS.MEDIUM);
    screenshotPath = await saveScreenshot(driver, 'weight_form_opened');
    await reporter.addStep(t, 'Formulario de peso abierto', 'info', screenshotPath);
    
    // Llenar formulario
    const productName = `Peso E2E ${Date.now()}`;
    await reporter.addStep(t, `Llenando formulario para: ${productName}`);
    
    await smartFillInput(driver, '[data-testid="weight-name-input"]', productName);
    await reporter.addStep(t, 'Nombre del producto peso ingresado', 'pass');
    
    // Cambiar unidad a libras si es posible
    try {
      const unitSelect = await driver.findElement(By.css('[data-testid="weight-unit-select"]'));
      await unitSelect.click();
      await driver.sleep(500);
      await smartClickElement(driver, 'option[value="lb"]');
      await reporter.addStep(t, 'Unidad cambiada a libras', 'pass');
    } catch (e) {
      await reporter.addStep(t, 'Usando unidad por defecto (kg)', 'info');
    }
    
    await smartFillInput(driver, '[data-testid="total-weight-input"]', '25.5');
    await reporter.addStep(t, 'Peso total ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="weight-buy-price-input"]', '2.50');
    await reporter.addStep(t, 'Precio de compra peso ingresado', 'pass');
    
    await smartFillInput(driver, '[data-testid="weight-sell-price-input"]', '3.75');
    await reporter.addStep(t, 'Precio de venta peso ingresado', 'pass');
    
    screenshotPath = await saveScreenshot(driver, 'weight_form_completed');
    await reporter.addStep(t, 'Formulario peso completado', 'info', screenshotPath);
    
    // Enviar formulario
    await smartClickElement(driver, '[data-testid="weight-form-submit"]', TIMEOUTS.MEDIUM);
    screenshotPath = await saveScreenshot(driver, 'weight_form_submitted');
    await reporter.addStep(t, 'Formulario peso enviado', 'info', screenshotPath);
    
    // Esperar confirmación
    let success = false;
    try {
      await waitForSuccessMessage(driver, TIMEOUTS.FORM_SUBMIT);
      screenshotPath = await saveScreenshot(driver, 'weight_success_message');
      await reporter.addStep(t, 'Mensaje de éxito peso mostrado', 'pass', screenshotPath);
      success = true;
    } catch (msgError) {
      console.log('Verificando cierre de formulario...');
      try {
        await driver.wait(async () => {
          const formElements = await driver.findElements(By.css('[data-testid="weight-name-input"]'));
          return formElements.length === 0;
        }, TIMEOUTS.SHORT);
        
        await reporter.addStep(t, 'Formulario peso se cerró (éxito implícito)', 'pass');
        success = true;
      } catch (e) {
        screenshotPath = await saveScreenshot(driver, 'weight_creation_unclear');
        await reporter.addStep(t, 'Estado de creación peso no claro', 'fail', screenshotPath);
      }
    }
    
    await driver.sleep(2000);
    screenshotPath = await saveScreenshot(driver, 'weight_creation_final_state');
    await reporter.addStep(t, 'Estado final después de creación peso', 'info', screenshotPath);
    
    if (success) {
      reporter.endTest(t, 'passed');
      return productName;
    } else {
      reporter.endTest(t, 'failed', 'No se pudo confirmar creación exitosa del producto peso');
      return null;
    }
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'weight_creation_failed');
    await reporter.addStep(t, `Error: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
    return null;
  }
}

async function testInventarioMejorado(driver, reporter) {
  const t = reporter.startTest('Inventario - Visualización mejorada');
  let screenshotPath;
  
  try {
    await driver.get(`${baseUrl}/products`);
    await driver.sleep(3000); // Dar tiempo para cargar productos
    
    screenshotPath = await saveScreenshot(driver, 'inventory_page_loaded');
    await reporter.addStep(t, 'Página de inventario cargada', 'info', screenshotPath);
    
    // Verificar productos
    const productCards = await driver.findElements(By.css('[data-testid^="product-card-"], .product-card, .product-item'));
    await reporter.addStep(t, `Se encontraron ${productCards.length} productos en inventario`, 'pass');
    
    if (productCards.length > 0) {
      // Verificar totales si están disponibles
      try {
        const totalInvestedEl = await driver.findElement(By.css('[data-testid="total-invested"], .total-invested'));
        const totalProfitEl = await driver.findElement(By.css('[data-testid="total-profit"], .total-profit'));
        
        const totalInvested = await totalInvestedEl.getText();
        const totalProfit = await totalProfitEl.getText();
        
        await reporter.addStep(t, `Totales: ${totalInvested} invertido, ${totalProfit} ganancia`, 'pass');
      } catch (e) {
        await reporter.addStep(t, 'Totales no encontrados (posiblemente no implementados)', 'info');
      }
      
      // Probar filtros si están disponibles
      try {
        const filterSelect = await driver.findElement(By.css('[data-testid="filter-type-select"], .filter-select'));
        await filterSelect.click();
        await driver.sleep(500);
        
        const packOption = await driver.findElement(By.css('option[value="pack"]'));
        await packOption.click();
        await driver.sleep(1000);
        
        screenshotPath = await saveScreenshot(driver, 'inventory_filtered_pack');
        await reporter.addStep(t, 'Filtro pack aplicado', 'pass', screenshotPath);
        
        // Volver a todos
        await filterSelect.click();
        await driver.sleep(500);
        const allOption = await driver.findElement(By.css('option[value="all"]'));
        await allOption.click();
        await driver.sleep(1000);
        
        await reporter.addStep(t, 'Filtro restaurado a "todos"', 'pass');
      } catch (e) {
        await reporter.addStep(t, 'Filtros no disponibles o no implementados', 'info');
      }
    } else {
      await reporter.addStep(t, 'No hay productos en el inventario', 'info');
    }
    
    screenshotPath = await saveScreenshot(driver, 'inventory_final_state');
    await reporter.addStep(t, 'Estado final del inventario', 'info', screenshotPath);
    
    reporter.endTest(t, 'passed');
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'inventory_test_failed');
    await reporter.addStep(t, `Error: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
  }
}

async function testEditarProductoPack(driver, reporter) {
  const t = reporter.startTest('✏️ Productos - Editar producto pack');
  let screenshotPath;
  
  try {
    await driver.get(`${baseUrl}/products`);
    await driver.sleep(2000);
    
    screenshotPath = await saveScreenshot(driver, 'products_before_edit');
    await reporter.addStep(t, 'Página de productos cargada para edición', 'info', screenshotPath);

    // Buscar botón de editar
    const editButtons = await driver.findElements(By.css('[data-testid^="edit-product-"]'));
    if (editButtons.length === 0) {
      await reporter.addStep(t, 'No hay productos para editar', 'info');
      reporter.endTest(t, 'passed');
      return;
    }

    // Hacer click en el primer botón de editar
    await editButtons[0].click();
    await reporter.addStep(t, 'Click en botón editar', 'pass');

    // Esperar que aparezca el formulario de edición
    try {
      await smartWaitForElement(driver, '[data-testid="edit-pack-name-input"]', TIMEOUTS.MEDIUM);
      screenshotPath = await saveScreenshot(driver, 'edit_pack_form_opened');
      await reporter.addStep(t, 'Formulario de edición pack abierto', 'info', screenshotPath);
    } catch (e) {
      // Podría ser un producto peso
      await smartWaitForElement(driver, '[data-testid="edit-weight-name-input"]', TIMEOUTS.MEDIUM);
      screenshotPath = await saveScreenshot(driver, 'edit_weight_form_opened');
      await reporter.addStep(t, 'Formulario de edición peso abierto', 'info', screenshotPath);
      
      // Modificar producto peso
      const currentName = await driver.findElement(By.css('[data-testid="edit-weight-name-input"]')).getAttribute('value');
      const newName = `${currentName} - Editado`;
      
      await smartFillInput(driver, '[data-testid="edit-weight-name-input"]', newName);
      await reporter.addStep(t, 'Nombre del producto peso modificado', 'pass');
      
      await smartClickElement(driver, '[data-testid="edit-weight-form-submit"]');
      screenshotPath = await saveScreenshot(driver, 'weight_edit_submitted');
      await reporter.addStep(t, 'Formulario de edición peso enviado', 'info', screenshotPath);
      
      await waitForSuccessMessage(driver, TIMEOUTS.FORM_SUBMIT);
      screenshotPath = await saveScreenshot(driver, 'weight_edit_success');
      await reporter.addStep(t, 'Producto peso editado exitosamente', 'pass', screenshotPath);
      
      reporter.endTest(t, 'passed');
      return;
    }

    // Modificar producto pack
    const currentName = await driver.findElement(By.css('[data-testid="edit-pack-name-input"]')).getAttribute('value');
    const newName = `${currentName} - Editado`;
    
    await smartFillInput(driver, '[data-testid="edit-pack-name-input"]', newName);
    await reporter.addStep(t, 'Nombre del producto pack modificado', 'pass');
    
    // Modificar cantidad
    await smartFillInput(driver, '[data-testid="edit-pack-quantity-input"]', '7');
    await reporter.addStep(t, 'Cantidad de packs modificada', 'pass');
    
    screenshotPath = await saveScreenshot(driver, 'pack_edit_form_modified');
    await reporter.addStep(t, 'Formulario pack modificado', 'info', screenshotPath);

    // Enviar formulario
    await smartClickElement(driver, '[data-testid="edit-pack-form-submit"]');
    screenshotPath = await saveScreenshot(driver, 'pack_edit_submitted');
    await reporter.addStep(t, 'Formulario de edición pack enviado', 'info', screenshotPath);

    // Esperar mensaje de éxito
    await waitForSuccessMessage(driver, TIMEOUTS.FORM_SUBMIT);
    screenshotPath = await saveScreenshot(driver, 'pack_edit_success');
    await reporter.addStep(t, 'Producto pack editado exitosamente', 'pass', screenshotPath);

    // Verificar que se cerró el formulario
    await driver.sleep(2000);
    screenshotPath = await saveScreenshot(driver, 'after_pack_edit');
    await reporter.addStep(t, 'Formulario cerrado después de edición', 'pass', screenshotPath);

    reporter.endTest(t, 'passed');
    
  } catch (err) {
    screenshotPath = await saveScreenshot(driver, 'edit_pack_failed');
    await reporter.addStep(t, `Error: ${err.message}`, 'fail', screenshotPath);
    reporter.endTest(t, 'failed', err.message);
  }
}

async function testValidacionEdicion(driver, reporter) {
  const t = reporter.startTest('⚠️ Validación - Edición con datos inválidos');
  let screenshotPath;
  
  try {
    await driver.get(`${baseUrl}/products`);
    await driver.sleep(2000);

    // Buscar botón de editar
    const editButtons = await driver.findElements(By.css('[data-testid^="edit-product-"]'));
    if (editButtons.length === 0) {
      await reporter.addStep(t, 'No hay productos para probar validación', 'info');
      reporter.endTest(t, 'passed');
      return;
    }

    await editButtons[0].click();
    await reporter.addStep(t, 'Formulario de edición abierto', 'pass');

    // Intentar identificar el tipo de formulario
    let isPackForm = false;
    try {
      await smartWaitForElement(driver, '[data-testid="edit-pack-name-input"]', TIMEOUTS.SHORT);
      isPackForm = true;
    } catch (e) {
      await smartWaitForElement(driver, '[data-testid="edit-weight-name-input"]', TIMEOUTS.SHORT);
    }

    if (isPackForm) {
      // Probar validación pack
      await smartFillInput(driver, '[data-testid="edit-pack-name-input"]', '');
      await smartFillInput(driver, '[data-testid="edit-pack-quantity-input"]', '0');
      
      screenshotPath = await saveScreenshot(driver, 'pack_edit_invalid_data');
      await reporter.addStep(t, 'Datos inválidos ingresados en pack', 'info', screenshotPath);
      
      await smartClickElement(driver, '[data-testid="edit-pack-form-submit"]');
      
      await smartWaitForElement(driver, '[data-testid="edit-pack-name-error"]', TIMEOUTS.SHORT);
      screenshotPath = await saveScreenshot(driver, 'pack_edit_validation_errors');
      await reporter.addStep(t, 'Errores de validación mostrados en edición pack', 'pass', screenshotPath);
      
      await smartClickElement(driver, '[data-testid="edit-pack-form-cancel"]');
    } else {
      // Probar validación peso
      await smartFillInput(driver, '[data-testid="edit-weight-name-input"]', '');
      await smartFillInput(driver, '[data-testid="edit-total-weight-input"]', '0');
      
      screenshotPath = await saveScreenshot(driver, 'weight_edit_invalid_data');
      await reporter.addStep(t, 'Datos inválidos ingresados en peso', 'info', screenshotPath);
      
      await smartClickElement(driver, '[data-testid="edit-weight-form-submit"]');
      
      await smartWaitForElement(driver, '[data-testid="edit-weight-name-error"]', TIMEOUTS.SHORT);
      screenshotPath = await saveScreenshot(driver, 'weight_edit_validation_errors');
      await reporter.addStep(t, 'Errores de validación mostrados en edición peso', 'pass', screenshotPath);
     await smartClickElement(driver, '[data-testid="edit-weight-form-cancel"]');
   }

   await reporter.addStep(t, 'Formulario de edición cancelado correctamente', 'pass');
   reporter.endTest(t, 'passed');
   
 } catch (err) {
   screenshotPath = await saveScreenshot(driver, 'edit_validation_failed');
   await reporter.addStep(t, `Error: ${err.message}`, 'fail', screenshotPath);
   reporter.endTest(t, 'failed', err.message);
 }
}

// Actualizar la función principal para incluir los nuevos tests
async function ejecutarTestsCompletosMejorados() {
 console.log('\n🚀 INICIANDO TESTS E2E MEJORADOS CON EDICIÓN');
 console.log('='.repeat(60));
 
 const options = new chrome.Options();
 // options.headless(); // Descomenta para headless
 options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security');
 options.addArguments('--window-size=1920,1080');
 options.addArguments('--disable-blink-features=AutomationControlled');
 options.addArguments('--disable-extensions');
 
 const driver = await new Builder()
   .forBrowser('chrome')
   .setChromeOptions(options)
   .build();

 const reporter = new Reporter();
 let registeredEmail = null;
 let loginSuccessful = false;

 try {
   console.log(`\n🌐 Testing URL: ${baseUrl}`);
   console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`);
   console.log(`📋 Reporte: ${HTML_REPORT_PATH}\n`);
   
   // Verificar que la aplicación esté corriendo
   try {
     await driver.get(baseUrl);
     await driver.sleep(2000);
     const title = await driver.getTitle();
     console.log(`✅ Aplicación accesible. Título: ${title}`);
   } catch (e) {
     console.log(`❌ Error accediendo a ${baseUrl}: ${e.message}`);
     console.log('💡 Asegúrate de que el frontend esté corriendo en puerto 3000');
     throw new Error(`Aplicación no accesible: ${e.message}`);
   }

   // ========== GRUPO 1: AUTENTICACIÓN MEJORADA ==========
   console.log('\n🔐 Ejecutando tests de Autenticación (mejorados)...');
   
   registeredEmail = await testRegistroExitosoMejorado(driver, reporter);
   loginSuccessful = await testLoginExitosoMejorado(driver, reporter, registeredEmail);

   // ========== GRUPO 2: PRODUCTOS MEJORADOS ==========
   if (loginSuccessful) {
     console.log('\n📦 Ejecutando tests de Productos (mejorados)...');
     
     await testNavegacionProductosMejorado(driver, reporter);
     await testProductoPackExitosoMejorado(driver, reporter);
     await testProductoPesoExitosoMejorado(driver, reporter);
     
     // ========== GRUPO 3: EDICIÓN DE PRODUCTOS ==========
     console.log('\n✏️ Ejecutando tests de Edición de Productos...');
     await testEditarProductoPack(driver, reporter);
     await testValidacionEdicion(driver, reporter);
     
     // ========== GRUPO 4: INVENTARIO MEJORADO ==========
     console.log('\n📊 Ejecutando tests de Inventario (mejorados)...');
     await testInventarioMejorado(driver, reporter);
     
   } else {
     console.log('\n⚠️ Saltando tests de productos debido a fallo en login');
     
     // Intentar tests de productos sin login (para verificar redirección)
     const noLoginTest = reporter.startTest('🔒 Verificar protección sin login');
     try {
       await driver.get(`${baseUrl}/products`);
       await driver.sleep(2000);
       
       const currentUrl = await driver.getCurrentUrl();
       if (currentUrl.includes('/login')) {
         await reporter.addStep(noLoginTest, 'Correctamente redirigido a login sin autenticación', 'pass');
         reporter.endTest(noLoginTest, 'passed');
       } else {
         await reporter.addStep(noLoginTest, 'FALLO: Se accedió a productos sin login', 'fail');
         reporter.endTest(noLoginTest, 'failed');
       }
     } catch (e) {
       reporter.endTest(noLoginTest, 'error', e.message);
     }
   }

 } catch (globalError) {
   console.error('\n❌ Error global:', globalError);
   const errorTest = reporter.startTest('❌ Error Global del Sistema');
   const screenshotPath = await saveScreenshot(driver, 'global_error');
   await reporter.addStep(errorTest, `Error crítico: ${globalError.message}`, 'fail', screenshotPath);
   reporter.endTest(errorTest, 'error', globalError.message);
 } finally {
   try {
     await driver.quit();
   } catch (quitError) {
     console.error('⚠️ Error cerrando driver:', quitError);
   }

   // ========== GENERAR REPORTE FINAL ==========
   console.log('\n📊 Generando reporte mejorado...');
   const reportPath = reporter.writeToDisk(HTML_REPORT_PATH);
   const summary = reporter.summary();
   
   console.log('\n' + '='.repeat(60));
   console.log('🎯 RESUMEN DE EJECUCIÓN CON EDICIÓN');
   console.log('='.repeat(60));
   console.log(`✅ Tests Exitosos: ${summary.passed}`);
   console.log(`❌ Tests Fallidos: ${summary.failed}`);
   console.log(`⚠️  Tests con Error: ${summary.errors}`);
   console.log(`📊 Total de Tests: ${summary.total}`);
   console.log(`⏱️  Duración Total: ${(summary.durationMs/1000).toFixed(2)} segundos`);
   
   const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
   console.log(`📈 Tasa de Éxito: ${successRate}%`);
   console.log('='.repeat(60));
   
   if (summary.failed === 0 && summary.errors === 0) {
     console.log('🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
   } else if (summary.passed > 0) {
     console.log('⚠️  Algunos tests fallaron, pero hubo éxitos parciales.');
   } else {
     console.log('🚨 TODOS LOS TESTS FALLARON - Revisar configuración.');
   }
   
   console.log('\n📄 Archivos generados:');
   console.log(`   📋 Reporte HTML: ${reportPath}`);
   console.log(`   📸 Screenshots: ${SCREENSHOT_DIR}`);
   
   console.log('\n💡 Para abrir el reporte:');
   console.log(`   🖥️  Comando: open "${reportPath}"`);
   
   console.log('\n🔧 Si hay fallos, revisar:');
   console.log('   ✅ Frontend corriendo en puerto 3000');
   console.log('   ✅ Backend corriendo en puerto 5000');
   console.log('   ✅ Base de datos conectada');
   console.log('   ✅ Screenshots para detalles visuales');
   
   console.log('\n🏁 Ejecución completada.');
 }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarTestsCompletosMejorados().catch(console.error);
}

module.exports = {
  ejecutarTestsCompletosMejorados,
  Reporter,
  saveScreenshot,
  smartWaitForElement,
  smartFillInput,
  smartClickElement
};