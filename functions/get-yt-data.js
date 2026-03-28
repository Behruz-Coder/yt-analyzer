const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { username } = JSON.parse(event.body);
    const userIP = event.headers['x-nf-client-connection-ip'] || 'nomaʼlum';
    const rawAgent = event.headers['user-agent'] || '';

    // Qurilmani aniqlash (Oddiyroq usulda)
    let deviceInfo = "Kompyuter";
    if (rawAgent.includes("Android")) deviceInfo = "Android Telefon";
    else if (rawAgent.includes("iPhone")) deviceInfo = "iPhone";
    else if (rawAgent.includes("iPad")) deviceInfo = "iPad";
    
    // Brauzerni aniqlash
    let browser = "Noma'lum brauzer";
    if (rawAgent.includes("Chrome")) browser = "Chrome";
    else if (rawAgent.includes("Firefox")) browser = "Firefox";
    else if (rawAgent.includes("Safari") && !rawAgent.includes("Chrome")) browser = "Safari";

    const finalDeviceInfo = `${deviceInfo} (${browser})`;

    const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

    try {
        // Joylashuvni aniqroq servis orqali tekshirish
        let locationData = "Aniqlanmadi";
        try {
            const geoRes = await axios.get(`https://ipapi.co/${userIP}/json/`);
            if (geoRes.data && !geoRes.data.error) {
                locationData = `${geoRes.data.country_name}, ${geoRes.data.city} (Pochta indeksi: ${geoRes.data.postal}, Provayder: ${geoRes.data.org})`;
            }
        } catch (e) { 
            // Agar ipapi xato bersa, zaxira sifatida eski usul
            locationData = "Joylashuv xizmati band";
        }

        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YT_API_KEY}&maxResults=1`);
        const channelId = searchRes.data.items[0].id.channelId;
        const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YT_API_KEY}`);

        // Supabase-ga yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP,
            device_info: finalDeviceInfo, // Endi: "Android Telefon (Chrome)" ko'rinishida bo'ladi
            location: locationData
        }, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify(statsRes.data.items[0])
        };

    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};
