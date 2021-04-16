const getClientInfo = msg => {
    return {
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        telegramId: msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id
    }
}

export {
    getClientInfo
}
