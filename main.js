/**
 * TITAN v2.5 - Core Engine
 * Muallif: Behruzbek Qodirberganov
 * Versiya: 2.5.0
 * Vazifasi: Ko'p tilli tizim, Dark/Light mode, Auth mantiqi va API integratsiyasi
 */

// 1. KO'P TILLI LUG'AT (25-qism)
const i18n = {
    'uz-lat': {
        navFeatures: "Imkoniyatlar",
        navLeaderboard: "Reyting",
        navAnalyze: "Tahlil",
        btnSignIn: "Kirish",
        btnSignUp: "Ro'yxatdan o'tish",
        btnGetStarted: "HOZIROQ BOSHLASH",
        mainTitle: "MA'LUMOTLAR <br> <span class='text-red-600'>KUCHI.</span>",
        mainDesc: "YouTube ekotizimidagi har bir soniyani, har bir o'zgarishni va har bir raqamni biz bilan boshqaring. TITAN v2.5 — bu professional kontent yaratuvchilar uchun yaratilgan eng chuqur tahlil vositasi."
    },
    'uz-kir': {
        navFeatures: "Имкониятлар",
        navLeaderboard: "Рейтинг",
        navAnalyze: "Таҳлил",
        btnSignIn: "Кириш",
        btnSignUp: "Рўйхатдан ўтиш",
        btnGetStarted: "ҲОЗИРОҚ БОШЛАШ",
        mainTitle: "МАЪЛУМОТЛАР <br> <span class='text-red-600'>КУЧИ.</span>",
        mainDesc: "YouTube экотизимидаги ҳар бир сонияни, ҳар бир ўзгаришни ва ҳар bir рақамни биз билан бошқаринг. TITAN v2.5 — бу профессионал контент яратувчилар учун яратилgan энг чуқур таҳлил воситаси."
    },
    'en': {
        navFeatures: "Features",
        navLeaderboard: "Leaderboard",
        navAnalyze: "Analyze",
        btnSignIn: "Sign In",
        btnSignUp: "Sign Up",
        btnGetStarted: "GET STARTED NOW",
        mainTitle: "POWER OF <br> <span class='text-red-600'>DATA.</span>",
        mainDesc: "Manage every second, every change, and every number in the YouTube ecosystem with us. TITAN v2.5 is the deepest analytics tool built for professional creators."
    },
    'ru': {
        navFeatures: "Возможности",
        navLeaderboard: "Рейтинг",
        navAnalyze: "Анализ",
        btnSignIn: "Войти",
        btnSignUp: "Регистрация",
        btnGetStarted: "НАЧАТЬ СЕЙЧАС",
        mainTitle: "СИЛА <br> <span class='text-red-600'>ДАННЫХ.</span>",
        mainDesc: "Управляйте каждой секундой и каждым изменением в экосистеме YouTube вместе с нами. TITAN v2.5 — это инструмент глубокой аналитики для профессионалов."
    }
};

// 2. THEME & LANGUAGE INITIALIZATION (9, 25-qismlar)
function initApp() {
    // Mavzuni tiklash
    const savedTheme = localStorage.getItem('titan-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerText = savedTheme === 'dark' ? '🌙' : '☀️';

    // Tilni tiklash
    const savedLang = localStorage.getItem('titan-lang') || 'uz-lat';
    const langSwitcher = document.getElementById('langSwitcher');
    if (langSwitcher) {
        langSwitcher.value = savedLang;
        applyLanguage(savedLang);
    }
}

// 3. APPLY LANGUAGE (Dinamik matn almashtirish)
function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            el.innerHTML = i18n[lang][key];
        }
    });

    // Maxsus ID li elementlar uchun (Landing Page)
    if (document.getElementById('mainTitle')) 
        document.getElementById('mainTitle').innerHTML = i18n[lang].mainTitle;
    if (document.getElementById('mainDesc')) 
        document.getElementById('mainDesc').innerText = i18n[lang].mainDesc;
}

// 4. THEME TOGGLE LOGIC
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('titan-theme', newTheme);
        themeToggle.innerText = newTheme === 'dark' ? '🌙' : '☀️';
        
        // Animatsiya effekti
        themeToggle.classList.add('scale-125');
        setTimeout(() => themeToggle.classList.remove('scale-125'), 200);
    });
}

// 5. LANGUAGE SWITCHER LOGIC
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher) {
    langSwitcher.addEventListener('change', (e) => {
        const newLang = e.target.value;
        localStorage.setItem('titan-lang', newLang);
        applyLanguage(newLang);
    });
}

// 6. MOBILE MENU LOGIC
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        // Bu yerda mobil menyu ochilish mantiqi bo'ladi
        alert("Mobil menyu hali tayyor emas. Keyingi fayllarda qo'shiladi.");
    });
}

// 7. UTILITY: NUMBER FORMATTER (15-qism uchun kerak)
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// 8. AUTH CHECK (8-qism - Admin huquqlarini tekshirish uchun tayyorgarlik)
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('titan_user'));
    if (user && user.email === 'uzb8972@gmail.com') {
        console.log("Welcome, Behruzbek! Owner mode active.");
        // Kelgusida bu yerda Admin tugmasini ko'rsatish mantiqi bo'ladi
    }
}

// ENGINE START
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    checkAuthStatus();
});
