/* ==========================================================
   Баннер cookie
   Сам сайт cookie не ставит. Их ставит только карта Яндекса,
   поэтому она загружается после того, как посетитель нажал
   «Принять все». Выбор хранится в localStorage браузера.
   ========================================================== */

(function () {
    const KEY = "bruklin-cookie-consent";

    function getChoice() {
        try {
            return localStorage.getItem(KEY);
        } catch (error) {
            return null;
        }
    }

    function saveChoice(value) {
        try {
            localStorage.setItem(KEY, value);
        } catch (error) {
            /* браузер запретил хранилище — просто не запоминаем */
        }
    }

    function clearChoice() {
        try {
            localStorage.removeItem(KEY);
        } catch (error) {
            /* ничего не делаем */
        }
    }

    /* ---------- Карта ---------- */

    function loadMaps() {
        document.querySelectorAll("[data-map-src]").forEach((box) => {
            if (box.querySelector("iframe")) return;

            const frame = document.createElement("iframe");
            frame.src = box.dataset.mapSrc;
            frame.title = box.dataset.mapTitle || "Карта";
            frame.loading = "lazy";
            frame.allowFullscreen = true;

            box.innerHTML = "";
            box.appendChild(frame);
        });
    }

    /* ---------- Баннер ---------- */

    function showBanner() {
        if (document.querySelector(".cookie")) return;

        const banner = document.createElement("div");
        banner.className = "cookie";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Настройки cookie");
        banner.innerHTML =
            '<p class="cookie__text">' +
                "Сайт использует cookie. Без них работает всё, кроме карты Яндекса. " +
                'Подробнее — в <a href="cookies.html">политике cookie</a>.' +
            "</p>" +
            '<div class="cookie__actions">' +
                '<button class="cookie__btn cookie__btn--main" type="button" data-choice="all">Принять все</button>' +
                '<button class="cookie__btn" type="button" data-choice="necessary">Только необходимые</button>' +
            "</div>";

        banner.addEventListener("click", (event) => {
            const button = event.target.closest("[data-choice]");
            if (!button) return;

            saveChoice(button.dataset.choice);
            if (button.dataset.choice === "all") loadMaps();
            banner.remove();
            updateStatus();
        });

        document.body.appendChild(banner);
    }

    /* ---------- Текущий выбор на странице «Политика cookie» ---------- */

    function updateStatus() {
        const status = document.querySelector("[data-cookie-status]");
        if (!status) return;

        const choice = getChoice();
        status.textContent =
            choice === "all" ? "все cookie, включая карту Яндекса" :
            choice === "necessary" ? "только необходимые" :
            "вы ещё не выбрали";
    }

    document.querySelectorAll("[data-cookie-reset]").forEach((button) => {
        button.addEventListener("click", () => {
            clearChoice();
            updateStatus();
            showBanner();
        });
    });

    /* ---------- Старт ---------- */

    const choice = getChoice();

    if (choice === "all") {
        loadMaps();
    } else if (!choice) {
        showBanner();
    }

    updateStatus();

    /* Год в подвале */
    document.querySelectorAll("[data-year]").forEach((el) => {
        el.textContent = new Date().getFullYear();
    });
})();
