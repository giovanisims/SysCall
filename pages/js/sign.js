function searchAddress() {
    let cep = document.getElementById("cep").value;
    
    let rawCep = cep.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        document.getElementById("cep").value = formattedCep; 

        let url = `https://viacep.com.br/ws/${rawCep}/json/`; 

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    document.getElementById("address").value = data.logradouro;
                } else {
                    alert("CEP não encontrado.");
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
                alert("Erro ao buscar o CEP.");
            });
    } else {
        alert("CEP inválido.");
    }
}

function formatAndValidateCPF() {
    let cpf = document.getElementById("cpf").value;
    cpf = cpf.replace(/\D/g, ""); // Remove tudo que não for número

    // Aplica a máscara XXX.XXX.XXX-XX automaticamente
    if (cpf.length <= 11) {
        cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    cpf.value = cpf; // Atualiza o campo formatado

    // Valida o CPF em tempo real
    if (cpf.length === 14) { // Só valida se tiver o tamanho correto (com pontuação)
        if (!validateCPF(cpf)) {
            cpf.style.border = "2px solid red"; // Destaca o campo em vermelho
        } else {
            cpf.style.border = "2px solid green"; // Destaca o campo em verde
        }
    } else {
        cpf.style.border = ""; // Remove a borda se o CPF estiver incompleto
    }
}

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos

    if (cpf.length !== 11) return false; // CPF deve ter 11 dígitos

    // Rejeita CPFs inválidos conhecidos (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Cálculo dos dígitos verificadores
    let sum = 0, remainder;

    for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
}
