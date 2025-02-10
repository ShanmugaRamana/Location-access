document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
  
    fetch('/location')
      .then(response => response.json())
      .then(data => {
        messageDiv.textContent = data.message;
      })
      .catch(error => {
        console.error('Error fetching message:', error);
        messageDiv.textContent = 'Error loading message.';
      });
  });
  