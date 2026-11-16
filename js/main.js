/* ==========================================================
   Автомойка «Бруклин» — часы, запись и сертификат
   Формы работают «для вида»: данные никуда не отправляются
   и нигде не сохраняются, после проверки полей просто
   показывается сообщение об успешной заявке.
   ========================================================== */

const PHONE_TEXT = "+7 965 705-78-20";

function sendLead() {
    return new Promise((resolve) => setTimeout(() => resolve(true), 600));
}

/* Галочка согласия на обработку персональных данных */
function hasConsent(form) {
    const box = form.querySelector('input[name="consent"]');
    if (!box || box.checked) return true;

    box.closest(".consent").classList.add("is-invalid");
    return false;
}

document.querySelectorAll('input[name="consent"]').forEach((box) => {
    box.addEventListener("change", () => box.closest(".consent").classList.remove("is-invalid"));
});

/* ---------- Часы на первом экране ---------- */

const clock = document.querySelector("[data-clock]");

function tick() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    clock.dateTime = now.toISOString();
}

tick();
setInterval(tick, 15000);

/* ---------- Телефон: маска +7 (900) 000-00-00 ---------- */

function formatPhone(value) {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("8")) {
        digits = "7" + digits.slice(1);
    }
    if (!digits.startsWith("7")) {
        digits = "7" + digits;
    }
    digits = digits.slice(0, 11);

    const parts = [
        digits.slice(1, 4),
        digits.slice(4, 7),
        digits.slice(7, 9),
        digits.slice(9, 11)
    ];

    let result = "+7";
    if (parts[0]) result += " (" + parts[0];
    if (parts[0].length === 3) result += ")";
    if (parts[1]) result += " " + parts[1];
    if (parts[2]) result += "-" + parts[2];
    if (parts[3]) result += "-" + parts[3];

    return result;
}

function isPhoneValid(value) {
    return value.replace(/\D/g, "").length === 11;
}

document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", () => {
        /* Если после «+7» начали набирать 8 или 7 — игнорируем, это код страны */
        const national = input.value.startsWith("+7") ? input.value.slice(2).replace(/\D/g, "") : null;
        if (national === "7" || national === "8") {
            input.value = "+7";
            return;
        }

        input.value = formatPhone(input.value);
        input.classList.remove("is-invalid");
    });

    input.addEventListener("focus", () => {
        if (!input.value) input.value = "+7";
    });
});

function showError(form, text) {
    const box = form.querySelector(".form__error");
    box.textContent = text;
    box.hidden = !text;
}

/* ---------- Запись на мойку ---------- */

const booking = document.querySelector("#booking-form");
const bookingDone = document.querySelector(".booking__done");
const dateInput = booking.elements.date;
const timeSelect = booking.elements.time;

function toInputDate(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

/* Мойка круглосуточная, поэтому в списке все часы суток с шагом 30 минут.
   Для сегодняшнего дня прошедшее время не показываем. */
function fillTimes() {
    const now = new Date();
    const isToday = dateInput.value === toInputDate(now);
    const current = timeSelect.value;

    timeSelect.innerHTML = "";

    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
        const h = String(Math.floor(minutes / 60)).padStart(2, "0");
        const m = String(minutes % 60).padStart(2, "0");

        if (isToday && minutes <= now.getHours() * 60 + now.getMinutes()) {
            continue;
        }

        const label = h + ":" + m;
        timeSelect.add(new Option(label, label));
    }

    if (!timeSelect.options.length) {
        timeSelect.add(new Option("Сегодня уже поздно — выберите завтра", ""));
    }

    if ([...timeSelect.options].some((option) => option.value === current)) {
        timeSelect.value = current;
    }
}

function resetDate() {
    const today = toInputDate(new Date());
    dateInput.min = today;
    dateInput.value = today;
    fillTimes();
}

dateInput.addEventListener("change", fillTimes);
resetDate();

booking.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = booking.elements.name;
    const phone = booking.elements.phone;
    let error = "";

    name.classList.toggle("is-invalid", !name.value.trim());
    phone.classList.toggle("is-invalid", !isPhoneValid(phone.value));

    if (!dateInput.value || !timeSelect.value) {
        error = "Выберите день и время.";
    } else if (!name.value.trim()) {
        error = "Напишите, как к вам обращаться.";
    } else if (!isPhoneValid(phone.value)) {
        error = "Проверьте номер: нужно 10 цифр после +7.";
    }

    if (!error && !hasConsent(booking)) {
        error = "Поставьте галочку согласия на обработку данных.";
    }

    showError(booking, error);
    if (error) return;

    const data = Object.fromEntries(new FormData(booking));
    const button = booking.querySelector('button[type="submit"]');

    button.disabled = true;
    const ok = await sendLead(data);
    button.disabled = false;

    if (!ok) {
        showError(booking, "Запись не отправилась. Позвоните нам: " + PHONE_TEXT + ".");
        return;
    }

    const day = new Date(data.date + "T00:00").toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        weekday: "long"
    });

    bookingDone.querySelector("[data-summary]").textContent =
        data.service + ", " + day + ", " + data.time;

    booking.hidden = true;
    bookingDone.hidden = false;
});

bookingDone.querySelector("[data-reset]").addEventListener("click", () => {
    booking.reset();
    resetDate();
    booking.hidden = false;
    bookingDone.hidden = true;
});

/* ---------- Подарочный сертификат ---------- */

const gift = document.querySelector("#gift-form");

gift.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = gift.elements.phone;

    if (!isPhoneValid(phone.value)) {
        phone.classList.add("is-invalid");
        showError(gift, "Проверьте номер: нужно 10 цифр после +7.");
        return;
    }

    if (!hasConsent(gift)) {
        showError(gift, "Поставьте галочку согласия на обработку данных.");
        return;
    }

    showError(gift, "");
    const amount = gift.elements.amount.value;
    const ok = await sendLead({ type: "certificate", amount: amount, phone: phone.value });

    if (!ok) {
        showError(gift, "Не получилось отправить. Позвоните нам: " + PHONE_TEXT + ".");
        return;
    }

    const sum = amount === "Другая" ? "" : " на " + amount + " ₽";
    gift.innerHTML =
        '<p class="gift__done">Сертификат' + sum + " — заявка принята</p>" +
        "<p>Перезвоним на " + phone.value + " и договоримся, когда забрать.</p>";
});

/* ---------- Год в подвале ---------- */

document.querySelector("[data-year]").textContent = new Date().getFullYear();
