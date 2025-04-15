# Task Manager API

A comprehensive RESTful API for a task management application built with Node.js, Express, and PostgreSQL.

## Features

- User authentication with JWT tokens and refresh token mechanism
- Task management with categories, priorities, and statuses
- Task assignment and collaboration
- Comments and notifications
- User activity tracking
- Statistics and productivity metrics
- Role-based access control
- API rate limiting
- Docker support

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM for database interactions
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi** - Request validation
- **Docker** - Containerization

## Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL
- Docker and Docker Compose (optional)

## Installation

### Without Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-manager-api.git
   cd task-manager-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development

   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=task_manager_dev
   DB_HOST=localhost
   DB_PORT=5432

   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=1h
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
   REFRESH_TOKEN_EXPIRES_IN=7d

   TEST_DB_USERNAME=postgres
   TEST_DB_PASSWORD=postgres
   TEST_DB_NAME=task_manager_test
   TEST_DB_HOST=localhost
   TEST_DB_PORT=5432
   ```

4. Create the database:
   ```bash
   createdb task_manager_dev
   ```

5. Run migrations:
   ```bash
   npm run db:migrate
   ```

6. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

7. Start the server:
   ```bash
   npm run dev
   ```

### With Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-manager-api.git
   cd task-manager-api
   ```

2. Start the containers:
   ```bash
   docker-compose up
   ```

3. In a separate terminal, run migrations:
   ```bash
   docker-compose exec app npm run db:migrate
   ```

4. Seed the database (optional):
   ```bash
   docker-compose exec app npm run db:seed
   ```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/refresh-token | Refresh access token |
| POST | /api/auth/logout | Logout user |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |
| POST | /api/auth/change-password | Change password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/me | Get current user profile |
| PATCH | /api/users/me | Update current user profile |
| GET | /api/users/me/activity | Get user activity log |
| GET | /api/users | Get all users (admin only) |
| GET | /api/users/:id | Get user by ID (admin only) |
| PATCH | /api/users/:id | Update user (admin only) |
| DELETE | /api/users/:id | Delete user (admin only) |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tasks | Create a new task |
| GET | /api/tasks | Get all tasks with filtering and pagination |
| GET | /api/tasks/:id | Get task by ID |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/categories | Create a new category |
| GET | /api/categories | Get all categories for current user |
| GET | /api/categories/:id | Get category by ID |
| PATCH | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/comments | Create a new comment |
| GET | /api/comments | Get comments for a task |
| PATCH | /api/comments/:id | Update comment |
| DELETE | /api/comments/:id | Delete comment |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get all notifications for current user |
| PATCH | /api/notifications/:id | Mark notification as read |
| PATCH | /api/notifications | Mark all notifications as read |
| DELETE | /api/notifications/:id | Delete notification |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats/tasks | Get task statistics for current user |
| GET | /api/stats/productivity | Get productivity statistics for current user |
| GET | /api/stats/projects | Get project statistics (admin only) |

## Testing

Run tests with:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Database Schema

The database consists of the following tables:

- **users** - User accounts
- **tasks** - Tasks with status, priority, due dates
- **categories** - Task categories/projects
- **comments** - Task comments
- **notifications** - User notifications
- **user_activities** - User activity logs
- **refresh_tokens** - JWT refresh tokens

## Project Structure

```
task-manager-api/
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── database/           # Database migrations and seeders
│   ├── middlewares/        # Express middlewares
│   ├── models/             # Sequelize models
│   ├── routes/             # Express routes
│   ├── services/           # Business logic
│   ├── tests/              # Tests
│   ├── utils/              # Utility functions
│   └── server.js           # Express app
├── .env                    # Environment variables
├── .sequelizerc            # Sequelize configuration
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration
└── package.json            # Dependencies and scripts
```

## License

This project is licensed under the MIT License.

## Author

Mathiarasan.S using AI.

NOTE: this entire project is build using single prompt with AI. 
I havent coded sngle line in this project, even postman collections are created by model itself.

Then why should you hire me?
becuase I am a experienced software engineer who can deliver working production grade products in shorter span of time leveraging AI models.

Hireme if you want results faster and in good production grade quality.
