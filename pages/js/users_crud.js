function openEditModal(userId, name, username, email, cpf, cep, phone, address, role) {
            document.getElementById("editUserId").value = userId;
            document.getElementById("editName").value = name;
            document.getElementById("editUsername").value = username;
            document.getElementById("editEmail").value = email;
            document.getElementById("editCPF").value = cpf;
            document.getElementById("editCEP").value = cep;
            document.getElementById("editPhone").value = phone;
            document.getElementById("editAddress").value = address;
            document.getElementById("editRole").value = role;
            document.getElementById("editModal").style.display = "block";
        }

        function closeEditModal() {
            document.getElementById("editModal").style.display = "none";
        }

        function openModalForm() {
            const modal = document.getElementById('modalOpenUser');
            modal.classList.remove('hidden');
            modal.style.display = "block";
        }

        function closeModalForm() {
            const modal = document.getElementById('modalOpenUser');
            modal.classList.add('hidden');
            modal.style.display = "none";
            document.getElementById('formUser').reset();
        }

        function openModal(userId) {
            const modal = document.getElementById("confirmationModal");
            const confirmButton = document.getElementById("confirmDeleteBtn");
            confirmButton.onclick = function () {
                window.location.href = `/users/delete/${userId}`;
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
            const modalOpenUser = document.getElementById("modalOpenUser");

            if (event.target === confirmationModal) confirmationModal.style.display = "none";
            if (event.target === editModal) editModal.style.display = "none";
            if (event.target === modalOpenUser) closeModalForm();
        };
