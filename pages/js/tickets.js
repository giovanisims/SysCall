function openModalForm() {
    document.getElementById('modalOpenTicket').classList.remove('hidden');
}

function closeModalForm() {
    document.getElementById('modalOpenTicket').classList.add('hidden');
    document.getElementById('formTicket').reset();
}

const ticketList = document.getElementById('tickets');

async function fetchTickets() {
    try {
        const response = await fetch('/tickets/data');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tickets = await response.json();

        ticketList.innerHTML = '';
        console.log(tickets);

        tickets.forEach(ticket => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <div onclick="window.location.href='/ticket_detail?ticketId=${ticket.id}'">
                    <div class="title">
                        ${ticket.title}
                        <span class="priority ${ticket.priority}">${ticket.priority}</span>
                    </div>
                    <div class="description">${ticket.description}</div>
                </div>
        
            `;
            ticketList.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao buscar tickets:", error);
        tickets.innerHTML = '<div>Erro ao carregar tickets.</div>';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchTickets()
    Array.from(document.getElementsByClassName('closeModalTicket')).forEach(element => {
        element.addEventListener('click', closeModalForm);
    });
});