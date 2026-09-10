import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { resolveRole, type Role } from "@/lib/auth/roles";

function gotrueBase(): string | undefined {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  return url ? `${url}/auth/v1` : undefined;
}

function gotrueKey(): string | undefined {
  return process.env.SUPABASE_ANON_KEY;
}

export function passwordSignInConfigured() {
  return Boolean(gotrueBase() && gotrueKey());
}

type GoTrueUser = {
  id: string;
  email?: string;
  user_metadata?: { name?: string; full_name?: string };
};

async function passwordGrant(email: string, password: string): Promise<GoTrueUser | null> {
  const base = gotrueBase();
  const key = gotrueKey();
  if (!base || !key) return null;
  const response = await fetch(`${base}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { user?: GoTrueUser };
  return payload.user && payload.user.id ? payload.user : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: process.env.AUTH_SECRET || "generated-app-local-development-secret",
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        const user = await passwordGrant(email, password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email ?? email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
      }
      token.role = await resolveRole({
        id: typeof token.sub === "string" ? token.sub : undefined,
        email: typeof token.email === "string" ? token.email : undefined
      });
      return token;
    },
    async session({ session, token }) {
      return {
        user: {
          id: typeof token.sub === "string" ? token.sub : undefined,
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: null,
          role: (token.role as Role | undefined) ?? "member"
        },
        expires: session.expires
      } as typeof session;
    }
  }
}));
