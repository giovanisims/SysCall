function openEditModal(ticketId, title, description, priority) {
    document.getElementById("editTicketId").value = ticketId;
    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;
    document.getElementById("editPriority").value = priority;
    document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function openModalForm() {
    const modal = document.getElementById('modalOpenTicket');
    modal.classList.remove('hidden');
    modal.style.display = "block";
}

function closeModalForm() {
    const modal = document.getElementById('modalOpenTicket');
    modal.classList.add('hidden');
    modal.style.display = "none";
    document.getElementById('formTicket').reset();
}

function openModal(ticketId) {
    const modal = document.getElementById("confirmationModal");
    const confirmButton = document.getElementById("confirmDeleteBtn");
    confirmButton.onclick = function () {
        window.location.href = `/tickets/delete/${ticketId}`;
    };
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("confirmationModal").style.display = "none";
}

// Fecha modais ao clicar fora
window.onclick = function (event) {
    const confirmationModal = document.getElementById("confirmationModal");
    const editModal = document.getElementById("editModal");
    const modalOpenTicket = document.getElementById("modalOpenTicket");
    const successModal = document.getElementById("successModal");

    if (event.target === confirmationModal) confirmationModal.style.display = "none";
    if (event.target === editModal) editModal.style.display = "none";
    if (event.target === modalOpenTicket) closeModalForm();
    if (event.target === successModal) successModal.style.display = "none";
};

document.addEventListener("DOMContentLoaded", function () {
    Array.from(document.getElementsByClassName('closeModalTicket')).forEach(element => {
        element.addEventListener('click', closeModalForm);
    });

    // Exibe modal de sucesso se a URL tiver ?deleted=true, ?added=true ou ?edited=true
    const successModal = document.getElementById("successModal");
    const successMsg = document.getElementById("successMessageText");
    const closeBtn = document.getElementById("closeSuccessBtn");
    const params = new URLSearchParams(window.location.search);

    let message = "";
    if (params.get("deleted") === "true") {
        message = "Chamado excluído com sucesso!";
    } else if (params.get("added") === "true") {
        message = "Chamado adicionado com sucesso!";
    } else if (params.get("edited") === "true") {
        message = "Chamado editado com sucesso!";
    }

    if (successModal && successMsg) {
        if (message) {
            successMsg.innerText = message;
            successModal.style.display = "block";
            if (closeBtn) {
                closeBtn.onclick = function() {
                    successModal.style.display = "none";
                    successMsg.innerText = "";
                    window.history.replaceState({}, document.title, window.location.pathname);
                };
            }
        } else {
            successModal.style.display = "none";
            successMsg.innerText = "";
        }
    }

});