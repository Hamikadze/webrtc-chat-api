const newMessage = ({user, message}) => {
    return {user: user.name, data: {text: message, time: new Date().getTime()}}
}

const newServerMessage = ({message}) => {
    return newMessage({user: {name: 'SERVER'}, message});
}

module.exports = {newMessage, newServerMessage};