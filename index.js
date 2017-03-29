#!/usr/bin/env node

/**
 * Created by tanjiasheng on 2017/2/8.
 */
'use strict';
const fs = require('fs');
const cheerio = require('cheerio');
const cleanCSS  = require('clean-css');
const uglifyJS = require('uglify-js2');
const ncp = require('ncp').ncp;

//command line arguments
const argv = process.argv;

//compress js code
const handleUglify = (code) => {
    if (argv.indexOf('-source') < 0) {
        let result = uglifyJS.minify(code, {fromString: true});
        return result.code;
    } else {
        return code;
    }
};

//compress css code
const handleCssmin = (code) => {
    if (argv.indexOf('-source') < 0) {
        let output = new cleanCSS().minify(code);
        return output.styles;
    } else {
        return code;
    }

};

const rs = fs.readFile('./localFiles.json', 'binary', (err, data) => {
    if (err) {
        throw new Error(err);
    }
    //parse config file
    console.log('loading config...');
    try {
        const cfg = JSON.parse(data);
        var HTMLTemplate = cfg.template || './index.html';
        var jsLib = cfg.jslib || [];
        var jsBus = cfg.jsbus || [];
        var cssLib = cfg.csslib || [];
        var cssBus = cfg.cssbus || [];
        var assets = cfg.assets || [];
    } catch (e) {
        throw e;
    }
    console.log('load config success.');

    //load HTML template
    console.log('reading HTML template...');
    try {
        var tmpHTML = fs.readFileSync(HTMLTemplate, 'binary');
        var $ = cheerio.load(tmpHTML, {decodeEntities: false});
        var tmplHead = $('head');
        var tmplBody = $('body');
    } catch (e) {
        throw e;
    }
    console.log('read HTML template success.');

    //inject js dependency
    console.log('injecting js dependencies...');
    jsLib.forEach((u) => {
        tmplBody.append(`<script type="text/javascript" src="${u}"></script>\n`);
    });
    console.log('inject js dependencies success.');

    //inject js business modules
    console.log('injecting js business modules...');
    jsBus.forEach((u) => {
        try {
            const jsMod = fs.readFileSync(u, 'binary');
            tmplBody.append(`<script type="text/javascript">\n${handleUglify(jsMod)}\n</script>\n`);
        } catch (e) {
            throw e;
        }
    });
    console.log('inject js business modules success.');

    //inject css dependencies
    console.log('injecting css dependencies...');
    cssLib.forEach((u) => {
        tmplHead.append(`<link rel="stylesheet" href="${u}">\n`)
    });
    console.log('inject css dependencies success');

    //inject css business modules
    console.log('injecting css business modules...');
    cssBus.forEach((u) => {
        const cssMod = fs.readFileSync(u, 'binary');
        tmplHead.append(`<style type="text/css">\n${handleCssmin(cssMod)}\n</style>\n`);
    });
    console.log('inject css business modules success.');

    //write file
    console.log('writing files...');
    if (!fs.existsSync('./localFiles')) {
        fs.mkdirSync('./localFiles');
    }
    try {
        fs.writeFile('./localFiles/index.html', $.html(), 'binary', (err) => {
            if (err) throw err;
        })
    } catch (e) {
        throw e;
    }
    console.log('write file success');

    console.log('copying assets...');
    assets.forEach((v) => {
        let destDir = './localFiles/' + v.split('/').pop();
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        ncp(v, destDir, function (err) {
            if (err) {
                throw new Error(err);
            }
            console.log('copy assets success');
            console.log('build success');
        });
    });

});



