document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/profile/data');
        if (!response.ok) throw new Error('Erro ao carregar os dados do perfil');
        const user = await response.json();

        document.getElementById('username').value = user.Username || '';
        document.getElementById('namesurname').value = user.NameSurname || '';
        document.getElementById('email').value = user.Email || '';
        document.getElementById('cpf').value = user.CPF || '';
        document.getElementById('phone').value = user.Number || '';
        document.getElementById('cep').value = user.CEP || '';
        document.getElementById('address').value = user.Address || '';
        document.getElementById('observation').value = user.Complement || '';
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar os dados do perfil.');
    }
});