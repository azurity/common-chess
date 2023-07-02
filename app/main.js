function init() {
    let uuid = localStorage.getItem("user-uuid");
    if (uuid == undefined) {
        localStorage.setItem("user-uuid", UUIDv4());
    }
}
init();

import "/mods.js";

import * as monaco from 'https://esm.sh/monaco-editor@0.39.0';
import { Condition } from "./script/base/action.js";

function initCond() {
    monaco.languages.register({ id: 'chessCond' });
    monaco.languages.setLanguageConfiguration('chessCond', {
        brackets: [
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '"', close: '"' },
        ],
        surroundingPairs: [
            { open: '"', close: '"' },
        ]
    });
    monaco.languages.setMonarchTokensProvider('chessCond', {
        defaultToken: '',
        tokenPostfix: '.chessCond',

        brackets: [
            { open: '(', close: ')', token: 'delimiter.parenthesis' },
        ],

        keywords: [...Condition.implDict.keys()],

        constants: ['true', 'false'],

        tokenizer: {
            root: [
                [/-?(\d*\.)?\d+([eE][+\-]?\d+)?[jJ]?[lL]?/, 'number'],
                { include: '@whitespace' },
                { include: '@strings' },
                [
                    /[a-zA-Z_][a-zA-Z0-9_\-\.]*/,
                    {
                        cases: {
                            '@keywords': 'keyword',
                            '@constants': 'constant',
                            '@default': 'identifier',
                        },
                    },
                ],
            ],
            whitespace: [
                [/[ \t\r\n]+/, 'white'],
            ],

            strings: [
                [/"$/, 'string', '@popall'],
                [/"/, 'string.escape', '@stringBody'],
            ],
            stringBody: [
                [/[^\\"]+$/, 'string', '@popall'],
                [/[^\\"]+/, 'string'],
                [/\\./, 'string'],
                [/"/, 'string.escape', '@popall'],
                [/\\$/, 'string'],
            ],
        }
    });
}
initCond();

import "./script/main_app.js";
