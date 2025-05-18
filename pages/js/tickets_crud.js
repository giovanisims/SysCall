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

            function showSuccessThenSubmit(formElement, closeModalCallback) {
                document.getElementById("successModal").style.display = "block";
                const closeSuccessBtn = document.getElementById("closeSuccessBtn");

                closeSuccessBtn.onclick = function () {
                    document.getElementById("successModal").style.display = "none";
                    formElement.submit();
                    if (closeModalCallback) closeModalCallback();
                };

                setTimeout(() => closeSuccessBtn.click(), 1000);
            }

            const editForm = document.getElementById("editTicketForm");
            if (editForm) {
                editForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    showSuccessThenSubmit(editForm, closeEditModal);
                });
            }

            const addForm = document.getElementById("formTicket");
            if (addForm) {
                addForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    showSuccessThenSubmit(addForm, closeModalForm);
                });
            }
        });