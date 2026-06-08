import http from '@/axios/index.js';

export function translateEmail({ text, html, source_lang, target_lang }) {
    return http.post('/translate', { text, html, source_lang, target_lang }, { noMsg: true });
}
