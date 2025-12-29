require('dotenv').config();
const { User, Repository, PullRequest, sequelize } = require('../src/models');

const seedPRs = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to PostgreSQL...");

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
                ownerId: user.id,
                description: "A demo project for testing",
                isPrivate: false,
                progLanguage: "JavaScript"
            });
        }

        console.log(`Seeding PRs for repo: ${repo.name} by user: ${user.username}`);

        // Get max number
        const lastPR = await PullRequest.findOne({
            where: { repositoryId: repo.id },
            order: [['number', 'DESC']] // Note: number is integer
        });
        let nextNum = (lastPR && !isNaN(lastPR.number)) ? lastPR.number + 1 : 1;

        const prs = [
            {
                title: "Update README.md",
                status: "open",
                sourceBranch: "docs/update",
                targetBranch: "main"
            },
            {
                title: "Fix navigation bug",
                status: "open",
                sourceBranch: "fix/nav",
                targetBranch: "main"
            },
            {
                title: "Legacy Code Removal",
                status: "closed",
                sourceBranch: "chore/cleanup",
                targetBranch: "main"
            }
        ];

        for (const p of prs) {
            await PullRequest.create({
                ...p,
                number: nextNum++,
                repositoryId: repo.id,
                authorId: user.id,
                description: "Automated seeding."
            });
        }

        console.log("✅ Successfully created 3 Mock Pull Requests.");

    } catch (err) {
        console.error("Error Seeding:", err);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

seedPRs();
