const fs = require('fs');
const buffer = require('buffer');
const { clipboard, ipcRenderer } = require('electron');
const csv = require('csv/sync');

window.addEventListener('DOMContentLoaded', async () => {
  var converters = [];
  var mainHtml = '<p>converters</p><dl>';
  var element = document.getElementById('main');
  const home = await ipcRenderer.invoke('get-home');
  console.log('home: ' + home);
  fs.readFile(
    `${home}/.config/cmod/cmod.json`,
    { encoding: 'utf8' },
    (err, configJSON) => {
      if (err) {
        console.error('cant load config: ' + err);
        element.innerText = 'cant load config: ' + err;
        return;
      }
      const globalConfig = JSON.parse(configJSON);

      globalConfig.converters.forEach((config) => {
        mainHtml += `<dt>${config.name}</dt><dd>${config.description}</dd>`;
        var converterGenerator = function (
          config,
          input,
          output,
          filter,
          cleaners
        ) {
          return () => {
            var i = input(config);
            if (i) {
              console.log('triggered: ' + config.name);
              config.triggeredAt = new Date();
              i = filter(i);
              output(i);
              cleaners.forEach((cleaner) => cleaner(config));
            }
          };
        };

        var input = (config) => {};
        var filter = (txt) => txt;
        var output = function (txt) {};
        var cleaners = [];

        switch (config.input?.type) {
          case 'file':
            input = function (config) {
              try {
                var file = fs.readFileSync(config.input.path, {
                  encoding: 'utf8',
                });
                return file;
              } catch (err) {
                if (err.code === 'ENOENT') {
                  return;
                }
                throw err;
              }
            };
            if (config.input.unlink) {
              cleaners.push((config) => {
                fs.unlinkSync(config.input.path);
              });
            }
            break;
          case 'clipboard':
            input = function (config) {
              var txt = clipboard.readText();
              var regexp = new RegExp(config.input.regexp);
              if (!regexp.test(txt)) {
                return;
              }
              return txt;
            };
            break;
        }

        var filterScript = '';
        config.filters?.forEach((f, i) => {
          if (filterScript == '') {
            filterScript = f;
          } else {
            filterScript = `(tmp${i}) => { return (${f})((${filterScript})(tmp${i})); }`;
          }
        });
        if (filterScript != '') {
          try {
            eval('filter = ' + filterScript);
          } catch (e) {
            console.error("Can't eval filter: " + filterScript);
            throw e;
          }
        }

        if (config.output?.type == 'clipboard') {
          output = (txt) => {
            clipboard.writeBuffer(
              'text/plain;charset=utf-8',
              buffer.Buffer.from(txt, 'utf-8')
            );
          };
        }

        converters.push(
          converterGenerator(config, input, output, filter, cleaners)
        );
      });

      element.innerHTML = mainHtml + '</dt>';

      setInterval(function () {
        converters.forEach((converter) => {
          converter();
        });
      }, 2000);
    }
  );
});
