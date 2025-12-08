
document.addEventListener('DOMContentLoaded', function() {
    // Открытие модального окна
    const popupCreateEvent = document.getElementById("createPopup");
    const createBtn = document.getElementById("createBtn");
    const closeBtn = document.getElementById("closeBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const approveBtn = document.getElementById("approveBtn");
    // Модальное окно
    const eventForm = document.getElementById("eventForm");
    const eventName = document.getElementById("eventName");
    const eventDate = document.getElementById("eventDate");
    const eventExitDate = document.getElementById("eventExitDate");
    const eventPlace = document.getElementById("eventPlace");
    const eventDescription = document.getElementById("eventDescription");

    //Работа с кнопками открытия и закрытия модального окна
    function openCreateEventPopup() {
        popupCreateEvent.style.display = "flex";
    }

    function closePopup() {
        popupCreateEvent.style.display = "none";
    }

    function resetInfo() {
        eventForm.reset()
    }

    function createEvent() {
        // Функционал создания
        closePopup();
    }

    createBtn.addEventListener("click", function (){
        openCreateEventPopup();
    })

    closeBtn.addEventListener("click", function (){
        closePopup();
    })

    cancelBtn.addEventListener("click", function (){
        resetInfo();
        closePopup();
    })

    approveBtn.addEventListener("click", function (){
        createEvent();
    })

    popupCreateEvent.addEventListener("click", function (e){
        if (e.target === popupCreateEvent){
            closePopup();
        }
    });

    document.addEventListener('keydown', function (e){
        if (e.key === "Escape"){
            closePopup()
        }
    })
});