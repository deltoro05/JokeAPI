const { unused, isEmpty, generateUUID, colors } = require("svcorelib");
const fs = require("fs-extra");
const clipboard = require("clipboardy");
const settings = require("../settings");


/** @typedef {import("../src/auth").TokenObj} TokenObj */

/**
 * @typedef {object} CLIArgs
 * @prop {number} amount The amount of tokens to generate - defaults to `1`
 * @prop {boolean} noCopy Whether to disable copying the token to clipboard
 */


/**
 * Runs the add-token script
 */
async function addToken()
{
    try
    {
        const args = parseArgs();


        /** @type {number|null} To be implemented some time to allow fine control of rate limit budget when providing a token. This would maybe pave way for premium / business tier :) - Defaults to `null` */
        const maxReqs = null;

        {
            const tokens = generateTokens(args.amount);

            console.log(`┌\n│ Adding token${tokens.length > 1 ? "s" : ""} to the registry file at '${settings.auth.tokenListFile}' ${typeof maxReqs === "number" ? `(request budget = ${maxReqs.toString()})` : "(default request budget)"}:\n│`);

            await saveTokens(tokens, maxReqs);

            process.stdout.write("│\n");


            if(!args.noCopy && tokens.length === 1)
            {
                try
                {
                    await clipboard.write(tokens[0]);

                    process.stdout.write(`│ ${colors.fg.blue}Copied token to clipboard. To disable, use ${colors.fg.rst}npm run add-token -- -nc\n│\n`);
                }
                catch(err)
                {
                    process.stdout.write(`│ ${colors.fg.yellow}(couldn't copy token to clipboard)${colors.rst}\n│\n`);
                }
            }
        }


        console.log(`│ Documentation reference: ${settings.info.docsURL}/#api-tokens`);


        process.stdout.write("└\n\n");

        return process.exit(0);
    }
    catch(err)
    {
        console.error(`\n│ ${colors.fg.red}Error:${colors.rst} ${err.toString()}\n└\n`);
        return process.exit(1);
    }
}

/**
 * Parses command line arguments
 * @returns {CLIArgs}
 */
function parseArgs()
{
    const noCopy = process.argv.map(v => v.toLowerCase()).includes("-nc");

    const amountInvalid = () => {
        return {
            noCopy,
            amount: 1
        };
    };

    try
    {
        const amount = parseInt(
            process.argv.find(arg => arg.match(/^-{0,2}\d+$/))
            .replace(/[-]/g, "")
        );

        if(isNaN(amount))
            return amountInvalid();

        return { noCopy, amount };
    }
    catch(err)
    {
        unused(err);

        return amountInvalid();
    }
}

/**
 * Generates a certain amount of tokens
 * @param {number} [amount] How many tokens to generate - min 1, max 10, default 1
 * @returns {TokenObj[]}
 */
function generateTokens(amount)
{
    const tokens = [];

    if(isNaN(amount) || amount < 1)
        amount = 1;
    
    amount = Math.min(amount, 10);

    console.log("\n");

    for(let i = 0; i < amount; i++)
        tokens.push(generateUUID.alphanumerical("xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy"));

    return tokens;
}

/**
 * Saves a token to the local registry file
 * @param {TokenObj[]} tokens The tokens to save to the tokens registry file
 * @param {number|null} maxReqs The request budget of the tokens
 * @returns {Promise<void>}
 */
function saveTokens(tokens, maxReqs)
{
    return new Promise(async res => {
        let oldFile = [];
        if(fs.existsSync(settings.auth.tokenListFile))
        {
            const fCont = (await fs.readFile(settings.auth.tokenListFile)).toString();
            if(!isEmpty(fCont))
                oldFile = JSON.parse(fCont);
            else
                oldFile = [];
        }

        tokens.forEach((token, i) => {
            const index = tokens.length > 1 ? `[${i + 1}] ` : "";

            console.log(`├─> ${index}${colors.fg.green}${token}${colors.rst}`);

            oldFile.push({
                token,
                maxReqs
            });
        });

        await fs.writeFile(settings.auth.tokenListFile, JSON.stringify(oldFile, null, 4));

        return res();
    });
}


addToken();
