import zhCN from './zh-CN'
import enUS from './en-US'
import jaJP from './ja-JP'
import koKR from './ko-KR'
import zhHK from './zh-HK'
import zhTW from './zh-TW'
import ruRU from './ru-RU'
import frFR from './fr-FR'
import {createI18n} from "vue-i18n";
const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'ru-RU': ruRU,
  'fr-FR': frFR,
  zh: zhCN,
  en: enUS,
  fr: frFR
}

const i18n = createI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US',
  legacy: false,
  messages: locales
})

export default i18n
