import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const env = import.meta.env.VITE_APP_ENV ?? 'development'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // 本番(/)と検証(/dev/)は同一オリジンのため localStorage を共有する。
      // storageKey を分けないとセッションが相互に上書きされる。
      storageKey: `sb-${env}-auth`,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
