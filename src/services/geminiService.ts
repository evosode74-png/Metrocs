import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function correctCharacterStory(originalText: string, characterName: string): Promise<string> {
  const prompt = `
Tugas kamu adalah mengoreksi Character Story (CS) Roleplay SAMP berbahasa Indonesia.
Kamu harus memperbaiki cerita yang diberikan agar sesuai dengan aturan ketat berikut:

ATURAN KETAT (WAJIB DIIKUTI):
1. Sudut Pandang: Wajib menggunakan sudut pandang orang ketiga. Ganti kata "aku", "saya", "kami" menjadi nama karakter ("${characterName}"), "ia", atau "dia".
2. Bahasa: Gunakan bahasa Indonesia yang baku, sopan, dan sesuai KBBI. Perbaiki semua typo.
3. Tanda Baca & Kapitalisasi: Perbaiki titik, koma, dan huruf kapital. Nama orang dan nama tempat WAJIB diawali huruf kapital.
4. Format Tanggal: Ubah format tanggal menjadi seperti "19 Januari 1999" (jangan gunakan format angka seperti 19/01/1999).
5. Paragraf: Cerita HARUS terdiri dari minimal 4 paragraf. Setiap paragraf HARUS memiliki minimal 4 kalimat. Jika cerita asli kurang dari ini, kembangkan ceritanya secara logis tanpa mengubah fakta utama.
6. Awal Paragraf: Setiap awal paragraf HARUS diawali dengan tepat 3 spasi.
7. Nama Kota: Ganti nama kota fiksi GTA (seperti Los Santos, San Fierro, Las Venturas) menjadi nama kota di dunia nyata (misal: Los Angeles, San Francisco, Las Vegas, Chicago, dll).
8. Alur: Pastikan cerita adalah latar belakang (awal mula/backstory), BUKAN akhir cerita atau menceritakan karakter yang sudah sukses di kota.
9. Konten Haram: Hapus semua unsur gore, pelecehan seksual, pedofilia, atau hal ekstrem lainnya.

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
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Kamu adalah Metro Bot, asisten virtual untuk server SAMP Roleplay. Jawab pertanyaan pemain seputar roleplay, aturan server, atau hal umum lainnya dengan ramah, santai, dan menggunakan bahasa Indonesia yang gaul tapi sopan (seperti menggunakan kata 'lo', 'gue', 'bro', 'min'). Jangan terlalu kaku.",
      }
    });

    // Send history if any (simplified for this implementation)
    // In a real app, we would map the history to the chat session properly
    
    const response = await chat.sendMessage({ message });
    return response.text || "Maaf, Metro lagi pusing nih. Coba tanya lagi nanti ya.";
  } catch (error) {
    console.error("Error chatting with Metro Bot:", error);
    return "Waduh, sistem Metro lagi error nih bro. Sabar ya.";
  }
}

