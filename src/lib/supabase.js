import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://ffudjrhyemaouqldftza.supabase.co'
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdWRqcmh5ZW1hb3VxbGRmdHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDI3OTQsImV4cCI6MjA5MzkxODc5NH0.cBw-AsK3Q9RrJalGvaXVV3a343BsUquiQBaQZHck-eM'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey

export const supabaseConfigError = null
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
