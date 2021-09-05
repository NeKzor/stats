const ghPages = require('gh-pages');
const cron = require('node-cron');
const boards = require('./iverb');
const { log } = require('./utils');
const moment = require('moment');

const output = require('path').join(__dirname, '/../api');
const now = process.argv.some((arg) => arg === '-n' || arg === '--now');
const recapNow = process.argv.some((arg) => arg === '--send-recap');
const recapDay = 1; // Monday

let lastDay = moment().day();
let initialRecap = recapNow;

const main = async () => {
    let isRecap = false;

    const today = moment().day();
    if (today !== lastDay) {
        lastDay = today;
        isRecap = today === recapDay;
    }

    if (initialRecap) {
        initialRecap = false;
        isRecap = true;
    }

    try {
        log.info('scraping boards (recap: ' + isRecap + ')');
        await boards(output, isRecap, recapDay);
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
