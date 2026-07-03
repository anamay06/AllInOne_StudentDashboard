import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './frontend/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking user_settings table...");
  const { data, error } = await supabase.from('user_settings').select('*')
  console.log("Data:", data);
  if (error) console.log("Error:", error);
  
  const { data: users } = await supabase.auth.admin?.listUsers() || { data: "No admin key" };
  console.log("Auth users info (if available):", users);
}

check()
