require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Repository = require('../src/models/Repository');
const PullRequest = require('../src/models/PullRequest');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codehub';

const seedPRs = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        const user = await User.findOne();
        if (!user) {
            console.log("❌ No users found to attach PRs to.");
            return;
        }

        let repo = await Repository.findOne();
        if (!repo) {
            console.log("Creating demo repository...");
            repo = await Repository.create({
                name: "demo-project",
                owner: user._id,
                description: "A demo project for testing",
                visibility: "public",
                language: "JavaScript"
            });
        }

        console.log(`Seeding PRs for repo: ${repo.name} by user: ${user.username}`);

        const prs = [
            {
                title: "Update README.md",
                status: "open",
                sourceBranch: "docs/update",
                targetBranch: "main",
                number: await getNextNumber(repo._id)
            },
            {
                title: "Fix navigation bug",
                status: "open",
                sourceBranch: "fix/nav",
                targetBranch: "main",
                number: await getNextNumber(repo._id) + 1
            },
            {
                title: "Legacy Code Removal",
                status: "closed",
                sourceBranch: "chore/cleanup",
                targetBranch: "main",
                number: await getNextNumber(repo._id) + 2
            }
        ];

        for (const p of prs) {
            await PullRequest.create({
                ...p,
                repository: repo._id,
                author: user._id,
                description: "Automated seeding."
            });
        }

        console.log("✅ Successfully created 3 Mock Pull Requests.");

    } catch (err) {
        console.error("Error Seeding:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

// Helper to simulate auto-increment
async function getNextNumber(repoId) {
    return Math.floor(Math.random() * 1000) + 1;
}

seedPRs();
