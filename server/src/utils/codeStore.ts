interface CodeRecord {
    code: string
    expireAt: number
    attempts: number
}

const codeMap = new Map<string, CodeRecord>()

export const saveCode = (phone: string, code: string) => {
    codeMap.set(phone, {
        code,
        expireAt: Date.now() + 5 * 60 * 1000,  // 5分钟有效
        attempts: 0
    })
}

export const verifyCode = (phone: string, inputCode: string): boolean => {
    const record = codeMap.get(phone)
    if (!record) return false

    if (Date.now() > record.expireAt) {
        codeMap.delete(phone)
        return false
    }

    record.attempts++
    if (record.attempts > 5) {
        codeMap.delete(phone)
        return false
    }

    if (record.code !== inputCode) return false

    codeMap.delete(phone)  // 验证成功后立即删除
    return true
}

export const hasRecentCode = (phone: string): boolean => {
    const record = codeMap.get(phone)
    if (!record) return false
    // 60秒内不允许重复发送
    return record.expireAt - Date.now() > 4 * 60 * 1000
}
