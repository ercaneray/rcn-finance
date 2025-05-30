require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: '20mb' }));

async function analyzeWithChatGPT(ocrText) {
    const apiKey = process.env.OPENAI_API_KEY;

    const messages = [
        {
            role: 'system',
            content: `Sen bir fiş analiz yardımcısısın. Kullanıcı sana bir market/kafe vb. fişin OCR metnini verir. Senin görevin sadece şu iki bilgiyi JSON formatında döndürmek:
      
      {
        "açıklama": "[fişin neyle ilgili olduğuna dair çok kısa bir açıklama]",
        "tutar": [toplam_tutar]
      }
      
      Açıklama örnekleri: "Kahve harcaması", "Market alışverişi", "Restoran ödemesi" gibi. Fişteki ürün adlarını ve içeriği yorumlayarak ne harcaması olduğunu tahmin et.
      
      JSON dışında hiçbir şey yazma. Kod bloğu kullanma.
      `,
        },
        {
            role: 'user',
            content: `OCR metni:\n${ocrText}`
        }
    ];


    const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4',
            messages,
            temperature: 0.2,
        },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return res.data.choices[0].message.content;
}

app.post('/ocr', async (req, res) => {
    const { base64 } = req.body;

    if (!base64) {
        return res.status(400).json({ error: 'base64 image is required' });
    }

    try {
        // base64'ü dosyaya yaz
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const tempPath = path.join(__dirname, 'temp_image.png');
        fs.writeFileSync(tempPath, buffer);

        // OCR işlemi
        const result = await Tesseract.recognize(
            tempPath,
            'eng', // veya 'tur' (Türkçe model yüklüyse)
            { logger: m => console.log(m) }
        );

        // geçici resmi sil
        fs.unlinkSync(tempPath);

        res.json({ text: result.data.text });
    } catch (err) {
        console.error('OCR error:', err);
        res.status(500).json({ error: 'OCR failed', details: err.message });
    }
});

app.post('/analyze', async (req, res) => {
    const { ocrText } = req.body;
    if (!ocrText) {
        return res.status(400).json({ error: 'ocrText is required' });
    }

    try {
        const structuredData = await analyzeWithChatGPT(ocrText);
        res.json({ structuredData });
    } catch (err) {
        console.error('GPT hata:', err);
        res.status(500).json({ error: 'GPT analizi başarısız' });
    }
});



app.get('/', (req, res) => {
    res.send('OCR Server is running');
});

app.listen(PORT, () => {
    console.log(`🟢 OCR server running at http://localhost:${PORT}`);
});
