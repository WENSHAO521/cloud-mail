import http from '@/axios/index.js';

export function backupProviders() {
    return http.get('/backup/providers');
}

export function backupConnectUrl(provider) {
    return http.get(`/backup/connect/${provider}`);
}

export function backupStatus() {
    return http.get('/backup/status');
}

export function backupDisconnect(provider) {
    return http.delete(`/backup/${provider}`);
}

export function backupStart(provider) {
    return http.post(`/backup/start/${provider}`);
}
