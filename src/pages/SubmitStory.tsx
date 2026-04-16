import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { correctCharacterStory } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { Loader2, Sparkles, AlertCircle, Upload } from 'lucide-react';

export default function SubmitStory() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [characterName, setCharacterName] = useState('');
  const [icLevel, setIcLevel] = useState('');
  const [icAge, setIcAge] = useState('');
  const [statsImageBase64, setStatsImageBase64] = useState('');
  const [tabImageBase64, setTabImageBase64] = useState('');
  const [storyText, setStoryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setter(base64);
    } catch (err) {
      console.error("Error compressing image:", err);
      setError("Gagal memproses gambar. Coba gambar lain.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    // Basic validations
    if (storyText.split(' ').length < 200) {
      setError('Cerita harus minimal 200 kata.');
      return;
    }
    if (parseInt(icLevel) < 2) {
      setError('Level IC minimal harus 2.');
      return;
    }
    if (parseInt(icAge) < 17) {
      setError('Umur IC minimal harus 17 tahun.');
      return;
    }
    if (characterName.includes('_')) {
      setError('Nama karakter tidak boleh menggunakan garis bawah (_). Gunakan spasi (contoh: Santana Vetuper).');
      return;
    }
    if (!statsImageBase64 || !tabImageBase64) {
      setError('Harap upload screenshot /stats dan Tab Karakter.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Correct the story using Gemini AI
      const correctedText = await correctCharacterStory(storyText, characterName);

      // 2. Save to Firestore
      await addDoc(collection(db, 'character_stories'), {
        authorUid: user.uid,
        authorName: profile.displayName || user.email,
        characterName,
        icLevel: parseInt(icLevel),
        icAge: parseInt(icAge),
        statsImageUrl: statsImageBase64,
        tabImageUrl: tabImageBase64,
        originalText: storyText,
        correctedText,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim cerita. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Submit Character Story</h2>
        <p className="text-gray-400">
          Tulis cerita latar belakang karaktermu. AI kami akan mengoreksi tata bahasa, ejaan, dan format sesuai aturan sebelum direview oleh admin.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#141414] border border-gray-800 rounded-2xl p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="characterName" className="block text-sm font-medium text-gray-300 mb-2">
              Nama Karakter (Tanpa Garis Bawah)
            </label>
            <input
              type="text"
              id="characterName"
              required
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="Contoh: Santana Vetuper"
            />
          </div>
          <div>
            <label htmlFor="icLevel" className="block text-sm font-medium text-gray-300 mb-2">
              Level IC (Minimal 2)
            </label>
            <input
              type="number"
              id="icLevel"
              required
              min="2"
              value={icLevel}
              onChange={(e) => setIcLevel(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="2"
            />
          </div>
          <div>
            <label htmlFor="icAge" className="block text-sm font-medium text-gray-300 mb-2">
              Umur IC (Minimal 17)
            </label>
            <input
              type="number"
              id="icAge"
              required
              min="17"
              value={icAge}
              onChange={(e) => setIcAge(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              placeholder="19"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload SS /stats
            </label>
            <label className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:border-orange-500 transition-colors">
              <span className="truncate text-sm text-gray-400">{statsImageBase64 ? 'Gambar dipilih' : 'Pilih file gambar...'}</span>
              <Upload className="w-4 h-4 text-gray-400" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setStatsImageBase64)} />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload SS Tab Karakter
            </label>
            <label className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:border-orange-500 transition-colors">
              <span className="truncate text-sm text-gray-400">{tabImageBase64 ? 'Gambar dipilih' : 'Pilih file gambar...'}</span>
              <Upload className="w-4 h-4 text-gray-400" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setTabImageBase64)} />
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="storyText" className="block text-sm font-medium text-gray-300 mb-2">
            Background Story (Minimal 200 Kata, 4 Paragraf)
          </label>
          <textarea
            id="storyText"
            required
            rows={12}
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-y"
            placeholder="   Santana Vetuper lahir pada 7 April 2006 di Chicago, USA..."
          />
          <p className="text-xs text-gray-500 mt-2 text-right">
            {storyText.split(' ').filter(w => w.length > 0).length} kata (min 200)
          </p>
        </div>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengoreksi dengan AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Submit Cerita
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
