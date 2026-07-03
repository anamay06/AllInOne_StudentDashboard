import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      setSuccess(true);
      // Supabase sends email confirmation by default.
      // If it's disabled, the user is logged in automatically or they can just log in.
      // We'll redirect to login after 2 seconds if successful.
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card border-[3px] border-primary rounded-[2.5rem] shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
        
        <div className="text-center mb-8">
          <p className="font-bold text-muted-foreground">Create an account to start.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-green-500 text-green-700 font-bold rounded-xl text-sm">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="font-bold text-sm tracking-wide text-foreground ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border-[3px] border-primary/20 focus:border-primary rounded-2xl py-3 pl-10 pr-4 font-bold outline-none transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm tracking-wide text-foreground ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border-[3px] border-primary/20 focus:border-primary rounded-2xl py-3 pl-10 pr-4 font-bold outline-none transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm tracking-wide text-foreground ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background border-[3px] border-primary/20 focus:border-primary rounded-2xl py-3 pl-10 pr-4 font-bold outline-none transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || success}
            className="w-full text-lg font-black tracking-widest py-6 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-[0px_0px_0px_var(--tw-shadow-color)] hover:translate-y-1 hover:translate-x-1 rounded-2xl transition-all duration-300"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'SIGN UP'}
          </Button>
        </form>

        <div className="mt-8 text-center font-bold text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline underline-offset-4 decoration-2">
            Log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
