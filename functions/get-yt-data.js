const axios = require('axios');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        const body = JSON.parse(event.body || '{}');
        const userIP = event.headers['x-nf-client-connection-ip'] || 'unknown';

        const supabaseAuth = { 
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } 
        };

        // --- ADMIN AMALLARI ---
        if (body.password === "YtAdmins") {
            // 1. Loglarni olish
            if (body.action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=50`, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }
            
            // 2. Bloklash (INSERT)
            if (body.action === 'toggle_block') {
                await axios.post(`${SUPABASE_URL}/rest/v1/blocked_users`, { ip_address: body.ip_address }, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }

            // 3. Blokdan chiqarish (DELETE) - MUAMMO SHU YERDA EDI!
            if (body.action === 'whitelist_ip') {
                // Endi shunchaki oq ro'yxatga qo'shmaydi, bloklanganlar ro'yxatidan O'CHIRADI
                await axios.delete(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${body.ip_address}`, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "DELETED" }) };
            }

            // 4. Badword qo'shish
            if (body.action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word: body.word }, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }
        }

        // --- FOYDALANUVCHI TEKSHIRUVI ---
        // IP haqiqatdan bloklanganmi?
        const blockCheck = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, supabaseAuth);
        
        if (blockCheck.data.length > 0) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "BLOCKED" }) };
        }

        // --- YOUTUBE QIDIRUV ---
        const username = body.username;
        const cleanName = username.replace('@', '');
        const ytRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanName)}&key=${YT_API_KEY}`);

        // Log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, { channel_username: username, ip_address: userIP }, supabaseAuth);

        // Badwordlarni olish
        const bwRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, supabaseAuth);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel: ytRes.data.items ? ytRes.data.items[0] : null,
                badwords: bwRes.data.map(w => w.word)
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
