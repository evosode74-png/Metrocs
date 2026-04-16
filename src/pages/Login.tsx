import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, User as UserIcon, Lock } from 'lucide-react';

export default function Login() {
  const { user, login, register, recoverPassword, recoverUsername } = useAuth();
  const navigate = useNavigate();
  const [isLoginState, setIsLoginState] = useState(true);
  const [showRecover, setShowRecover] = useState<'none'|'pass'|'user'>('none');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery State
  const [recUser, setRecUser] = useState('');
  const [recId, setRecId] = useState('');
  const [newPass, setNewPass] = useState('');

  // Registration Flow
  const [generatedSampId, setGeneratedSampId] = useState('');
  const [confirmSampId, setConfirmSampId] = useState('');
  const [idTaken, setIdTaken] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const generateId = () => {
    const id = Math.floor(10000 + Math.random() * 89999).toString();
    setGeneratedSampId(id);
    setIdTaken(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let browserId = localStorage.getItem('DEVICE_BROWSER_ID');
      if (!browserId) {
        browserId = 'BID-' + Math.random().toString(36).substring(2, 11).toUpperCase();
        localStorage.setItem('DEVICE_BROWSER_ID', browserId);
      }

      if (isLoginState) {
        if (!name || !password) throw new Error("Semua kolom wajib diisi!");
        await login(name, password, browserId, rememberMe);
      } else {
        if (!name || !password || !confirmSampId) throw new Error("Semua kolom wajib diisi!");
        if (confirmSampId !== generatedSampId) throw new Error("ID Konfirmasi tidak cocok!");
        await register(name, password, browserId, generatedSampId);
        await login(name, password, browserId, rememberMe);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (type: 'pass' | 'user') => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (type === 'pass') {
        if (!recUser || !recId || !newPass) throw new Error("Isi semua kolom recovery!");
        await recoverPassword(recUser, recId, newPass);
        setSuccess("Password berhasil diganti! Silakan login.");
        setShowRecover('none');
      } else {
        if (!recId) throw new Error("Masukkan ID kamu!");
        const foundUser = await recoverUsername(recId);
        setSuccess(`Username kamu adalah: ${foundUser}`);
        setShowRecover('none');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
  };

  if (showRecover !== 'none') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141414] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-orange-500 uppercase">
            {showRecover === 'pass' ? 'Reset Password' : 'Cari Username'}
          </h2>
          {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-xs">{error}</div>}
          
          <div className="space-y-4">
            {showRecover === 'pass' && (
              <input 
                type="text" placeholder="Username" value={recUser} onChange={e => setRecUser(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50"
              />
            )}
            <input 
              type="text" placeholder="5-Digit Recovery ID" value={recId} onChange={e => setRecId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50"
            />
            {showRecover === 'pass' && (
              <input 
                type="password" placeholder="Password Baru" value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => handleRecover(showRecover as any)} className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">PROSES</button>
              <button onClick={() => setShowRecover('none')} className="px-4 bg-gray-800 py-3 rounded-xl">BATAL</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 text-white">
      <div className="max-w-md w-full bg-[#141414] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-center">Correct CS</h1>
        <p className="text-gray-400 mb-6 text-center text-sm">
          {isLoginState ? 'Masuk ke akun Anda' : 'Daftar - 5-Digit Recovery ID'}
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-xs p-3 rounded-lg mb-4 text-center">{success}</div>}

        <div className="flex bg-[#0a0a0a] rounded-lg p-1 mb-6 border border-gray-800">
          <button type="button" onClick={() => { setIsLoginState(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLoginState ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >Login</button>
          <button type="button" onClick={() => { setIsLoginState(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLoginState ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >Register</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">USERNAME</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="XYFUR" value={name} onChange={handleUsernameChange}
                className="w-full bg-[#0a0a0a] text-white border border-gray-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 pl-10 outline-none text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" placeholder="*****" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] text-white border border-gray-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 pl-10 outline-none text-sm" required />
            </div>
          </div>

          {!isLoginState && (
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">RECOVERY ID</span>
                {!idTaken ? (
                  <button type="button" onClick={generateId} className="text-[10px] text-orange-500 font-bold hover:underline">AMBIL ID</button>
                ) : (
                  <span className="text-lg font-mono font-bold text-orange-500 tracking-widest">{generatedSampId}</span>
                )}
              </div>
              {idTaken && (
                <div className="space-y-2">
                  <p className="text-[9px] text-gray-500 leading-tight">⚠️ PENTING: Screenshot ID ini! Jangan berikan ke siapapun. Ini kunci recovery kamu.</p>
                  <input type="text" placeholder="KONFIRMASI ID" value={confirmSampId} onChange={e => setConfirmSampId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-orange-500/30 rounded-lg px-3 py-2 text-center font-mono text-sm" required />
                </div>
              )}
            </div>
          )}

          {isLoginState && (
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-gray-700 bg-black text-orange-600" />
                <label htmlFor="rememberMe">INGAT SAYA</label>
              </div>
              <div className="flex gap-2 text-[10px]">
                <button type="button" onClick={() => setShowRecover('user')} className="text-gray-500 hover:text-white">LUPA USERNAME</button>
                <button type="button" onClick={() => setShowRecover('pass')} className="text-gray-500 hover:text-white">LUPA PASSWORD</button>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-500 disabled:opacity-50 transition-all uppercase text-sm">
            {isLoading ? 'Loading...' : (isLoginState ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>
      </div>
    </div>
  );
}
