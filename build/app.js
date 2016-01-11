
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
  var Promise, _, actions, capitano, errors, plugins, resin, update;

  _ = require('lodash');

  Promise = require('bluebird');

  capitano = Promise.promisifyAll(require('capitano'));

  resin = require('resin-sdk');

  actions = require('./actions');

  errors = require('./errors');

  plugins = require('./utils/plugins');

  update = require('./utils/update');

  capitano.permission('user', function(done) {
    return resin.auth.isLoggedIn().then(function(isLoggedIn) {
      if (!isLoggedIn) {
        throw new Error('You have to log in');
      }
    }).nodeify(done);
  });

  capitano.command({
    signature: '*',
    action: function() {
      return capitano.execute({
        command: 'help'
      });
    }
  });

  capitano.command(actions.info.version);

  capitano.command(actions.help.help);

  capitano.command(actions.wizard.wizard);

  capitano.command(actions.auth.login);

  capitano.command(actions.auth.logout);

  capitano.command(actions.auth.signup);

  capitano.command(actions.auth.whoami);

  capitano.command(actions.app.create);

  capitano.command(actions.app.list);

  capitano.command(actions.app.remove);

  capitano.command(actions.app.restart);

  capitano.command(actions.app.info);

  capitano.command(actions.device.list);

  capitano.command(actions.device.rename);

  capitano.command(actions.device.init);

  capitano.command(actions.device.remove);

  capitano.command(actions.device.identify);

  capitano.command(actions.device.register);

  capitano.command(actions.device.move);

  capitano.command(actions.device.info);

  capitano.command(actions.notes.set);

  capitano.command(actions.keys.list);

  capitano.command(actions.keys.add);

  capitano.command(actions.keys.info);

  capitano.command(actions.keys.remove);

  capitano.command(actions.env.list);

  capitano.command(actions.env.add);

  capitano.command(actions.env.rename);

  capitano.command(actions.env.remove);

  capitano.command(actions.os.download);

  capitano.command(actions.os.configure);

  capitano.command(actions.os.initialize);

  capitano.command(actions.config.read);

  capitano.command(actions.config.write);

  capitano.command(actions.config.reconfigure);

  capitano.command(actions.settings.list);

  capitano.command(actions.logs);

  update.notify();

  plugins.register(/^resin-plugin-(.+)$/).then(function() {
    var cli;
    cli = capitano.parse(process.argv);
    return capitano.executeAsync(cli);
  })["catch"](errors.handle);

}).call(this);
