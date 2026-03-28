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

        // --- 1. ADMIN PANEL BUYRUQLARI ---
        if (body.password === "YtAdmins") {
            if (body.action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=100`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }
            if (body.action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word: body.word }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }
            if (body.action === 'toggle_block' || body.action === 'whitelist_ip') {
                const table = body.action === 'toggle_block' ? 'blocked_users' : 'whitelisted_users';
                await axios.post(`${SUPABASE_URL}/rest/v1/${table}`, { ip_address: body.ip_address }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }
        }

        // --- 2. XAVFSIZLIK TEKSHIRUVI ---
        const blockRes = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const whiteRes = await axios.get(`${SUPABASE_URL}/rest/v1/whitelisted_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (blockRes.data.length > 0 && whiteRes.data.length === 0) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "BLOCKED" }) };
        }

        // --- 3. YOUTUBE QIDIRUV ---
        const username = body.username;
        if (!username) return { statusCode: 400, headers, body: "Username missing" };
        
        const cleanName = username.replace('@', '');
        const ytRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanName)}&key=${YT_API_KEY}`);
        
        // --- 4. MA'LUMOTLARNI YUKLASH (Logs va Badwords) ---
        // Log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP
        }, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }});

        // Badwordlarni olish
        const badWords = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel: ytRes.data.items ? ytRes.data.items[0] : null,
                badwords: badWords.data.map(w => w.word),
                isWhitelisted: whiteRes.data.length > 0
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
