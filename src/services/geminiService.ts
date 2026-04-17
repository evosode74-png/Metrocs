import { GoogleGenAI } from "@google/genai";
import { collection, query, orderBy, limit, getDocs, where, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

// Mendukung environment AI Studio (process.env)
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey as string });

// Cache for AI Learning examples to avoid fetching on every request
let posExamples: any[] = [];
let negExamples: any[] = [];
let metroKnowledge: any[] = [];
let lastFetchTime = 0;

async function getLearningData() {
  const now = Date.now();
  if (posExamples.length > 0 && now - lastFetchTime < 1000 * 60 * 5) { // 5 min cache
    return { posExamples, negExamples, metroKnowledge };
  }

  try {
    // 1. Positive Examples (Filter in memory to avoid index requirements)
    const qPos = query(collection(db, 'ai_learning'), orderBy('approvedAt', 'desc'), limit(10));
    const posSnap = await getDocs(qPos);
    posExamples = posSnap.docs
      .map(doc => doc.data())
      .filter(data => data.type === 'positive')
      .slice(0, 3);

    // 2. Negative Examples
    const qNeg = query(collection(db, 'ai_learning'), orderBy('rejectedAt', 'desc'), limit(10));
    const negSnap = await getDocs(qNeg);
    negExamples = negSnap.docs
      .map(doc => doc.data())
      .filter(data => data.type === 'negative')
      .slice(0, 2);

    // 3. Metro Knowledge Base (Answered Asks)
    const qK = query(collection(db, 'metro_knowledge'), orderBy('learnedAt', 'desc'), limit(10));
    const kSnap = await getDocs(qK);
    metroKnowledge = kSnap.docs.map(doc => doc.data());

    lastFetchTime = now;
    return { posExamples, negExamples, metroKnowledge };
  } catch (e) {
    console.error("Error fetching learning data:", e);
    return { posExamples: [], negExamples: [], metroKnowledge: [] };
  }
}

export interface CharacterDetails {
  name: string;
  age: string;
  birthDate: string;
  origin: string;
  personality: string;
  background: string;
  goals: string;
}

export async function generateCharacterStory(details: CharacterDetails): Promise<string> {
  const settingsSnap = await getDoc(doc(db, 'system_settings', 'ai_status'));
  const aiStatus = settingsSnap.exists() ? settingsSnap.data() : { generator: true };
  if (aiStatus.generator === false) {
    throw new Error("Fitur AI Story Generator sedang dinonaktifkan oleh Admin.");
  }

  const { posExamples: examples, negExamples } = await getLearningData();
  
  const examplesPrompt = examples.length > 0 
    ? `\nBERIKUT ADALAH CONTOH CS YANG SUDAH DISETUJUI ADMIN (PRACTICE THIS STYLE):\n${examples.map(ex => `--- CONTOH ---\n${ex.correctedText}\n`).join('\n')}`
    : "";

  const avoidPrompt = negExamples.length > 0
    ? `\nBERIKUT ADALAH CONTOH KESALAHAN YANG SERING DITOLAK ADMIN (JANGAN DITIRU):\n${negExamples.map(ex => `- Kesalahan: ${ex.originalText}\n- Alasan Tolak: ${ex.feedback}\n`).join('\n')}`
    : "";

  const prompt = `
Tugas Anda adalah membuat Character Story (CS) untuk server roleplay SAMP (San Andreas Multiplayer) berdasarkan detail karakter berikut:

Detail Karakter:
- Nama: ${details.name}
- Umur: ${details.age}
- Tanggal Lahir: ${details.birthDate}
- Asal/Kebangsaan: ${details.origin}
- Sifat/Kepribadian: ${details.personality}
- Latar Belakang/Masa Lalu: ${details.background}
- Tujuan/Motivasi: ${details.goals}
${examplesPrompt}
${avoidPrompt}

ATURAN WAJIB PENULISAN CS (SANGAT KETAT):
1. SUDUT PANDANG: Wajib menggunakan sudut pandang orang ketiga (ia, dia, atau nama karakter). Dilarang keras menggunakan kata "aku" atau "saya".
2. BAHASA: Gunakan bahasa Indonesia baku (KBBI) yang baik, benar, dan sopan. Perhatikan tanda baca dan huruf kapital.
3. STRUKTUR: Wajib terdiri dari MINIMAL 4 paragraf. Setiap paragraf WAJIB terdiri dari MINIMAL 4 kalimat.
4. JUMLAH KATA: Wajib berada di antara 200 - 2000 kata.
5. AWAL CERITA: Paragraf pertama WAJIB mencantumkan tanggal lahir dan tempat lahir di dunia nyata. 
   Contoh format: "${details.name} lahir pada ${details.birthDate} di ${details.origin}."
6. NAMA KOTA: Dilarang menggunakan nama kota fiksi GTA (Los Santos, San Fierro, Las Venturas). WAJIB menggunakan nama kota dunia nyata (contoh: Los Angeles, San Francisco, Las Vegas, New York, dll).
7. FORMAT: Setiap awal paragraf WAJIB diawali dengan tepat 3 spasi.
8. TANGGAL: Gunakan format "19 Januari 1999" (Bukan 19/01/1999).
9. KONTEN: Cerita harus realistis, masuk akal, dan sesuai dengan lore dunia nyata serta roleplay. Ceritakan perjalanan hidupnya dari masa lalu hingga bagaimana ia bisa memiliki tujuannya saat ini.

Hanya berikan teks ceritanya saja, tanpa embel-embel kalimat pembuka atau penutup dari AI.
`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return result.text || '';
  } catch (error) {
    console.error("Error generating character story:", error);
    throw new Error("Gagal membuat cerita karakter.");
  }
}

export async function correctCharacterStory(originalText: string, characterName: string, birthDate: string = "", origin: string = ""): Promise<string> {
  const settingsSnap = await getDoc(doc(db, 'system_settings', 'ai_status'));
  const aiStatus = settingsSnap.exists() ? settingsSnap.data() : { corrector: true };
  
  if (aiStatus.corrector === false) {
    // Return original text if AI corrector is OFF
    return originalText;
  }

  const { posExamples: examples, negExamples } = await getLearningData();
  
  const examplesPrompt = examples.length > 0 
    ? `\nPELAJARI CONTOH KOREKSI YANG BENAR (PRACTICE EXAMPLES):\n${examples.map(ex => `Input: ${ex.originalText}\nOutput: ${ex.correctedText}\n`).join('\n---\n')}`
    : "";

  const avoidPrompt = negExamples.length > 0
    ? `\nKATA/GAYA YANG HARUS DIHINDARI (DIREJECT ADMIN):\n${negExamples.map(ex => `- Salah: ${ex.originalText}\n- Mengapa: ${ex.feedback}\n`).join('\n')}`
    : "";

  const prompt = `
Tugas kamu adalah mengoreksi Character Story (CS) Roleplay SAMP berbahasa Indonesia.
Kamu harus memperbaiki cerita yang diberikan agar sesuai dengan aturan ketat berikut:
${examplesPrompt}
${avoidPrompt}

ATURAN KETAT (WAJIB DIIKUTI):
1. Sudut Pandang: Wajib menggunakan sudut pandang orang ketiga. Ganti kata "aku", "saya", "kami" menjadi nama karakter ("${characterName}"), "ia", atau "dia".
2. Bahasa: Gunakan bahasa Indonesia yang baku, sopan, dan sesuai KBBI. Perbaiki semua typo.
3. Tanda Baca & Kapitalisasi: Perbaiki titik, koma, and huruf kapital. Nama orang dan nama tempat WAJIB diawali huruf kapital.
4. Format Tanggal & Lahir: Setiap awal cerita WAJIB mencantumkan tanggal lahir dan tempat lahir di dunia nyata. 
   Gunakan data ini jika tersedia: Tanggal Lahir: ${birthDate || "(Cari dari teks)"}, Tempat Lahir: ${origin || "(Cari dari teks)"}.
   Ubah format tanggal menjadi seperti "19 Januari 1999" (jangan gunakan format angka seperti 19/01/1999).
   Contoh: "${characterName} lahir pada ${birthDate || '7 April 2006'} di ${origin || 'Chicago, USA'}."
5. Paragraf: Cerita HARUS terdiri dari minimal 4 paragraf. Setiap paragraf HARUS memiliki minimal 4 kalimat. Jika cerita asli kurang dari ini, kembangkan ceritanya secara logis tanpa mengubah fakta utama.
6. Kata: Panjang cerita harus antara 200 - 2000 kata.
7. Awal Paragraf: Setiap awal paragraf HARUS diawali dengan tepat 3 spasi.
8. Nama Kota: Ganti nama kota fiksi GTA (seperti Los Santos, San Fierro, Las Venturas) menjadi nama kota di dunia nyata (misal: Los Angeles, San Francisco, Las Vegas, Chicago, dll).
9. Alur: Pastikan cerita adalah latar belakang (awal mula/backstory), BUKAN akhir cerita atau menceritakan karakter yang sudah sukses di kota.
10. Konten Haram: Hapus semua unsur gore, pelecehan seksual, pedofilia, atau hal ekstrem lainnya.

Cerita Asli:
${originalText}

Keluarkan HANYA teks cerita yang sudah dikoreksi. Jangan tambahkan kalimat pengantar, penutup, atau komentar apapun. Pastikan setiap awal paragraf memiliki 3 spasi.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || originalText;
  } catch (error) {
    console.error("Error correcting character story:", error);
    throw new Error("Failed to correct the story using AI.");
  }
}

export async function chatWithMetroBot(message: string, history: { role: string, text: string }[] = []): Promise<string> {
  const settingsSnap = await getDoc(doc(db, 'system_settings', 'ai_status'));
  const aiStatus = settingsSnap.exists() ? settingsSnap.data() : { metro: true };
  if (aiStatus.metro === false) {
    return "Maaf bro, sistem Metro Bot lagi dimatiin sama Admin. Coba lagi nanti ya!";
  }

  const { metroKnowledge } = await getLearningData();
  
  const knowledgePrompt = metroKnowledge.length > 0
    ? `\nBERIKUT ADALAH INFORMASI DARI ADMIN (GUNAKAN SEBAGAI REFERENSI JAWABAN):\n${metroKnowledge.map(k => `Pertanyaan: ${k.question}\nJawaban Admin: ${k.answer}`).join('\n---\n')}`
    : "";

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `Kamu adalah Metro Bot, asisten virtual untuk server SAMP Roleplay. Jawab pertanyaan pemain seputar roleplay, aturan server, atau hal umum lainnya dengan ramah, santai, dan menggunakan bahasa Indonesia yang gaul tapi sopan (seperti menggunakan kata 'lo', 'gue', 'bro', 'min'). 

        ATURAN CHARACTER STORY (CS) TERBARU:
        1. Level IC minimal 2. 
        2. Harus 200 - 2000 kata. 
        3. Wajib Nama Kota Dunia Nyata (Bukan GTA). 
        4. Paragraf 1 wajib sebut Tanggal Lahir & Tempat Lahir (Contoh: Santana lahir pada 7 April 2006 di Chicago, USA).
        5. Format: Minimal 4 paragraf, tiap paragraf min 4 kalimat, awal paragraf kasih 3 spasi.
        6. NO PLAGIAT & NO FULL AI (Tolak + Ban).
        7. Sudut pandang orang ketiga (Ia/Dia/Nama).
        
${knowledgePrompt}
Selalu arahkan player untuk bertanya di menu 'Ask Admin' jika pertanyaannya tidak ada di database kamu.`,
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Maaf, Metro lagi pusing nih. Coba tanya lagi nanti ya.";
  } catch (error) {
    console.error("Error chatting with Metro Bot:", error);
    return "Waduh, sistem Metro lagi error nih bro. Sabar ya.";
  }
}

export async function detectAIOrManual(text: string): Promise<{ isAI: boolean; confidence: number; reason: string }> {
  try {
    const prompt = `
    Analisis teks Character Story berikut dan tentukan apakah teks ini dibuat oleh AI atau ditulis secara manual oleh manusia.
    Berikan jawaban dalam format JSON: { "isAI": boolean, "confidence": number (0-100), "reason": "alasan singkat dalam bahasa Indonesia" }.
    
    Kriteria Penilaian Tambahan (Khas AI):
    - Menggunakan nama kota GTA (San Andreas, Los Santos, dll) padahal dilarang.
    - Struktur paragraf yang terlalu simetris (masing-masing tepat 4 kalimat).
    - Tidak mencantumkan tanggal lahir/tempat lahir di awal cerita.
    - Kurang dari 200 kata atau lebih dari 2000 kata.
    - Penggunaan transisi yang terlalu formal (e.g., "Di sisi lain", "Selain itu") di setiap paragraf.
    
    Ciri-ciri Manusia: 
    - Alur cerita yang lebih emosional dan unik.
    - Kesalahan penulisan kecil yang manusiawi (namun tetap bisa dibaca).
    
    Teks:
    ${text}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error detecting AI:", error);
    return { isAI: false, confidence: 0, reason: "Gagal mendeteksi." };
  }
}

export async function humanizeStory(text: string): Promise<string> {
  const prompt = `
    Ubah Character Story (CS) berikut agar terlihat "Plek Ketiplek" seperti buatan manusia manual, bukan AI.
    Ciri khas buatan manusia yang diinginkan ADMIN:
    - Tidak terlalu kaku/robotik.
    - Penggunaan variasi kata yang lebih natural (bahasa Indonesia santai tapi sopan).
    - Struktur kalimat yang tidak selalu identik di setiap paragraf.
    - Menambahkan detail kecil yang terasa lebih personal.
    - WAJIB: Setiap awal paragraf diawali dengan tepat 3 spasi.
    - WAJIB: Gunakan nama kota asli dunia nyata (Chicago, New York, dll), JANGAN kota GTA.
    - WAJIB: Pastikan paragraf pertama mencantumkan tanggal lahir dan tempat lahir.
    - WAJIB: Tetap gunakan sudut pandang orang ketiga.
    
    Teks Asli (AI):
    ${text}
    
    Keluarkan HANYA teks yang sudah di-humanize tanpa embel-embel apapun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || text;
  } catch (error) {
    console.error("Error humanizing story:", error);
    return text;
  }
}

export async function devAISuggestions(topic: string, query: string): Promise<string> {
  let systemInstruction = "";
  
  switch(topic) {
    case 'discord':
      systemInstruction = "Kamu adalah ahli Discord Server Architecture. Berikan saran setup, channel, perms, dan bot yang tepat untuk komunitas SAMP.";
      break;
    case 'samp-dev':
      systemInstruction = "Kamu adalah senior developer PAWN (SAMP). Berikan bantuan koding, perbaikan script, atau saran efisiensi database server SAMP.";
      break;
    case 'bots':
      systemInstruction = "Kamu adalah pakar koding bot WhatsApp dan Discord. Berikan bantuan koding menggunakan Node.js (Eris/Discord.js) atau Python.";
      break;
    case 'features':
      systemInstruction = "Kamu adalah Game Designer ahli GTA SAMP. Berikan ide fitur unik, ekonomi server, sistem pekerjaan, atau sistem faksi yang menarik.";
      break;
    default:
      systemInstruction = "Kamu adalah asisten pengembang server SAMP.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: { systemInstruction }
    });
    return response.text || "Gagal mendapatkan saran.";
  } catch (error) {
    console.error("Dev AI Error:", error);
    return "Terjadi kesalahan pada AI Dev.";
  }
}

export async function playAIGame(userInput: string, gameContext: string = ""): Promise<string> {
  const settingsSnap = await getDoc(doc(db, 'system_settings', 'ai_status'));
  const aiStatus = settingsSnap.exists() ? settingsSnap.data() : { game: true };
  if (aiStatus.game === false) {
    return "Game AI sedang dinonaktifkan oleh Admin.";
  }

  const prompt = `
    Kita sedang bermain game text-based RPG di dunia GTA San Andreas. 
    Konteks saat ini: ${gameContext}
    Input pemain: ${userInput}
    
    Respon sebagai Game Master dengan gaya yang seru dan menantang. Jaga respon tetap singkat dan padat.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Game Over.";
  } catch (error) {
    return "Error dalam permainan.";
  }
}

