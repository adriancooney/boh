# boh
### [http://adriancooney.github.io/boh](http://adriancooney.github.io/boh)
boh is a simple, smart build tool. As oxymoronic as that sounds, it works exactly the way you expect. Boh has one command and very few options to do one thing, build your projects. You define your build rules at the top of your files and boh will automatically find them and execute them. For example, let's say you want to [browserify](http://browserify.org) your Javacript files in your project:

Install boh:

	$ npm install -g boh


Define your build rules:

```js
// boh build: browserify -e $this -o build/bundle.js

var react = require("react"),
	...
```

Now, run boh in your project root or wherever the file is contained:

	$ boh
	Running boh in the current directory.

    	src/index.js:build ✓ (494ms)

	Build complete successfully.

Congratulations, your files are built! If you want to automatically rebuild on the fly, run it with the `--watch` flag:

	$ boh --watch
	Running boh in the current directory.

    	src/index.js:build ✓ (494ms)

	Build complete successfully.

	boh is watching for changes..

boh is intended to be used for fast prototyping so you don't have to spend hours tweaking your build tool to get it up and running. It's intended to be a quick, simple but smart solution until your project matures and requires a more advanced build tool. See [http://adriancooney.github.io/boh](http://adriancooney.github.io/boh) for more information.

### Plugins
You can develop your own plugins for `boh`. To use them, you simply publish it to `npm` with the prefix `boh-`, install it and `boh` will do the rest from there. It will automatically require any plugins installed and execute them accordingly.

#### Plugin API
The following functions make up the simple `boh` plugin API. [`colors`](https://www.npmjs.com/package/colors) work too. See [here for a more in depth explanation of plugin development](http://adriancooney.github.io/boh#plugins).

##### `plugin#emit( event, [data...])`
Emit a plugin event that is handled via the reporter.

##### `plugin#debug( ... )`
Write a [`debug`](https://github.com/visionmedia/debug) log. The messages can be seen by running boh with the enviornment variable `DEBUG` set to `boh:plugin:<plugin name>`. e.g. `DEBUG=boh:plugin:<plugin name> boh`.

##### `plugin#log( ... )`
Write a message to the stdout. These are only shown if the user specifies the verbose options (`-v`).

##### `plugin#execute( cwd, script, callback )`
Execute a shell script. `cwd` (string) is the current working directory of the script. `script` (string) is the script to be executed. `callback( err, output )` (function) the callback to be executed on complete.