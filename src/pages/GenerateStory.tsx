import React, { useState } from 'react';
import { generateCharacterStory, CharacterDetails } from '../services/geminiService';
import { Wand2, User, MapPin, Brain, History, Target, Copy, Check, Loader2 } from 'lucide-react';

export default function GenerateStory() {
  const [details, setDetails] = useState<CharacterDetails>({
    name: '',
    age: '',
    origin: '',
    personality: '',
    background: '',
    goals: ''
  });
  
  const [generatedStory, setGeneratedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedStory('');
    
    try {
      const story = await generateCharacterStory(details);
      setGeneratedStory(story);
    } catch (err) {
      setError('Gagal membuat cerita. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedStory) return;
    navigator.clipboard.writeText(generatedStory);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[800px] md:min-h-0">
      {/* Form Section */}
      <div className="flex-1 flex flex-col bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="bg-[#0a0a0a] border-b border-gray-800 p-4 md:p-6 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">AI Story Generator</h2>
            <p className="text-xs text-gray-400">Buat Character Story otomatis dari ide kamu</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="generate-form" onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" /> Nama Karakter
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={details.name}
                  onChange={handleChange}
                  placeholder="Contoh: John_Doe (tanpa garis bawah saat input)"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" /> Umur
                </label>
                <input
                  required
                  type="text"
                  name="age"
                  value={details.age}
                  onChange={handleChange}
                  placeholder="Contoh: 25 Tahun"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Asal / Kebangsaan
              </label>
              <input
                required
                type="text"
                name="origin"
                value={details.origin}
                onChange={handleChange}
                placeholder="Contoh: Los Santos, Amerika Serikat"
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" /> Sifat / Kepribadian
              </label>
              <input
                required
                type="text"
                name="personality"
                value={details.personality}
                onChange={handleChange}
                placeholder="Contoh: Pekerja keras, pendiam, mudah emosi jika diganggu"
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-500" /> Latar Belakang / Masa Lalu
              </label>
              <textarea
                required
                name="background"
                value={details.background}
                onChange={handleChange}
                rows={3}
                placeholder="Ceritakan singkat masa kecilnya, keluarganya, atau kejadian penting di masa lalu..."
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm resize-y"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Tujuan / Motivasi Saat Ini
              </label>
              <textarea
                required
                name="goals"
                value={details.goals}
                onChange={handleChange}
                rows={2}
                placeholder="Contoh: Ingin menjadi mekanik sukses di Los Santos untuk membiayai adiknya."
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm resize-y"
              />
            </div>
          </form>
        </div>

        <div className="p-4 md:p-6 bg-[#0a0a0a] border-t border-gray-800 shrink-0">
          <button
            form="generate-form"
            type="submit"
            disabled={isGenerating}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Meracik Cerita...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Character Story
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </div>
      </div>

      {/* Result Section */}
      <div className="flex-1 flex flex-col bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="bg-[#0a0a0a] border-b border-gray-800 p-4 md:p-6 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-orange-500">Hasil Generate AI</h2>
          <button
            onClick={handleCopy}
            disabled={!generatedStory || isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Copy Text'}
          </button>
        </div>
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#0a0a0a]">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              <div className="text-center">
                <p className="font-medium text-gray-300">AI sedang menulis cerita...</p>
                <p className="text-sm mt-1">Memastikan format 4 paragraf dan aturan SAMP.</p>
              </div>
            </div>
          ) : generatedStory ? (
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-300 text-sm md:text-base leading-relaxed font-serif">
                {generatedStory}
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-6">
              <Wand2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Isi form di sebelah kiri dan klik Generate untuk membuat Character Story otomatis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
