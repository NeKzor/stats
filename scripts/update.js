const ghPages = require('gh-pages');
const cron = require('node-cron');
const iverb = require('./iverb');
const { log } = require('./utils');

const output = require('path').join(__dirname, '/../api');
const now = process.argv.some((arg) => arg === '-n' || arg === '--now');

const main = async () => {
    try {
        log.info('scraping iverb');
        await iverb(output);
    } catch (err) {
        log.error(err);
    }

    publish();
};

const recap = async () => {
    try {
        log.info('scraping iverb (w/recap)')
        await iverb(output, true);
    } catch (err) {
        log.error(err);
    }

    publish();
};

const publish = () => {
    ghPages.publish(
        output,
        {
            repo: `https://${process.env.GITHUB_TOKEN}@github.com/NeKzBot/iverb-stats.git`,
            silent: true,
            branch: 'api',
            message: 'Update',
            user: {
                name: 'NeKzBot',
                email: '44978126+NeKzBot@users.noreply.github.com',
            },
        },
        (err) => (err ? log.error(err) : log.success('Published')),
    );
};

if (now) {
    main();
}

cron.schedule('0 * * * *', main);
cron.schedule('0 0 * * MON', recap);
