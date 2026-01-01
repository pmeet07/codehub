#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const commands = require('../lib/commands');

program
    .name('codehub')
    .description('CodeHub Version Control CLI')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize a new CodeHub repository')
    .action(commands.init);

program
    .command('login')
    .description('Login to CodeHub')
    .action(commands.login);

program
    .command('add <pattern>')
    .description('Add files to the staging area')
    .action(commands.add);

program
    .command('commit')
    .description('Record changes to the repository')
    .option('-m, --message <message>', 'Commit message')
    .action(commands.commit);

program
    .command('remote <url>')
    .description('Add a remote repository URL')
    .action(commands.remote);

program
    .command('push')
    .description('Update remote refs along with associated objects')
    .action(commands.push);

program
    .command('pull')
    .description('Fetch from and integrate with another repository or a local branch')
    .action(commands.pull);

program
    .command('branch [name]')
    .description('List available branches')
    .action(commands.branch);

program
    .command('checkout <branch>')
    .description('Switch branches or restore working tree files')
    .option('-b, --create', 'Create a new branch')
    .action(commands.checkout);

program
    .command('clone <url>')
    .description('Clone a repository into a new directory')
    .action(commands.clone);

program.parse(process.argv);
