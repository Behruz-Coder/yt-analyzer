const axios = require('axios');

exports.handler = async (event) => {
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

        const isAdmin = password === "YtAdmins";

        // --- ADMIN AMALLARI ---
        if (isAdmin) {
            if (action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=50`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }

            if (action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "O'shildi" }) };
            }

            if (action === 'toggle_block') {
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
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }

            if (action === 'whitelist_ip') {
                await axios.post(`${SUPABASE_URL}/rest/v1/whitelisted_users`, { ip_address }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "Oqlandi" }) };
            }
        }

        // --- FOYDALANUVCHI TEKSHIRUVI ---
        // 1. IP Bloklanganmi?
        const blockCheck = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        
        // 2. IP Oqlanganmi (Whitelist)?
        const whiteCheck = await axios.get(`${SUPABASE_URL}/rest/v1/whitelisted_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const isWhitelisted = whiteCheck.data.length > 0;

        if (blockCheck.data.length > 0 && !isWhitelisted) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "BLOK" }) };
        }

        // YouTube ma'lumotlari
        const chanRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${username}&key=${YT_API_KEY}`);
        
        // Log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP,
            device_info: userAgent
        }, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }});

        const customWords = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel: chanRes.data.items ? chanRes.data.items[0] : null,
                customBadwords: customWords.data.map(w => w.word),
                isWhitelisted: isWhitelisted
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
