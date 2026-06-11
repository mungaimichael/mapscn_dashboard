import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import swTranslation from './locales/sw.json';
import { getTenantConfig } from './config/tenantConfig';

const tenantConfig = getTenantConfig();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      sw: {
        translation: swTranslation,
      },
    },
    lng: tenantConfig.defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
