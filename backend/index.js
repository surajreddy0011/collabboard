const express = require("express");
const cors = require("cors");
const prisma = require("./prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";


// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const [, token] = authHeader.split(" "); // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "Invalid auth header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is working!" });
});

// Signup
app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password required" });
      }
  
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      });
  
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  
      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Signup failed" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
  
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });
  

// Get all projects for logged-in user
app.get("/api/projects", authMiddleware, async (req, res) => {
    try {
      const projects = await prisma.project.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: "desc" },
      });
      res.json(projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });
  
  // Create a new project for logged-in user
  app.post("/api/projects", authMiddleware, async (req, res) => {
    try {
      const { name, description } = req.body;
  
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
      }
  
      const project = await prisma.project.create({
        data: { 
          name, 
          description, 
          ownerId: req.user.id 
        },
      });
  
      res.status(201).json(project);
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Get tasks for a project (logged-in user only)
app.get("/api/projects/:projectId/tasks", authMiddleware, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
  
      // ensure project belongs to this user
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user.id },
      });
  
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
  
      const tasks = await prisma.task.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });
  
      res.json(tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Create a task for a project
app.post("/api/projects/:projectId/tasks", authMiddleware, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const { title, description, status } = req.body;
  
      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
      }
  
      // ensure project belongs to this user
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user.id },
      });
  
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
  
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || "TODO",
          projectId,
        },
      });
  
      res.status(201).json(task);
    } catch (err) {
      console.error("Error creating task:", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  // Update task status
app.patch("/api/tasks/:taskId/status", authMiddleware, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const { status } = req.body;
  
      const allowed = ["TODO", "IN_PROGRESS", "DONE"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
  
      // Make sure task belongs to a project owned by this user
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            ownerId: req.user.id,
          },
        },
      });
  
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
  
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status },
      });
  
      res.json(updated);
    } catch (err) {
      console.error("Error updating task status:", err);
      res.status(500).json({ error: "Failed to update task status" });
    }
  });
  
  
  

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  