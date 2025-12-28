module.exports = {
    apps: [
        {
            name: "codehub-backend",
            script: "./backend/server.js",
            env: {
                NODE_ENV: "production",
                PORT: 5000,
                // Add other environment variables here or use a .env file
            },
        },
    ],
};
