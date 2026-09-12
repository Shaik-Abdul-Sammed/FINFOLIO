/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'te', 'ta', 'mr'], // English, Hindi, Telugu, Tamil, Marathi
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
};
