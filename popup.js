document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesDiv = document.getElementById('messages');
    const webhookUrl = 'https://maysonbernard.app.n8n.cloud/webhook/ad220d5e-05be-439f-9fab-7001a17830f2';

    if (!messageInput || !sendButton) {
        console.error('Les éléments messageInput ou sendButton sont introuvables.');
        return;
    }

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            addUserMessage(message);
            sendMessageToN8n(message);
            messageInput.value = '';
        }
    });

    function addUserMessage(message) {
        const messageElement = createMessageElement(message, 'user-message');
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        saveMessageToHistory('user', message);
    }

    function addN8nMessage(message) {
        const messageElement = createMessageElement(message, 'n8n-message');
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        saveMessageToHistory('n8n', message);
    }

    function createMessageElement(message, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        messageElement.textContent = message;
        return messageElement;
    }

    function sendMessageToN8n(message) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.response) {
                addN8nMessage(data.response);
                notify(data.response);
            } else {
                addN8nMessage('Erreur : Aucune réponse de n8n.');
            }
        })
        .catch(error => {
            console.error('Erreur n8n:', error);
            addN8nMessage('Erreur : Communication avec n8n impossible.');
        });
    }

    function notify(message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/chat-bubble-128.png',
            title: 'Nouveau message de n8n',
            message: message,
        }, notificationId => {
            if (chrome.runtime.lastError) {
                console.error('Erreur lors de la création de la notification :', chrome.runtime.lastError);
            } else {
                console.log('Notification créée avec succès, ID :', notificationId);
            }
        });
    }

    function saveMessageToHistory(sender, message) {
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history.push({ sender, message });
        if (history.length > 100) {
            history.shift();
        }
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    function loadChatHistory() {
        try {
            let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
            history.forEach(item => {
                if (item.sender === 'user') {
                    addUserMessage(item.message);
                } else {
                    addN8nMessage(item.message);
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique :', error);
        }
    }

    loadChatHistory();
});