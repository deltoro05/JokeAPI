const fs = require("fs");
const jsl = require("svjsl");

const settings = require("../settings");


var trFile = {};

/**
 * Initializes the translation module by caching the translations so they only need to be read from disk once
 * @returns {Promise}
 */
function init()
{
    return new Promise((resolve, reject) => {
        fs.readFile(settings.languages.translationsFile, (err, res) => {
            if(err)
                return reject(`Error while reading translations file: ${err}`);
            else
            {
                trFile = JSON.parse(res.toString());
                return resolve();
            }
        });
    });
}

/**
 * Returns the translation of a sentence of a specified language.
 * @param {String} lang Language code
 * @param {String} id The name of the translation node
 * @param {...any} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
 * @returns {String|null} Returns `null` if no translation is available. Else returns a string
 */
function translate(lang, id, ...args)
{
    let langTr = trFile.tr[lang.toString().toLowerCase()];
    if(!langTr)
        return null;

    let translation = langTr[id].toString();
    if(!translation)
        return null;

    if(Array.isArray(args) && translation.includes("%"))
    {
        args.forEach((arg, i) => {
            let rex = new RegExp(`%${i + 1}`);
            if(translation.match(rex))
            {
                try
                {
                    translation = translation.replace(rex, arg.toString());
                }
                catch(err)
                {
                    jsl.unused(err);
                }
            }
        });
    }

    return translation;
}

/**
 * Returns a list of system languages (2 char code)
 * @returns {Array<String>}
 */
function systemLangs()
{
    return trFile.languages;
}

module.exports = translate;
module.exports.init = init;
module.exports.systemLangs = systemLangs;
