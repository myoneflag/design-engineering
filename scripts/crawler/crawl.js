const puppeteer = require('puppeteer');
const util = require('util');

const url = process.env.DOCUMENT_URL;
const { hostname } = new URL(url);
const adminSessionID = process.env.SESSIONID;
const docIdsFile = process.env.DOCIDS_FILE;
const env = process.env.ENV

var fs = require('fs')

console.log({ url, hostname, adminSessionID, docIdsFile, env})

const docIds = []
readDocIdsFromFile();

const artifactsPath = `temp/${Date.now()}_${env}`
if (!fs.existsSync(artifactsPath)){
    fs.mkdirSync(artifactsPath);
}
var logger

function initLogger(docId) { 
    logger = fs.createWriteStream(`${artifactsPath}/${docId}_log.txt`, { flags: 'a' })
}
function logLine(string) { logger.write(string + "\r\n") }
function closeLog() { logger.close() }

function readDocIdsFromFile() {
    require('fs').readFileSync(docIdsFile, 'utf-8').split(/\r?\n/).forEach(function (line) {
        docIds.push(parseInt(line));
    });
}

process.on('unhandledRejection', error => {
    throw error;
});

let browser;
let count = 0;
( async () => {
    if (!browser) {
        browser = await puppeteer.launch();
    }
    for (const docId of docIds) {
        try {
            initLogger(docId, env);
            logLine(`DocumentID ${docId}`); 
    
            const page = await browser.newPage();
            page.setCookie({ 
                    name: "session-id", 
                    value: adminSessionID, 
                    domain: hostname
                })
            await page.setViewport({
                width: 1240,
                height: 960
            });
            page
                .on('console', message =>
                    logLine(`${message.type()} ${message.text()} ${message.stackTrace().map(l => l.url).join("\r\n")}`))
                .on('error', (error) => { logLine(error.message); logLine(error.stackTrace); } )
                .on('response', response =>
                    logLine(`${response.status()} ${response.url()}`))
                .on('requestfailed', request =>
                    logLine(`${request.failure().errorText} ${request.url()}`))
    
                    const docUrl = url.replace("DOC_ID", docId);
            
            logLine(`Opening ${docUrl}`);
    
            await page.goto(docUrl, { waitUntil: 'networkidle2', timeout: 0 });
    
            // green icon selector
            const selector="#calculation-check-error,#calculation-check-success,.toast-header";
            try {
                const sel = await page.waitForSelector(selector, {timeout: 120*1000})
                logLine(`Received selector ${sel.asElement().getProperty("id")}`);
            } catch(e) {
                logLine(`Timeout ${e} waiting for selector`);
            }
            
    
            await page.screenshot({path: `${artifactsPath}/${docId}_screen.png`});
            await page.close()
    
            closeLog();
    
            console.log("Done docId", docId, `${++count}/${docIds.length}`);
    
        } catch(err) {
            console.error(err)
        }
    }
    process.exit(0);
})();
