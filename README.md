# boh
boh is an extremely simplistic build tool that puts the power of building your files back into your hands. Even calling it a build tool is a bit generous. Essentially, boh checks the top of a file for a comment on how to build it and runs it.

## Usage
To make `boh` build a file, you simply add a comment at the top of your file with build instructions. For example, on your main entry file `index.js` in a Browserify project:

```js
// build: browserify --input $this --output ../assets/build/bundle.js -t coffeeify
var User = require("./User");

...
```

Then you run `boh`:

	$ boh
	[boh] Found rule in index.js.
	[boh:index.js] $ browserify --input $this --output ../assets/build/bundle.js -t coffeeify
	[boh:index.js] buildd successfully.
	[boh] No more rules found. Compilation complete.

Done! `boh` aims to be as painless as possible. It recursively searches files in your project (sensibly) checking for rules and does it's job. `boh` also has a `watch` command which will automatically build changes.

	$ boh watch
	[boh] Waiting for changes..
	[boh] index.js changed, compiling..
	[boh:index.js] $ browserify --input $this --output ../assets/build/bundle.js -t coffeeify
	[boh:index.js] buildd successfully.

## Slightly more advanced usage
`boh` is only mean't for prototying and quickly spinning up some sweet apps. For more advanced build sites, you should really invest time into tools like [gulp]() or [grunt](). However, `boh` does have *some* options to allow for some slightly more advanced building.

### Inherit
The `inherit` rule allows you to specify what `boh` should run when it encounters the current file. It's mostly used for `watch` so it knows what to do when the file changes.

##### index.js
```js
// build: browserify --input $this --output ../assets/build/bundle.js -t coffeeify

var User = require("./User.js");

...
```

##### User.js
```js
// inherit: index.js

var User = function() {
	this.name = "Patrick";

	...
```

### Includes
The `includes` rule tells `boh` that files are related and that one files build steps includes another file. Again, mostly used when `watch`ing so that `boh` knows what to run. In the following example from `index.js`, when `User.js` changes, it uses the rule from `index.js` to build it.

```js
// build: browserify --input $this --output ../assets/build/bundle.js -t coffeeify
// includes: User.js

var User = require("./User.js");

...
```

### Plugins
You can develop your own plugins for `boh`. To use them, you simply publish it to `npm` with the prefix `boh-`, install it and `boh` will do the rest from there. It will automatically require any plugins installed and execute them accordingly.

#### Plugin API
The following functions make up the simple `boh` plugin API. [`colors`](https://www.npmjs.com/package/colors) work too.
##### `<plugin>.emit( event, [data...])`
Emit a plugin event.

##### `<plugin>.debug( ... )`
Write a message to the debug log via [`debug`](https://github.com/visionmedia/debug) ("boh:plugin:<plugin name>").

##### `<plugin>.log( ... )`
Write a message to the stdout.

##### `boh.execute( cwd, script, callback )`
Execute a script the boh way.