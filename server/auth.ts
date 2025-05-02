import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express): Promise<void> {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString("hex");
    console.warn("Warning: SESSION_SECRET not set, using a random value");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Update last login time
          const now = new Date();
          await storage.updateUser(user.id, { lastLogin: now });
          
          // Create login audit log
          await storage.createAuditLog({
            userId: user.id,
            actionType: "LOGIN",
            targetEntity: "users",
            targetId: user.id.toString(),
            details: { timestamp: now.toISOString() }
          });
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: 'Pending_Verification',
        status: 'Pending'
      });

      // Create Due Diligence record
      await storage.createDueDiligenceRecord({
        userId: user.id,
        status: 'Pending',
        checklistItems: {
          emailVerified: true,
          basicInfoComplete: false,
          businessRegistrationValid: false,
          kycDocumentsVerified: false,
          backgroundCheckComplete: false,
          referencesChecked: false
        },
        uploadedDocuments: []
      });

      // Audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: 'CREATE_OFFER',
        targetEntity: 'users',
        targetId: user.id.toString(),
        details: { action: 'User registration' }
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: info?.message || "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    if (req.user) {
      const userId = (req.user as User).id;
      
      req.logout((err) => {
        if (err) return next(err);
        
        // Create logout audit log
        storage.createAuditLog({
          userId: userId,
          actionType: "LOGIN", // Using same action type for consistency, differentiating in details
          targetEntity: "users",
          targetId: userId.toString(),
          details: { action: "logout", timestamp: new Date().toISOString() }
        }).catch(console.error); // Don't wait for this to complete
        
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without sensitive data
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}
