const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const axios = require('axios');
const crypto = require('crypto');
const glob = require('glob');

const API_URL = 'http://localhost:5000/api';
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.codehub-config.json');

// --- Helper Functions ---

const getRepoRoot = () => {
    let current = process.cwd();
    while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.codehub'))) {
            return current;
        }
        current = path.dirname(current);
    }
    return null;
};

const hashContent = (content) => crypto.createHash('sha256').update(content).digest('hex');

// --- Commands ---

exports.init = async () => {
    const codehubDir = path.join(process.cwd(), '.codehub');
    if (fs.existsSync(codehubDir)) {
        console.log(chalk.red('Initialized CodeHub repository already exists.'));
        return;
    }

    await fs.ensureDir(path.join(codehubDir, 'objects'));
    await fs.writeJson(path.join(codehubDir, 'config.json'), { head: null, remote: null, currentBranch: 'main' });
    await fs.writeJson(path.join(codehubDir, 'index.json'), []); // Staging area

    console.log(chalk.green('Initialized empty CodeHub repository in ' + codehubDir));
};

exports.login = async () => {
    const questions = [
        { type: 'input', name: 'email', message: 'Email:' },
        { type: 'password', name: 'password', message: 'Password:' }
    ];

    const answers = await inquirer.prompt(questions);

    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: answers.email,
            password: answers.password
        });

        await fs.writeJson(CONFIG_FILE, { token: res.data.token, user: res.data.user });
        console.log(chalk.green('Logged in successfully!'));
    } catch (err) {
        console.error(chalk.red('Login failed: ' + (err.response?.data?.message || err.message)));
    }
};

exports.remote = async (url) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const config = await fs.readJson(configPath);
    config.remote = url;
    await fs.writeJson(configPath, config);

    console.log(chalk.green(`Remote set to: ${url}`));
};

exports.add = async (pattern) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    if (pattern === '.') {
        pattern = '**/*';
    }

    const files = glob.sync(pattern, { cwd: root, ignore: ['.codehub/**', 'node_modules/**'], nodir: true });
    if (files.length === 0) {
        console.log(chalk.yellow('No files matched.'));
        return;
    }

    const indexPath = path.join(root, '.codehub', 'index.json');
    let existingIndex = [];
    try { existingIndex = await fs.readJson(indexPath); } catch (e) { }

    // Map for O(1) lookup
    const indexMap = new Map(existingIndex.map(i => [i.path, i]));
    let addedCount = 0;

    for (const file of files) {
        const filePath = path.join(root, file);
        if (fs.lstatSync(filePath).isDirectory()) continue;

        const content = await fs.readFile(filePath);
        const hash = hashContent(content);

        // Optimization: Only write object if hash is new or object missing
        const objectPath = path.join(root, '.codehub', 'objects', hash);
        if (!fs.existsSync(objectPath)) {
            await fs.ensureDir(path.join(root, '.codehub', 'objects'));
            await fs.writeFile(objectPath, content);
        }

        // Update index
        const existingEntry = indexMap.get(file);
        if (!existingEntry || existingEntry.hash !== hash) {
            indexMap.set(file, { path: file, hash });
            addedCount++;
        }
    }

    await fs.writeJson(indexPath, Array.from(indexMap.values()));
    console.log(chalk.green(`Stage updated. ${addedCount} files changed or added.`));
};

exports.commit = async (options) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    if (!options.message) {
        console.error(chalk.red('Commit message required. Use -m "message"'));
        return;
    }

    const indexPath = path.join(root, '.codehub', 'index.json');
    const configPath = path.join(root, '.codehub', 'config.json');

    const index = await fs.readJson(indexPath);
    const config = await fs.readJson(configPath);

    if (index.length === 0) {
        console.log(chalk.yellow('Nothing to commit (staging area empty).'));
        return;
    }

    // 1. Create Tree Object
    const treeHash = hashContent(JSON.stringify(index));
    await fs.writeFile(path.join(root, '.codehub', 'objects', treeHash), JSON.stringify(index));

    // 2. Create Commit Object
    const commit = {
        treeHash,
        parentHash: config.head,
        message: options.message,
        timestamp: new Date().toISOString()
    };

    // Calculate Commit Hash
    const commitContent = JSON.stringify(commit);
    const commitHash = hashContent(commitContent);
    commit.hash = commitHash; // Add hash to object for easy ref

    await fs.writeFile(path.join(root, '.codehub', 'objects', commitHash), commitContent);

    // 3. Update HEAD
    config.head = commitHash;
    await fs.writeJson(configPath, config);

    console.log(chalk.green(`[${config.currentBranch} ${commitHash.substring(0, 7)}] ${options.message}`));
};

exports.branch = async (branchName) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const config = await fs.readJson(configPath);

    if (!branchName) {
        // List branches (local only for now, simplistic)
        console.log(chalk.green(`* ${config.currentBranch}`));
        return;
    }

    // Create new branch
    // For now, this is just a pointer switch in a real VCS, but here we just store it in config?
    // Actually, we need to store branch heads locally. 
    // Let's implement a simple model: config.branches = { branchName: headHash }

    // BUT for this MVP, let's just allow switching the "currentBranch" name in config
    // assuming we are branching off the current HEAD.
    console.log(chalk.blue(`Switched to branch '${branchName}'`));
    config.currentBranch = branchName;
    await fs.writeJson(configPath, config);
};


exports.push = async () => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const repoConfig = await fs.readJson(configPath);

    if (!repoConfig.remote) {
        console.error(chalk.red('No remote configured. Use "codehub remote <url>"'));
        return;
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        console.error(chalk.red('Please login first.'));
        return;
    }
    const userConfig = await fs.readJson(CONFIG_FILE);

    // Extract repo data
    try {
        const urlParts = repoConfig.remote.split('/');
        const repoName = urlParts.pop();
        const username = urlParts.pop();

        // 1. Get Repo ID
        console.log(chalk.blue('Fetching repository info...'));
        const { data: { repo } } = await axios.get(`${API_URL}/repos/${username}/${repoName}`);

        // 2. Gather history
        const commitHash = repoConfig.head;
        if (!commitHash) {
            console.log(chalk.yellow('Nothing to push.'));
            return;
        }

        const commitContent = await fs.readFile(path.join(root, '.codehub', 'objects', commitHash));
        const commit = JSON.parse(commitContent);
        commit.hash = commitHash;

        // Read Tree
        const treeContent = await fs.readFile(path.join(root, '.codehub', 'objects', commit.treeHash));
        const tree = JSON.parse(treeContent);

        const objects = [];
        // Send objects as Base64 to preserve binary integrity (images, utf-16, etc.)
        objects.push({ hash: commitHash, content: commitContent.toString('base64') });
        objects.push({ hash: commit.treeHash, content: treeContent.toString('base64') });

        for (const file of tree) {
            const blobContent = await fs.readFile(path.join(root, '.codehub', 'objects', file.hash));
            objects.push({ hash: file.hash, content: blobContent.toString('base64') });
        }

        // 3. Send to Server
        const branchName = repoConfig.currentBranch || 'main'; // Default to main
        console.log(chalk.blue(`Pushing to ${username}/${repoName} (${branchName})...`));

        await axios.post(`${API_URL}/repos/${repo._id}/push`, {
            commits: [commit],
            objects,
            branch: branchName
        }, {
            headers: { 'x-auth-token': userConfig.token },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log(chalk.green('Push successful!'));

    } catch (err) {
        console.error(chalk.red('Push failed: ' + (err.response?.data?.message || err.message)));
    }
};

exports.pull = async () => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const config = await fs.readJson(configPath);

    if (!config.remote) {
        console.error(chalk.red('No remote configured.'));
        return;
    }

    try {
        const urlParts = config.remote.split('/');
        const repoName = urlParts.pop();
        const username = urlParts.pop();
        const branch = config.currentBranch || 'main';

        console.log(chalk.blue(`Pulling from ${username}/${repoName} (${branch})...`));

        // 1. Fetch Remote State
        const { data: { repo, tree, currentCommit } } = await axios.get(`${API_URL}/repos/${username}/${repoName}?branch=${branch}`);

        if (!currentCommit) {
            console.log(chalk.yellow('Branch is empty or does not exist on remote.'));
            return;
        }

        if (currentCommit.hash === config.head) {
            console.log(chalk.green('Already up to date.'));
            return;
        }

        console.log(chalk.gray(`Updating to commit ${currentCommit.hash.substring(0, 7)}...`));

        // 2. Download & Restore Files
        for (const file of tree) {
            const filePath = path.join(root, file.path);
            const objectPath = path.join(root, '.codehub', 'objects', file.hash);

            // If we don't have the blob object locally, fetch it (Optimization: check fs.exists)
            if (!fs.existsSync(objectPath)) {
                const { data: content } = await axios.get(`${API_URL}/repos/${repo._id}/blob/${file.hash}`);
                await fs.outputFile(filePath, content); // Write to working dir
                await fs.ensureDir(path.dirname(objectPath));
                await fs.writeFile(objectPath, content); // Save to object store
            } else {
                // We have object, just restore file
                const content = await fs.readFile(objectPath);
                await fs.outputFile(filePath, content);
            }
        }

        // 3. Update Head
        config.head = currentCommit.hash;
        await fs.writeJson(configPath, config);

        console.log(chalk.green('Pull successful!'));

    } catch (err) {
        console.error(chalk.red('Pull failed: ' + (err.response?.data?.message || err.message)));
    }
};

exports.branch = async (branchName) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const config = await fs.readJson(configPath);

    if (branchName) {
        // Create/Switch Branch
        console.log(chalk.blue(`Switched to branch '${branchName}'`));
        config.currentBranch = branchName;
        await fs.writeJson(configPath, config);
        return;
    }

    // List Branches
    if (config.remote) {
        try {
            const urlParts = config.remote.split('/');
            const repoName = urlParts.pop();
            const username = urlParts.pop();
            const { data: { repo } } = await axios.get(`${API_URL}/repos/${username}/${repoName}`);

            console.log(chalk.blue('Branches:'));
            // Ensure repo.branches is an array (API might return object/map)
            const remoteBranches = Array.isArray(repo.branches) ? repo.branches : [];
            const allBranches = new Set(remoteBranches);
            if (config.currentBranch) allBranches.add(config.currentBranch);

            allBranches.forEach(b => {
                const isRemote = remoteBranches.includes(b);
                const isCurrent = (b === config.currentBranch);
                const prefix = isCurrent ? '*' : ' ';
                const suffix = !isRemote ? '(local)' : '';
                console.log(chalk.green(`${prefix} ${b} ${suffix}`));
            });
        } catch (e) {
            console.log(chalk.yellow(`Current local branch: ${config.currentBranch || 'main'}`));
            console.log(chalk.gray('(Could not fetch remote branches)'));
        }
    } else {
        console.log(chalk.green(`* ${config.currentBranch || 'main'}`));
    }
};

exports.checkout = async (branchName) => {
    const root = getRepoRoot();
    if (!root) {
        console.error(chalk.red('Not a CodeHub repository.'));
        return;
    }
    if (!branchName) {
        console.error(chalk.red('Branch name required.'));
        return;
    }

    const configPath = path.join(root, '.codehub', 'config.json');
    const config = await fs.readJson(configPath);

    if (config.currentBranch === branchName) {
        console.log(chalk.green(`Already on '${branchName}'`));
        return;
    }

    config.currentBranch = branchName;
    await fs.writeJson(configPath, config);
    console.log(chalk.green(`Switched to branch '${branchName}'`));

    // Auto-pull to sync state
    await exports.pull();
};

exports.clone = async (url) => {
    // url example: http://localhost:5173/username/repoName
    try {
        const urlParts = url.split('/');
        const repoName = urlParts.pop();
        const username = urlParts.pop();

        const targetDir = path.join(process.cwd(), repoName);
        if (fs.existsSync(targetDir)) {
            console.error(chalk.red(`Destination path '${repoName}' already exists and is not an empty directory.`));
            return;
        }

        console.log(chalk.blue(`Cloning into '${repoName}'...`));

        // 1. Get Repo Details
        const { data: { repo, tree } } = await axios.get(`${API_URL}/repos/${username}/${repoName}`);

        // 2. Setup Directory
        await fs.ensureDir(targetDir);
        await fs.ensureDir(path.join(targetDir, '.codehub', 'objects'));

        // 3. Initialize Config
        await fs.writeJson(path.join(targetDir, '.codehub', 'config.json'), {
            head: repo.headCommit ? repo.headCommit.hash : null,
            remote: url,
            currentBranch: 'main'
        });

        // 4. Download Objects & Restore Files
        // If tree is present (even if headCommit object is somehow missing/nested), restore it
        if (tree && tree.length > 0) {
            // Restore files
            for (const file of tree) {
                const filePath = path.join(targetDir, file.path);
                console.log(chalk.gray(`Restoring ${file.path}...`));

                // Fetch Blob Content
                const { data: content } = await axios.get(`${API_URL}/repos/${repo._id}/blob/${file.hash}`);

                await fs.outputFile(filePath, content);
                await fs.writeFile(path.join(targetDir, '.codehub', 'objects', file.hash), content);
            }
        }

        console.log(chalk.green('Clone successful!'));

    } catch (err) {
        console.error(chalk.red('Clone failed: ' + (err.response?.data?.message || err.message)));
    }
};
