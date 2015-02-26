/*
 * grunt-if
 * https://github.com/tylerbeck/grunt-if
 *
 * Copyright (c) 2014 Tyler Beck
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function( grunt ) {

    var q = require('q');

    // Project configuration.
    grunt.initConfig( {

        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        },

        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                regExp: false
            }
        },

        'sketch-styles': {
            single: {
                files: {
                    "tmp/file-one.less": "test/fixtures/design.sketch"
                }

            }
        }


    } );

    // load this plugin's task(s).
    grunt.loadTasks( 'tasks' );

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks( 'grunt-bump' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-nodeunit' );

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask( 'test', ['clean', 'sketch-styles', 'nodeunit'] );

    // By default, lint and run all tests.
    grunt.registerTask( 'default', ['jshint', 'test'] );


};