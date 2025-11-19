import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "http://collabboard-backend-env.eba-nhwvjgt2.us-east-1.elasticbeanstalk.com";


function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");

  // Task-related state
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("TODO");

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/projects`, {
        headers: authHeaders,
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load projects");
    }
  };

  const fetchTasks = async (projectId) => {
    if (!token || !projectId) return;
    try {
      const res = await axios.get(
        `${API_BASE}/api/projects/${projectId}/tasks`,
        { headers: authHeaders }
      );
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const url =
        authMode === "signup"
          ? `${API_BASE}/api/auth/signup`
          : `${API_BASE}/api/auth/login`;

      const payload =
        authMode === "signup"
          ? { name: authName, email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword };

      const res = await axios.post(url, payload);

      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage(authMode === "signup" ? "Signup successful" : "Login successful");
      setAuthPassword("");
      if (authMode === "signup") setAuthName("");

      fetchProjects();
    } catch (err) {
      console.error(err);
      setMessage("Auth failed");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProjects([]);
    setTasks([]);
    setSelectedProjectId(null);
    setMessage("Logged out");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE}/api/projects`,
        { name, description },
        { headers: authHeaders }
      );
      setMessage("Project created!");
      setName("");
      setDescription("");
      setProjects((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create project");
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setTasks([]);
    fetchTasks(projectId);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setMessage("Select a project first");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/api/projects/${selectedProjectId}/tasks`,
        {
          title: taskTitle,
          description: taskDescription,
          status: taskStatus,
        },
        { headers: authHeaders }
      );
      setMessage("Task created!");
      setTaskTitle("");
      setTaskDescription("");
      setTaskStatus("TODO");
      setTasks((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: authHeaders }
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.data : t))
      );
    } catch (err) {
      console.error(err);
      setMessage("Failed to update task status");
    }
  };

  // --- UI for not-logged-in ---
  if (!token || !user) {
    return (
      <div className="app auth-screen">
        <div className="card auth-card">
          <h1 className="app-title">CollabBoardd</h1>
          <p className="app-subtitle">Simple collaborative project & task manager</p>

          <div className="auth-toggle">
            <button
              onClick={() => setAuthMode("login")}
              className={
                authMode === "login" ? "btn btn-primary" : "btn btn-secondary"
              }
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={
                authMode === "signup" ? "btn btn-primary" : "btn btn-secondary"
              }
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="form">
            {authMode === "signup" && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="********"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {authMode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  // --- UI for logged-in ---
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">CollabBoard</h1>
          <p className="app-subtitle">
            Logged in as <strong>{user.name}</strong> ({user.email})
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="layout">
        {/* Left: Projects */}
        <section className="panel">
          <h2 className="panel-title">Projects</h2>

          <form onSubmit={handleCreateProject} className="form card form-compact">
            <h3 className="section-title">Create Project</h3>
            <div className="form-group">
              <label>Project name</label>
              <input
                type="text"
                placeholder="e.g. Internship Prep"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                placeholder="Short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Add Project
            </button>
          </form>

          <div className="card list-card">
            <h3 className="section-title">Your Projects</h3>
            {projects.length === 0 ? (
              <p className="muted">No projects yet.</p>
            ) : (
              <ul className="list">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className={
                      p.id === selectedProjectId
                        ? "list-item list-item-active"
                        : "list-item"
                    }
                  >
                    <div className="list-item-main">
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => handleSelectProject(p.id)}
                      >
                        View tasks
                      </button>
                      <div>
                        <div className="list-item-title">{p.name}</div>
                        <div className="list-item-subtitle">
                          {p.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div className="tag">ID: {p.id}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {message && <p className="message">{message}</p>}
        </section>

        {/* Right: Tasks / Kanban */}
        <section className="panel">
          <h2 className="panel-title">
            Tasks{" "}
            {selectedProjectId && (
              <span className="tag tag-soft">Project #{selectedProjectId}</span>
            )}
          </h2>

          {!selectedProjectId ? (
            <div className="card">
              <p className="muted">Select a project on the left to manage its tasks.</p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleCreateTask}
                className="form card form-compact"
              >
                <h3 className="section-title">Create Task</h3>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Task title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea
                    placeholder="Details..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="form-group-inline">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-end" }}
                  >
                    Add Task
                  </button>
                </div>
              </form>

              <div className="kanban">
                {["TODO", "IN_PROGRESS", "DONE"].map((columnStatus) => (
                  <div key={columnStatus} className="kanban-column">
                    <h3 className="kanban-title">
                      {columnStatus.replace("_", " ")}
                    </h3>
                    <div className="kanban-column-body">
                      {tasks.filter((t) => t.status === columnStatus).length ===
                      0 ? (
                        <p className="muted small">No tasks</p>
                      ) : (
                        tasks
                          .filter((t) => t.status === columnStatus)
                          .map((t) => (
                            <div key={t.id} className="task-card">
                              <div className="task-title">{t.title}</div>
                              <div className="task-desc">
                                {t.description || "No description"}
                              </div>
                              <div className="task-actions">
                                {columnStatus !== "TODO" && (
                                  <button
                                    type="button"
                                    className="btn btn-small btn-chip"
                                    onClick={() =>
                                      handleUpdateTaskStatus(t.id, "TODO")
                                    }
                                  >
                                    To Do
                                  </button>
                                )}
                                {columnStatus !== "IN_PROGRESS" && (
                                  <button
                                    type="button"
                                    className="btn btn-small btn-chip"
                                    onClick={() =>
                                      handleUpdateTaskStatus(t.id, "IN_PROGRESS")
                                    }
                                  >
                                    In Progress
                                  </button>
                                )}
                                {columnStatus !== "DONE" && (
                                  <button
                                    type="button"
                                    className="btn btn-small btn-chip"
                                    onClick={() =>
                                      handleUpdateTaskStatus(t.id, "DONE")
                                    }
                                  >
                                    Done
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
