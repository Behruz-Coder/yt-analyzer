/**
 * TITAN v2.5 - Universal Logic Engine
 * Muallif: Behruzbek Qodirberganov
 * Sana: 2026-04-02
 * Xususiyat: Session Persistence & Dynamic Header
 */

// 1. SAHIFA YUKLANGANDA ISHGA TUSHADIGAN FUNKSIYALAR
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    updateAuthUI(); // Profilni tekshirish va UI ni yangilash
    renderSearchHistory();
    
    // Qidiruv inputini kuzatish (Enter bosilganda)
    const sInput = document.getElementById('searchInput');
    if (sInput) {
        sInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Admin Panel xavfsizligi (Faqat admin.html sahifasida ishlaydi)
    if (window.location.pathname.includes('admin.html')) {
        const user = JSON.parse(localStorage.getItem('titan_user'));
        if (!user || user.role !== 'owner') {
            window.location.href = 'index.html';
        }
    }
});

// 2. AUTH UI MANAGEMENT (Eng muhim qism)
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('titan_user'));
    // Navigatsiyadagi "Kirish" tugmasini yoki uning konteynerini topamiz
    const authButtons = document.querySelectorAll('a[href="auth.html"]');

    if (user && authButtons.length > 0) {
        authButtons.forEach(btn => {
            const parent = btn.parentElement;
            
            // Profil avatarini yaratish (UI-Avatars xizmatidan foydalanamiz)
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=ef4444&color=fff&bold=true`;
            
            const profileHTML = `
                <div class="flex items-center gap-3 bg-white/5 pr-4 pl-1 py-1 rounded-full border border-white/10 hover:border-red-600 transition-all cursor-pointer group relative" id="userProfileDropdown">
                    <img src="${avatarUrl}" class="w-8 h-8 rounded-full border border-white/20 group-hover:border-red-600 transition-all">
                    <div class="hidden sm:block">
                        <p class="text-[9px] font-black text-white leading-none uppercase tracking-tighter">
                            ${user.role === 'owner' ? 'Admin / Behruzbek' : 'Foydalanuvchi'}
                        </p>
                        <p class="text-[8px] text-gray-500 truncate max-w-[100px] mt-1">${user.email}</p>
                    </div>
                    
                    <div class="absolute top-full right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-2xl p-2 hidden group-hover:block animate-fade shadow-2xl backdrop-blur-xl">
                        ${user.role === 'owner' ? `
                            <a href="admin.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-[10px] font-bold text-yellow-500 transition">
                                <i class="fas fa-user-shield"></i> ADMIN PANEL
                            </a>
                        ` : ''}
                        <a href="#" onclick="logoutUser()" class="flex items-center gap-3 p-3 hover:bg-red-600/10 rounded-xl text-[10px] font-bold text-red-500 transition">
                            <i class="fas fa-sign-out-alt"></i> CHIQISH
                        </a>
                    </div>
                </div>
            `;
            
            // "KIRISH" tugmasini o'chirib, o'rniga profilni qo'yamiz
            parent.innerHTML = profileHTML;
        });
    }
}

// 3. LOGIN & LOGOUT MANTIQI
function handleLogin() {
    const email = document.getElementById('emailLogin')?.value;
    const pass = document.getElementById('passLogin')?.value;

    if (!email || !pass) {
        alert("Iltimos, email va parolni to'ldiring!");
        return;
    }

    // Owner tekshiruvi
    const isOwner = (email.toLowerCase() === 'uzb8972@gmail.com');
    
    const userData = {
        email: email,
        role: isOwner ? 'owner' : 'user',
        timestamp: new Date().getTime()
    };

    localStorage.setItem('titan_user', JSON.stringify(userData));
    localStorage.setItem('isOwner', isOwner.toString());

    alert(isOwner ? "Xush kelibsiz, Behruzbek! Admin huquqlari faollashdi." : "Tizimga kirdingiz.");
    window.location.href = 'index.html';
}

function logoutUser() {
    if (confirm("Haqiqatan ham chiqmoqchimisiz?")) {
        localStorage.removeItem('titan_user');
        localStorage.removeItem('isOwner');
        window.location.href = 'index.html';
    }
}

// 4. SEARCH ENGINE (Netlify API ulanmasi)
async function performSearch() {
    const input = document.getElementById('searchInput');
    const grid = document.getElementById('resultsGrid');
    const loader = document.getElementById('loading');

    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    grid.innerHTML = '';
    if (loader) loader.classList.remove('hidden');

    try {
        const response = await fetch(`/.netlify/functions/get-data?type=search&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (loader) loader.classList.add('hidden');

        if (data.items && data.items.length > 0) {
            saveToHistory(query);
            data.items.forEach(item => {
                grid.innerHTML += `
                    <div class="titan-card p-6 flex items-center gap-5 animate-fade cursor-pointer group" 
                         onclick="location.href='app.html?id=${item.snippet.channelId}'">
                        <div class="relative overflow-hidden rounded-2xl w-16 h-16 shrink-0">
                            <img src="${item.snippet.thumbnails.medium.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        </div>
                        <div class="flex-grow overflow-hidden">
                            <h3 class="font-bold text-sm truncate group-hover:text-red-600 transition-colors">${item.snippet.title}</h3>
                            <p class="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-black">Analytics →</p>
                        </div>
                    </div>`;
            });
        } else {
            grid.innerHTML = '<p class="col-span-full text-center py-20 opacity-40">Ma\'lumot topilmadi.</p>';
        }
    } catch (error) {
        if (loader) loader.classList.add('hidden');
        console.error("Search Error:", error);
    }
}

// 5. MOBILE MENU
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        };
    }
}

// 6. THEME CONTROL
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

// 7. UTILS
function saveToHistory(q) {
    let history = JSON.parse(localStorage.getItem('titan_history')) || [];
    if (!history.includes(q)) {
        history.unshift(q);
        localStorage.setItem('titan_history', JSON.stringify(history.slice(0, 8)));
    }
}

function renderSearchHistory() {
    const box = document.getElementById('searchHistory');
    if (!box) return;
    const history = JSON.parse(localStorage.getItem('titan_history')) || [];
    box.innerHTML = history.map(h => `
        <span onclick="document.getElementById('searchInput').value='${h}'; performSearch();" 
              class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold cursor-pointer hover:border-red-600 hover:text-red-600 transition-all">
            #${h}
        </span>
    `).join('');
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}
