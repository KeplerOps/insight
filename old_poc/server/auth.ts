import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import type { IVerifyOptions } from "passport-local";
import pkg from 'pg';
const { Pool } = pkg;

const scryptAsync = promisify(scrypt);

// Create PostgreSQL pool for sessions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      email?: string | null;
      githubId?: string | null;
      googleId?: string | null;
      openaiKey?: string | null;
      anthropicKey?: string | null;
      githubKey?: string | null;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  const PostgresqlStore = pgSession(session);

  // Enhanced session settings for persistent sessions
  const sessionSettings: session.SessionOptions = {
    store: new PostgresqlStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "cygnus-x-secret",
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: app.get("env") === "production",
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
      sameSite: 'strict' as const,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Add session regeneration middleware
  app.use((req, res, next) => {
    // @ts-ignore - Types are incorrect for these session methods
    if (req.session && !req.session.regenerate) {
      // @ts-ignore
      req.session.regenerate = (cb: (err: any) => void) => {
        cb(null);
      };
    }
    // @ts-ignore
    if (req.session && !req.session.save) {
      // @ts-ignore
      req.session.save = (cb: (err: any) => void) => {
        cb(null);
      };
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
    }

    passport.authenticate(
      "local", 
      (err: Error | null, user: Express.User | false, info: IVerifyOptions | undefined) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(400).send(info?.message || "Authentication failed");
        }

        // Regenerate session when signing in for security
        req.session.regenerate((err) => {
          if (err) {
            return next(err);
          }

          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }

            // Save session before sending response
            req.session.save((err) => {
              if (err) {
                return next(err);
              }
              return res.json({
                message: "Login successful",
                user: { id: user.id, username: user.username },
              });
            });
          });
        });
      }
    )(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          ...result.data,
          password: hashedPassword,
        })
        .returning();

      // Generate new session and log the user in
      req.session.regenerate((err) => {
        if (err) {
          return next(err);
        }

        req.login(newUser, (err) => {
          if (err) {
            return next(err);
          }

          req.session.save((err) => {
            if (err) {
              return next(err);
            }
            return res.json({
              message: "Registration successful",
              user: { id: newUser.id, username: newUser.username },
            });
          });
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Properly destroy session on logout
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('sessionId');
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}