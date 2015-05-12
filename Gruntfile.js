module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      release: [
        "release/**"
      ],
      admin: ["release/admin/**"]
    },
    assemble: {
      release: {
        options: {
          layoutdir: 'src/www/templates/layouts',
          partials: ['src/www/templates/includes/**/*.hbs']
        },
        files: [{
          expand: true,
          flatten: true,
          cwd: 'src',
          src: ['www/templates/pages/**/*.hbs'],
          dest: 'release/admin/www'
        }]
      }
    },
    concat: {
      options: {
        separator: "\n"
      },
      admin: {
        src: [
          'bower_components/bloxui/dist/js/bloxui.js',
          'src/www/js/admin.js',
          'src/www/js/admin/*.js'
        ],
        dest: 'release/admin/www/js/admin.js'
      },
      clientbase: {
        src: [
          'src/www/js/util.js',
          'src/www/js/honeybadger.js',
          'src/www/js/honeybadger/*.js'
        ],
        dest: 'release/admin/www/js/honeybadger.js'
      },
      css: {
        src: [
          'bower_components/bloxui/dist/css/bloxui.css',
          'src/www/css/**.css',
        ],
        dest: 'release/admin/www/css/admin.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        beautify: false
      },
      build: {
        files: {
          'release/admin/www/js/honeybadger-min.js': ['release/admin/www/js/honeybadger.js'],
          'release/admin/www/js/admin-min.js': ['release/admin/www/js/admin.js']
        }
      }
    },
    cssmin: {
      combine: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['www/css/evdp.css'],
          dest: 'release/admin',
          ext: '-min.css'
        }]
      }
    },
    copy: {
      release: {
        files: [{
          expand: true,
          dot: true,
          cwd: './',
          src: ['**foreverignore'],
          dest: 'release/'
        },
        {
          expand: true,
          cwd: 'src',
          src: ['admin.js'],
          dest: 'release/admin'
        },
        {
          expand: true,
          cwd: 'bower_components/bloxui/dist/css/fonts',
          src: ['./**'],
          dest: 'release/admin/www/css/fonts'
        },
        {
          expand: true,
          cwd: 'src',
          src: ['index.js','honeybadger.js','data-select.js','config.json','selectors.json','lib/**'],
          dest: 'release'
        }]
      }
    },
    watch: {
      server: {
        files: ['src/*.js','src/*.json','src/lib/**/*.js'],
        tasks: ['newer:copy'],
        options:{
          livereload: false
        }
      }, 
      js: {
         files: ['src/www/js/**/*.js'],
         tasks: ['newer:concat','newer:uglify'],
         options: {
          livereload: true
         }
      },
      css: {
         files: ['src/www/css/**/*.css'],
         tasks: ['newer:concat:css','newer:cssmin'],
         options: {
          livereload: true
         }
      },
      html: {
         files: ['src/www/**/*.hbs'],
         tasks: ['newer:assemble'],
         options: {
          livereload: true
         }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-newer' );
  grunt.loadNpmTasks('assemble');

  // Default task(s).
  grunt.registerTask('default', ['copy','concat', 'newer:uglify', 'newer:cssmin','newer:assemble']);
  grunt.registerTask('release', ['clean','copy','concat', 'uglify', 'cssmin','assemble']);
  
};