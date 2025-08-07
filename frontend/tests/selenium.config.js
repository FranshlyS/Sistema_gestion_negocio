const { Builder, Browser, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const createDriver = () => {
  const options = new chrome.Options();
  options.addArguments('--headless'); // Ejecutar sin interfaz gráfica
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  return new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();
};

module.exports = { createDriver, By, until };