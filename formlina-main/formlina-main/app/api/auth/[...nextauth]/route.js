import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          console.log("No user found with email:", credentials.email);
          throw new Error("CredentialsSignin");
        }
        if (!user.password) {
          console.log("User has no password set (likely Google user):", user);
          throw new Error("CredentialsSignin");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log("Invalid password for user:", credentials.email);
          throw new Error("CredentialsSignin");
        }
        console.log("User authenticated:", user.email);
        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await dbConnect();
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name,
          googleId: account?.providerAccountId,
        });
      }
      return true;
    },
    async session({ session, token }) {
      await dbConnect();
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        session.user.id = dbUser._id.toString();
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };