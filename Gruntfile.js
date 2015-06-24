module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      release: ["public/**"]
    },
    assemble: {
      release: {
        options: {
          layoutdir: 'www/templates/layouts',
          partials: ['www/templates/includes/**/*.hbs']
        },
        files: [{
          expand: true,
          flatten: true,
          cwd: './',
          src: ['www/templates/pages/**/*.hbs'],
          dest: 'public'
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
          'www/js/admin.js',
          'www/js/admin/*.js'
        ],
        dest: 'public/js/admin.js'
      },
      clientbase: {
        src: [
          'www/js/util.js',
          'www/js/honeybadger.js',
          'www/js/honeybadger/*.js'
        ],
        dest: 'public/js/honeybadger.js'
      },
      css: {
        src: [
          'bower_components/bloxui/dist/css/bloxui.css',
          'www/css/**.css',
        ],
        dest: 'public/css/admin.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        beautify: false
      },
      build: {
        files: {
          'public/js/honeybadger-min.js': ['public/js/honeybadger.js'],
          'public/js/admin-min.js': ['public/js/admin.js']
        }
      }
    },
    cssmin: {
      combine: {
        files: [{
          expand: true,
          cwd: './',
          src: ['www/css/evdp.css'],
          dest: 'public',
          ext: '-min.css'
        }]
      }
    },
    copy: {
      release: {
        files: [{
          expand: true,
          cwd: 'bower_components/bloxui/dist/css/fonts',
          src: ['./**'],
          dest: 'public/css/fonts'
        }]
      }
    },
    watch: {
      server: {
        files: ['./*.js', './*.json', 'lib/**/*.js'],
        tasks: ['newer:copy'],
        options: {
          livereload: false
        }
      },
      js: {
        files: ['www/js/**/*.js'],
        tasks: ['newer:concat', 'newer:uglify'],
        options: {
          livereload: true
        }
      },
      css: {
        files: ['www/css/**/*.css'],
        tasks: ['newer:concat:css', 'newer:cssmin'],
        options: {
          livereload: true
        }
      },
      html: {
        files: ['www/**/*.hbs'],
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
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('assemble');

  // Default task(s).
  grunt.registerTask('default', ['copy', 'concat', 'newer:uglify', 'newer:cssmin', 'newer:assemble']);
  grunt.registerTask('release', ['clean', 'copy', 'concat', 'uglify', 'cssmin', 'assemble']);

};
