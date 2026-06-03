import { createI18n } from 'vue-i18n';
import en from './en.js'
import zh from './zh.js'

const browserLang = navigator.language || 'en'
const locale = browserLang.startsWith('zh') ? 'zh' : 'en'

const i18n = createI18n({
    legacy: false,
    locale,
    messages: {
        zh,
        en
    },
});

export default i18n;
