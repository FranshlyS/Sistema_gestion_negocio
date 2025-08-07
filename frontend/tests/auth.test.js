const { createDriver, By, until } = require('./selenium.config');

describe('Pruebas de Autenticación con Selenium', () => {
  let driver;
  const baseUrl = 'http://localhost:3000';

  beforeAll(async () => {
    driver = createDriver();
    await driver.manage().window().maximize();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Registro de Usuario', () => {
    test('Debería mostrar errores de validación en campos vacíos', async () => {
      await driver.get(`${baseUrl}/register`);
      
      // Intentar enviar formulario vacío
      const submitButton = await driver.findElement(By.css('[data-testid="register-submit"]'));
      await submitButton.click();
      
      // Verificar que aparecen mensajes de error
      await driver.wait(until.elementLocated(By.css('[data-testid="fullName-error"]')), 5000);
      
      const fullNameError = await driver.findElement(By.css('[data-testid="fullName-error"]'));
      const emailError = await driver.findElement(By.css('[data-testid="email-error"]'));
      const passwordError = await driver.findElement(By.css('[data-testid="password-error"]'));
      
      expect(await fullNameError.getText()).toContain('obligatorio');
      expect(await emailError.getText()).toContain('obligatorio');
      expect(await passwordError.getText()).toContain('obligatorio');
    });

    test('Debería validar formato de email', async () => {
      await driver.get(`${baseUrl}/register`);
      
      const emailInput = await driver.findElement(By.css('[data-testid="email-input"]'));
      await emailInput.sendKeys('email-invalido');
      
      const submitButton = await driver.findElement(By.css('[data-testid="register-submit"]'));
     await submitButton.click();
     
     await driver.wait(until.elementLocated(By.css('[data-testid="email-error"]')), 5000);
     const emailError = await driver.findElement(By.css('[data-testid="email-error"]'));
     
     expect(await emailError.getText()).toContain('no es válido');
   });

   test('Debería validar contraseña débil', async () => {
     await driver.get(`${baseUrl}/register`);
     
     const passwordInput = await driver.findElement(By.css('[data-testid="password-input"]'));
     await passwordInput.sendKeys('123');
     
     const submitButton = await driver.findElement(By.css('[data-testid="register-submit"]'));
     await submitButton.click();
     
     await driver.wait(until.elementLocated(By.css('[data-testid="password-error"]')), 5000);
     const passwordError = await driver.findElement(By.css('[data-testid="password-error"]'));
     
     expect(await passwordError.getText()).toContain('8 caracteres');
   });

   test('Debería registrar usuario exitosamente', async () => {
     await driver.get(`${baseUrl}/register`);
     
     // Llenar formulario
     await driver.findElement(By.css('[data-testid="fullName-input"]')).sendKeys('Juan Pérez');
     await driver.findElement(By.css('[data-testid="email-input"]')).sendKeys('juan@ejemplo.com');
     await driver.findElement(By.css('[data-testid="password-input"]')).sendKeys('Password123');
     
     // Enviar formulario
     const submitButton = await driver.findElement(By.css('[data-testid="register-submit"]'));
     await submitButton.click();
     
     // Esperar mensaje de éxito
     await driver.wait(until.elementLocated(By.css('.message.success')), 10000);
     const successMessage = await driver.findElement(By.css('.message.success'));
     
     expect(await successMessage.getText()).toContain('exitoso');
   });
 });

 describe('Inicio de Sesión', () => {
   test('Debería mostrar error con credenciales vacías', async () => {
     await driver.get(`${baseUrl}/login`);
     
     const submitButton = await driver.findElement(By.css('[data-testid="login-submit"]'));
     await submitButton.click();
     
     await driver.wait(until.elementLocated(By.css('[data-testid="email-error"]')), 5000);
     
     const emailError = await driver.findElement(By.css('[data-testid="email-error"]'));
     const passwordError = await driver.findElement(By.css('[data-testid="password-error"]'));
     
     expect(await emailError.getText()).toContain('obligatorio');
     expect(await passwordError.getText()).toContain('obligatorio');
   });

   test('Debería iniciar sesión exitosamente', async () => {
     await driver.get(`${baseUrl}/login`);
     
     // Llenar credenciales
     await driver.findElement(By.css('[data-testid="email-input"]')).sendKeys('juan@ejemplo.com');
     await driver.findElement(By.css('[data-testid="password-input"]')).sendKeys('Password123');
     
     // Enviar formulario
     const submitButton = await driver.findElement(By.css('[data-testid="login-submit"]'));
     await submitButton.click();
     
     // Esperar redirección al dashboard
     await driver.wait(until.urlContains('/dashboard'), 10000);
     
     const currentUrl = await driver.getCurrentUrl();
     expect(currentUrl).toContain('/dashboard');
   });

   test('Debería cerrar sesión correctamente', async () => {
     // Asegurar que estamos en el dashboard
     await driver.get(`${baseUrl}/dashboard`);
     
     // Hacer click en cerrar sesión
     const logoutButton = await driver.wait(
       until.elementLocated(By.css('[data-testid="logout-button"]')), 
       5000
     );
     await logoutButton.click();
     
     // Verificar redirección al login
     await driver.wait(until.urlContains('/login'), 5000);
     const currentUrl = await driver.getCurrentUrl();
     expect(currentUrl).toContain('/login');
   });
 });
});