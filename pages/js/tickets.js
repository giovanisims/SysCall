function openModalForm() {
    document.getElementById('modalOpenTicket').classList.remove('hidden');
}
  
function closeModalForm() {
    document.getElementById('modalOpenTicket').classList.add('hidden');
    document.getElementById('formTicket').reset();
}


document.addEventListener("DOMContentLoaded", function () {
    Array.from(document.getElementsByClassName('closeModalTicket')).forEach(element => {
        element.addEventListener('click', closeModalForm);
    });
});