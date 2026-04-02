// 1. Supabase Integratsiyasi (Variables Netlify orqali emas, JS orqali beriladi)
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Netlify Variables emas, bu ochiq bo'lishi shart
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. 3-qism: Search Logic
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');

searchInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 2) {
        searchDropdown.classList.add('hidden');
        return;
    }

    const res = await fetch(`/.netlify/functions/get-data?type=search&q=${query}`);
    const data = await res.json();

    searchDropdown.innerHTML = data.items.map(item => `
        <div class="flex items-center gap-4 p-4 hover:bg-red-600/10 cursor-pointer border-b border-gray-900 transition"
             onclick="location.href='app.html?id=${item.snippet.channelId}'">
            <img src="${item.snippet.thumbnails.default.url}" class="w-12 h-12 rounded-full border border-red-600">
            <div class="text-left">
                <p class="font-bold">${item.snippet.title}</p>
                <p class="text-xs text-gray-400">@${item.snippet.channelTitle}</p>
            </div>
        </div>
    `).join('');
    searchDropdown.classList.remove('hidden');
});

// 3. 9-qism: Theme Engine
const themeToggle = document.getElementById('themeToggle');
themeToggle.onclick = () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.innerText = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('titan-theme', theme);
};

// 4. 25-qism: Multi-Language (Kirill bilan)
const langStrings = {
    'uz-lat': { welcome: "Faktlar", placeholder: "Kanal nomi..." },
    'uz-kir': { welcome: "Фактлар", placeholder: "Канал номи..." }
};

document.getElementById('langSwitcher').onchange = (e) => {
    const lang = e.target.value;
    document.querySelector('h1 span').innerText = langStrings[lang].welcome;
    searchInput.placeholder = langStrings[lang].placeholder;
};
