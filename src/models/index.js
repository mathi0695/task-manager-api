const User = require('./user');
const Task = require('./task');
const Category = require('./category');
const Comment = require('./comment');
const Notification = require('./notification');
const UserActivity = require('./userActivity');
const RefreshToken = require('./refreshToken');

// Define associations
User.hasMany(Task, { 
  foreignKey: 'createdById',
  as: 'createdTasks'
});
Task.belongsTo(User, { 
  foreignKey: 'createdById',
  as: 'creator'
});

User.hasMany(Task, { 
  foreignKey: 'assignedToId',
  as: 'assignedTasks'
});
Task.belongsTo(User, { 
  foreignKey: 'assignedToId',
  as: 'assignee'
});

User.hasMany(Category, { 
  foreignKey: 'userId',
  as: 'categories'
});
Category.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

Category.hasMany(Task, { 
  foreignKey: 'categoryId',
  as: 'tasks'
});
Task.belongsTo(Category, { 
  foreignKey: 'categoryId',
  as: 'category'
});

Task.hasMany(Task, { 
  foreignKey: 'parentTaskId',
  as: 'subtasks'
});
Task.belongsTo(Task, { 
  foreignKey: 'parentTaskId',
  as: 'parentTask'
});

User.hasMany(Comment, { 
  foreignKey: 'userId',
  as: 'comments'
});
Comment.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

Task.hasMany(Comment, { 
  foreignKey: 'taskId',
  as: 'comments'
});
Comment.belongsTo(Task, { 
  foreignKey: 'taskId',
  as: 'task'
});

Comment.hasMany(Comment, { 
  foreignKey: 'parentCommentId',
  as: 'replies'
});
Comment.belongsTo(Comment, { 
  foreignKey: 'parentCommentId',
  as: 'parentComment'
});

User.hasMany(Notification, { 
  foreignKey: 'userId',
  as: 'notifications'
});
Notification.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

Task.hasMany(Notification, { 
  foreignKey: 'taskId',
  as: 'notifications'
});
Notification.belongsTo(Task, { 
  foreignKey: 'taskId',
  as: 'task'
});

Comment.hasMany(Notification, { 
  foreignKey: 'commentId',
  as: 'notifications'
});
Notification.belongsTo(Comment, { 
  foreignKey: 'commentId',
  as: 'comment'
});

User.hasMany(UserActivity, { 
  foreignKey: 'userId',
  as: 'activities'
});
UserActivity.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(RefreshToken, { 
  foreignKey: 'userId',
  as: 'refreshTokens'
});
RefreshToken.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Task,
  Category,
  Comment,
  Notification,
  UserActivity,
  RefreshToken
};
