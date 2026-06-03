import http from '@/axios/index.js'

export function contactGroupList() {
    return http.get('/contactGroup/list')
}

export function contactGroupAdd(name, emails) {
    return http.post('/contactGroup/add', { name, emails })
}

export function contactGroupUpdate(groupId, name, emails) {
    return http.put('/contactGroup/update', { groupId, name, emails })
}

export function contactGroupDelete(groupId) {
    return http.delete('/contactGroup/delete', { params: { groupId } })
}
