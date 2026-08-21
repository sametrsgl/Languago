import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { createSupabaseClient, type CookieStore } from '../lib/supabase';

const credentials = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
});

/**
 * Convert an Action context's `cookies` into our cookie store shape.
 * Both `Astro.cookies` and action handler `ctx.cookies` support this API.
 */
function storeFrom(ctx: { cookies: CookieStore }): CookieStore {
  return ctx.cookies;
}

export const server = {
  /**
   * Create a new student account (email/password). The `profiles` row is
   * created automatically by the `on_auth_user_created` trigger in
   * supabase/schema.sql. Session (if any) is saved to HTTP-only cookies by the
   * SSR client.
   */
  signup: defineAction({
    accept: 'form',
    input: credentials.extend({
      fullName: z.string().trim().max(120).optional(),
    }),
    handler: async (input, ctx) => {
      const supabase = createSupabaseClient(storeFrom(ctx));
      if (!supabase) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message:
            'Kayıt şu anda devre dışı: SUPABASE_URL ve SUPABASE_ANON_KEY ayarlanmamış.',
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: input.fullName ? { full_name: input.fullName } : undefined,
        },
      });

      if (error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }

      // If email confirmation is disabled in the Supabase project, the user is
      // signed straight in (a session exists). Otherwise they must confirm.
      return { ok: true, hasSession: Boolean(data.session) };
    },
  }),

  /** Sign an existing user in and store the session in cookies via the SSR client. */
  signin: defineAction({
    accept: 'form',
    input: credentials,
    handler: async (input, ctx) => {
      const supabase = createSupabaseClient(storeFrom(ctx));
      if (!supabase) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message:
            'Giriş şu anda devre dışı: SUPABASE_URL ve SUPABASE_ANON_KEY ayarlanmamış.',
        });
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }

      return { ok: true };
    },
  }),

  /** Sign the current user out and clear the auth cookies. */
  signout: defineAction({
    handler: async (_input, ctx) => {
      const supabase = createSupabaseClient(storeFrom(ctx));
      if (supabase) {
        await supabase.auth.signOut();
      }
      return { ok: true };
    },
  }),
};