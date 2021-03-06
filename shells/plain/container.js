/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

var installGlobalHook = require('../../backend/installGlobalHook');
var installRelayHook = require('../../plugins/Relay/installRelayHook');

window.React = React;

var Panel = require('../../frontend/Panel');

var target: Object = document.getElementById('target');

var appSrc = target.getAttribute('data-app-src') || '../../test/example/build/target.js';
var devtoolsSrc = target.getAttribute('data-devtools-src') || './build/backend.js';

var win = target.contentWindow;
installGlobalHook(win);
installRelayHook(win);

var iframeSrc = document.getElementById('iframe-src');
if (iframeSrc) {
  win.document.documentElement.innerHTML = iframeSrc.textContent.replace(/&gt;/g, '>');
}

window.addEventListener('keydown', function(e) {
  if (e.altKey && e.keyCode === 68) { // Alt + D
    if (document.body.className === 'devtools-bottom') {
      document.body.className = 'devtools-right';
    } else {
      document.body.className = 'devtools-bottom';
    }
  }
});

var config = {
  alreadyFoundReact: true,
  inject(done) {
    inject(devtoolsSrc, () => {
      var wall = {
        listen(fn) {
          win.parent.addEventListener('message', evt => {
            if (evt.source === win) {
              fn(evt.data);
            }
          });
        },
        send(data) {
          win.postMessage(data, '*');
        },
      };
      done(wall);
    });
  },
};

function inject(src, done) {
  if (!src || src === 'false') {
    done();
    return;
  }
  var script = target.contentDocument.createElement('script');
  script.src = src;
  script.onload = done;
  target.contentDocument.body.appendChild(script);
}

function injectMany(sources, done) {
  if (sources.length === 1) {
    inject(sources[0], done);
    return;
  }
  inject(sources[0], () => injectMany(sources.slice(1), done));
}

var sources = appSrc.split('|');

injectMany(sources, () => {
  var node = document.getElementById('container');
  ReactDOM.render(<Panel {...config} />, node);
});
