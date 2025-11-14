-- Create shadow database for Prisma migrations
CREATE DATABASE IF NOT EXISTS shadow_db;

-- Grant all privileges on shadow database to appuser
GRANT ALL PRIVILEGES ON shadow_db.* TO 'appuser'@'%';

-- Grant all privileges on main database to appuser (redundant but explicit)
GRANT ALL PRIVILEGES ON appdb.* TO 'appuser'@'%';

-- Apply privileges
FLUSH PRIVILEGES;
