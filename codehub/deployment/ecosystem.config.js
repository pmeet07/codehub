module.exports = {
    apps: [
        {
            name: "codehub-backend",
            script: "./backend/server.js",
            env: {
                NODE_ENV: "production",
                PORT: 5000,
                DATABASE_URL: "postgres://user:password@localhost:5432/codehub_db"
            },
        },
    ],
};
