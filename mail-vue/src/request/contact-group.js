import http from '@/axios/index.js'

export function contactGroupList() {
    return http.get('/contactGroup/list')
}

export function contactGroupAdd(name, contacts) {
    return http.post('/contactGroup/add', { name, contacts })
}

export function contactGroupUpdate(groupId, name, contacts) {
    return http.put('/contactGroup/update', { groupId, name, contacts })
}

export function contactGroupDelete(groupId) {
    return http.delete('/contactGroup/delete', { params: { groupId } })
}
