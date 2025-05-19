function openModalForm() {
    document.getElementById('modalOpenTicket').classList.remove('hidden');
}

function closeModalForm() {
    document.getElementById('modalOpenTicket').classList.add('hidden');
    document.getElementById('formTicket').reset();
}

const ticketList = document.getElementById('tickets');

// Função para buscar tickets por texto
function searchTickets(query, tickets) {
    if (!query) return tickets;
    return tickets.filter(ticket => {
        return (
            (ticket.title && ticket.title.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.description && ticket.description.toLowerCase().includes(query.toLowerCase()))
        );
    });
}

// Utilitário para converter valor numérico para texto de prioridade
function getPriorityText(value) {
    if (value == '1') return 'Baixa';
    if (value == '2') return 'Média';
    if (value == '3') return 'Alta';
    return value;
}

function getPriorityValue(priority) {
    if (priority === 'Baixa') return '1';
    if (priority === 'Média') return '2';
    if (priority === 'Alta') return '3';
    return priority;
}

function getStatusValue(progress) {
    if (!progress) return 'open';
    if (progress === 'Aberto') return 'open';
    if (progress === 'Em andamento') return 'on_going';
    if (progress === 'Resolvido') return 'done';
    return 'open';
}

function normalizePriority(priority) {
    // Aceita tanto número quanto texto, e ignora maiúsculas/minúsculas e acentos
    if (!priority) return '';
    const p = String(priority).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (p === 'baixa' || p === '1') return '1';
    if (p === 'media' || p === 'média' || p === '2') return '2';
    if (p === 'alta' || p === '3') return '3';
    return p;
}

async function fetchTickets() {
    try {
        const response = await fetch('/tickets/data');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let tickets = await response.json();

        ticketList.innerHTML = '';
        console.log(tickets);

        // Busca
        const searchInput = document.querySelector('.search input');
        const query = searchInput ? searchInput.value.trim() : '';
        if (query.length > 0) {
            tickets = searchTickets(query, tickets);
        }

        // Filtro de prioridade
        const filterPriority = document.getElementById('filtersPrioritySelect');
        let priority = filterPriority ? filterPriority.value : '0';
        if (priority !== '0') {
            tickets = tickets.filter(ticket => {
                return normalizePriority(ticket.priority) === priority;
            });
        }

        // Filtro de status
        const filterStatus = document.getElementById('filterStatusSelect');
        let status = filterStatus ? filterStatus.value : 'all';
        if (status !== 'all') {
            tickets = tickets.filter(ticket => {
                return getStatusValue(ticket.progress) === status;
            });
        }

        tickets.forEach(ticket => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <div onclick="window.location.href='/ticket_detail?ticketId=${ticket.id}'">
                    <div class="title">
                        ${ticket.title}
                        <span class="priority ${ticket.priority}">${getPriorityText(ticket.priority)}</span>
                    </div>
                    <div class="description">${ticket.description}</div>
                </div>
            `;
            ticketList.appendChild(card);
        });
        if (tickets.length === 0) {
            ticketList.innerHTML = '<div>Nenhum chamado encontrado.</div>';
        }
    } catch (error) {
        console.error("Erro ao buscar tickets:", error);
        ticketList.innerHTML = '<div>Erro ao carregar tickets.</div>';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchTickets();
    const searchInput = document.querySelector('.search input');
    if (searchInput) {
        searchInput.addEventListener('input', fetchTickets);
    }
    const filterPriority = document.getElementById('filtersPrioritySelect');
    if (filterPriority) {
        filterPriority.addEventListener('change', fetchTickets);
    }
    const filterStatus = document.getElementById('filterStatusSelect');
    if (filterStatus) {
        filterStatus.addEventListener('change', fetchTickets);
    }
    Array.from(document.getElementsByClassName('closeModalTicket')).forEach(element => {
        element.addEventListener('click', closeModalForm);
    });
});