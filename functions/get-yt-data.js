const axios = require('axios');

exports.handler = async (event) => {
    // CORS sozlamalari
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const body = JSON.parse(event.body);
        const { action, password, username, word, ip_address } = body;
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        
        const userIP = event.headers['x-nf-client-connection-ip'] || 'unknown';
        const userAgent = event.headers['user-agent'] || 'unknown';

        // --- 1. ADMIN TEKSHIRUVI ---
        const isAdmin = password === "YtAdmins";

        // --- 2. ADMIN FUNKSIYALARI ---
        if (isAdmin) {
            // A. Barcha loglarni olish
            if (action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=50`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }

            // B. Yangi taqiqlangan so'z qo'shish
            if (action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ message: "So'z qo'shildi" }) };
            }

            // C. IP-ni bloklash/ochish
            if (action === 'toggle_block') {
                // Avval borligini tekshirish
                const check = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${ip_address}`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });

                if (check.data.length > 0) {
                    await axios.delete(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${ip_address}`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                } else {
                    await axios.post(`${SUPABASE_URL}/rest/v1/blocked_users`, { ip_address }, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                }
                return { statusCode: 200, headers, body: JSON.stringify({ message: "Blok holati o'zgardi" }) };
            }
        }

        // --- 3. ODDIY FOYDALANUVCHI QIDIRUVI ---
        // Avval IP bloklanganini tekshirish
        const blockCheck = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (blockCheck.data.length > 0) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "Sizning IP manzilingiz bloklangan!" }) };
        }

        // YouTube-dan ma'lumot olish
        const chanRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${username}&key=${YT_API_KEY}`);
        if (!chanRes.data.items || chanRes.data.items.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: "Kanal topilmadi" }) };
        }

        const channel = chanRes.data.items[0];
        const vidRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&maxResults=5&order=viewCount&type=video&key=${YT_API_KEY}`);

        // Bazadagi maxsus taqiqlangan so'zlarni ham olish (Filtr uchun)
        const customWordsRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        // Log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP,
            device_info: userAgent
        }, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }});

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel, 
                popularVideos: vidRes.data.items,
                customBadwords: customWordsRes.data.map(w => w.word) 
            })
        };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
