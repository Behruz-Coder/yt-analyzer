const axios = require('axios');

exports.handler = async (event, context) => {
    // Faqat POST so'rovlarini qabul qilamiz
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Faqat POST so'rovi qabul qilinadi" }) 
        };
    }

    // Foydalanuvchi yuborgan kanal nomini olish
    const { username } = JSON.parse(event.body);
    // Kiruvchining IP manzilini aniqlash
    const userIP = event.headers['x-nf-client-connection-ip'] || 'nomaʼlum';

    // Netlify sozlamalaridan kalitlarni olish
    const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

    try {
        // 1. YouTube-dan kanalni qidirish (ID sini topish uchun)
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YT_API_KEY}&maxResults=1`;
        const searchRes = await axios.get(searchUrl);

        if (!searchRes.data.items || searchRes.data.items.length === 0) {
            return { 
                statusCode: 404, 
                body: JSON.stringify({ error: "Kanal topilmadi" }) 
            };
        }

        const channelId = searchRes.data.items[0].id.channelId;

        // 2. Kanalning to'liq statistikasini olish
        const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YT_API_KEY}`;
        const statsRes = await axios.get(statsUrl);
        const channelData = statsRes.data.items[0];

        // 3. Supabase-ga submit ma'lumotlarini (Log) saqlash
        // Supabase REST API orqali 'logs' jadvaliga yozamiz
        try {
            await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
                channel_username: username,
                ip_address: userIP
            }, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
            });
        } catch (dbError) {
            console.error("Bazaga yozishda xatolik:", dbError.message);
            // Bazaga yozilmasa ham foydalanuvchiga YouTube ma'lumotlarini ko'rsataveramiz
        }

        // 4. Muvaffaqiyatli natijani qaytarish
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(channelData)
        };

    } catch (error) {
        console.error("Xatolik:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "YouTube API bilan bog'lanishda xatolik yuz berdi" })
        };
    }
};
