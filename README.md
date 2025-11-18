# CollabBoard – Full-Stack Kanban Project Manager

A fully functional Kanban-style task management platform built with React + Node.js + Prisma and deployed on AWS (Elastic Beanstalk + S3).

## Features

### Authentication
- Signup & Login using JWT
- Secure protected routes
- Per-user data isolation

### Projects
- Create projects
- View project-specific dashboards
- Organized clean backend structure

### Tasks
- Create tasks with title + description
- Persisted using Prisma ORM (SQLite or Postgres)
- Filter tasks by project

### Kanban Board
- Columns: **Todo → In Progress → Done**
- Move tasks between statuses
- Real-time updates in UI

---

## Tech Stack

### Frontend
- React + Vite
- Axios for API calls
- Semantic UI + custom CSS
- Hosted on **AWS S3** (Static Website Hosting)

### Backend
- Node.js + Express
- Prisma ORM
- SQLite (dev) / RDS-ready
- JWT Authentication
- Hosted on **AWS Elastic Beanstalk**

---


