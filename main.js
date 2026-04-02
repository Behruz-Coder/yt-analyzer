/**
 * TITAN v2.5 - Universal Logic Engine
 * Muallif: Behruzbek Qodirberganov
 * Versiya: 2.5.1 (Fixed & Optimized)
 */

// 1. GLOBAL KONSTANTALAR
const API_ENDPOINT = "/.netlify/functions/get-data";

// 2. INITIALIZATION (Sahifa yuklanganda ishga tushadi)
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    checkAuthStatus();
    renderSearchHistory();
    
    // Qidiruv inputini kuzatish (Enter bosilganda)
    const sInput = document.getElementById('searchInput');
    if (sInput) {
        sInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
});

// 3. THEME LOGIC (Dark/Light Mode)
function initTheme() {
    const savedTheme = localStorage.getItem('titan-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.innerText = savedTheme === 'dark' ? '🌙' : '☀️';
        themeBtn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('titan-theme', next);
            themeBtn.innerText = next === 'dark' ? '🌙' : '☀️';
        };
    }
}

// 4. MOBILE MENU (Tuzatildi - Endi har qanday qurilmada ishlaydi)
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            // Ikonkani almashtirish
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        };

        // Menyu tashqarisiga bosilganda yopish
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }
}

// 5. SEARCH ENGINE (Real-time & Netlify API ulanmasi)
async function performSearch() {
    const input = document.getElementById('searchInput');
    const grid = document.getElementById('resultsGrid');
    const loader = document.getElementById('loading');

    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    grid.innerHTML = '';
    if (loader) loader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_ENDPOINT}?type=search&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (loader) loader.classList.add('hidden');

        if (data.items && data.items.length > 0) {
            saveToHistory(query);
            data.items.forEach(item => {
                const html = `
                    <div class="titan-card p-6 flex items-center gap-5 animate-fade cursor-pointer" 
                         onclick="location.href='app.html?id=${item.snippet.channelId}'">
                        <img src="${item.snippet.thumbnails.medium.url}" class="w-16 h-16 rounded-2xl object-cover border border-white/10">
                        <div class="flex-grow overflow-hidden">
                            <h3 class="font-bold text-sm truncate">${item.snippet.title}</h3>
                            <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">Tahlil qilish →</p>
                        </div>
                    </div>`;
                grid.innerHTML += html;
            });
        } else {
            grid.innerHTML = '<p class="col-span-full text-center py-20 opacity-40">Kanal topilmadi.</p>';
        }
    } catch (error) {
        if (loader) loader.classList.add('hidden');
        console.error("TITAN API ERROR:", error);
        alert("API ulanishida xatolik! Netlify sozlamalarini tekshiring.");
    }
}

// 6. AUTH SYSTEM (Tuzatildi: Sign In & Role Management)
function handleLogin() {
    const email = document.getElementById('emailLogin')?.value;
    const pass = document.getElementById('passLogin')?.value;

    if (!email || !pass) {
        alert("Iltimos, email va parolni kiriting!");
        return;
    }

    // Maxsus Owner Mode tekshiruvi (Behruzbek uchun)
    const isOwner = (email === 'uzb8972@gmail.com');
    
    const userData = {
        email: email,
        role: isOwner ? 'owner' : 'user',
        loginDate: new Date().toISOString()
    };

    localStorage.setItem('titan_user', JSON.stringify(userData));
    localStorage.setItem('isOwner', isOwner.toString());

    alert(isOwner ? "Xush kelibsiz, Egasi!" : "Tizimga muvaffaqiyatli kirdingiz!");
    window.location.href = 'index.html';
}

function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('titan_user'));
    const adminLink = document.getElementById('adminLink');
    
    if (user && user.role === 'owner' && adminLink) {
        adminLink.classList.remove('hidden');
    }
}

// 7. UTILS: SEARCH HISTORY
function saveToHistory(q) {
    let history = JSON.parse(localStorage.getItem('titan_history')) || [];
    if (!history.includes(q)) {
        history.unshift(q);
        localStorage.setItem('titan_history', JSON.stringify(history.slice(0, 5)));
    }
    renderSearchHistory();
}

function renderSearchHistory() {
    const box = document.getElementById('searchHistory');
    if (!box) return;
    const history = JSON.parse(localStorage.getItem('titan_history')) || [];
    box.innerHTML = history.map(h => `
        <span onclick="document.getElementById('searchInput').value='${h}'; performSearch();" 
              class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold cursor-pointer hover:border-red-600 transition">
            #${h}
        </span>
    `).join('');
}

// 8. UTILS: FORMATTING
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}
