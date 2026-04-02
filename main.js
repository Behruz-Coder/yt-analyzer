// SUPABASE CONFIG (O'z ma'lumotlaringizni qo'ying)
const supabase = supabase.createClient('URL', 'KEY');

// 25-qism: Multi-Language Dictionary
const i18n = {
    'uz-lat': { welcome: "Xush kelibsiz", stats: "Statistika", search: "Qidirish..." },
    'uz-kir': { welcome: "Хуш келибсиз", stats: "Статистика", search: "Қидириш..." },
    'en': { welcome: "Welcome", stats: "Analytics", search: "Search..." },
    'ru': { welcome: "Добро пожаловать", stats: "Аналитика", search: "Поиск..." }
};

// 3-qism: Intelligent Search & Dropdown
const mainSearch = document.getElementById('mainSearch');
const searchDropdown = document.getElementById('searchDropdown');

mainSearch.addEventListener('input', async (e) => {
    const q = e.target.value;
    if(q.length < 2) { searchDropdown.classList.add('hidden'); return; }

    const res = await fetch(`/api/get-data?type=search&q=${q}`);
    const data = await res.json();

    searchDropdown.innerHTML = data.items.map(item => `
        <div class="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 transition"
             onclick="showDetails('${item.snippet.channelId}')">
            <img src="${item.snippet.thumbnails.default.url}" class="w-12 h-12 rounded-xl">
            <div class="text-left">
                <p class="font-bold text-white">${item.snippet.title}</p>
                <p class="text-xs text-gray-500">${item.snippet.channelTitle}</p>
            </div>
        </div>
    `).join('');
    searchDropdown.classList.remove('hidden');
});

// 4-qism: Fetch & Display Details
async function showDetails(id) {
    searchDropdown.classList.add('hidden');
    document.getElementById('statsSection').classList.remove('hidden');
    
    const res = await fetch(`/api/get-data?type=detail&channelId=${id}`);
    const data = await res.json();
    const ch = data.items[0];

    // UI ni to'ldirish
    document.getElementById('chTitle').innerText = ch.snippet.title;
    document.getElementById('chAvatar').src = ch.snippet.thumbnails.high.url;
    document.getElementById('chHandle').innerText = ch.snippet.customUrl;
    document.getElementById('chDate').innerText = new Date(ch.snippet.publishedAt).toLocaleDateString();
    document.getElementById('chCountry').innerText = ch.snippet.country || 'Noma'lum';
    
    // 15-qism: Live Subscriber Counter
    initLiveCounter(ch.statistics.subscriberCount);
    
    // 10-qism: Save to History
    saveHistory(ch.snippet.title, id, ch.snippet.thumbnails.default.url);

    // Smooth Scroll to stats
    document.getElementById('statsSection').scrollIntoView({ behavior: 'smooth' });
}

// 15-qism: Real-time Interpolation
function initLiveCounter(start) {
    let current = parseInt(start);
    const el = document.getElementById('liveSubs');
    setInterval(() => {
        current += Math.floor(Math.random() * 2);
        el.innerText = current.toLocaleString();
    }, 2500);
}

// 10-qism: LocalStorage History
function saveHistory(name, id, img) {
    let list = JSON.parse(localStorage.getItem('titan_history')) || [];
    if(!list.find(x => x.id === id)) {
        list.unshift({ name, id, img });
        localStorage.setItem('titan_history', JSON.stringify(list.slice(0, 10)));
    }
    renderHistory();
}

function renderHistory() {
    const grid = document.getElementById('historyGrid');
    const list = JSON.parse(localStorage.getItem('titan_history')) || [];
    grid.innerHTML = list.map(item => `
        <div onclick="showDetails('${item.id}')" class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 cursor-pointer hover:border-red-600 transition">
            <img src="${item.img}" class="w-8 h-8 rounded-full">
            <span class="font-bold text-sm">${item.name}</span>
        </div>
    `).join('');
}

// 9-qism: Theme Toggle
document.getElementById('themeToggle').onclick = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('themeToggle').innerText = isDark ? '☀️' : '🌙';
};

// Start functions
renderHistory();
