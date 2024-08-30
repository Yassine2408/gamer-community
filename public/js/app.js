// This file can be used for client-side JavaScript
console.log('app.js loaded successfully');

document.addEventListener('DOMContentLoaded', () => {
    const suggestionForm = document.getElementById('suggestion-form');
    const upvoteButtons = document.querySelectorAll('.upvote-btn');

    if (suggestionForm) {
        suggestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(suggestionForm);
            try {
                const response = await fetch('/suggestions', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert(error.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    upvoteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const suggestionId = button.dataset.id;
            try {
                const response = await fetch(`/suggestions/${suggestionId}/upvote`, {
                    method: 'POST'
                });
                if (response.ok) {
                    const upvoteCount = button.previousElementSibling;
                    upvoteCount.textContent = parseInt(upvoteCount.textContent) + 1;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});