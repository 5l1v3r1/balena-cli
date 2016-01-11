
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

(function() {
  var chalk, errors, patterns;

  chalk = require('chalk');

  errors = require('resin-cli-errors');

  patterns = require('./utils/patterns');

  exports.handle = function(error) {
    var message;
    message = errors.interpret(error);
    if (message == null) {
      return;
    }
    if (process.env.DEBUG) {
      message = error.stack;
    }
    patterns.printErrorMessage(message);
    return process.exit(error.exitCode || 1);
  };

}).call(this);
