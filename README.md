Require-inline
===

Used for synchronous inline requires in RequireJS while the document is being written only. Useful for enhancing widget HTML instantly without as a domready alternative while maintaining RequireJS compatibility.

### Example use:

For example, if I have a jQuery slideshow, which itself is dependent on jQuery.

If the slideshow HTML is already in the page, rather than waiting for DOM ready event, we can
enhance the slideshow instantly when it displays to the user:

```html
  <!-- slideshow html: -->
  <div class="slideshow">
    <img src="slideshow-img1.jpg" />
    <img src="slideshow-img2.jpg" />
  </div>
  
  <!-- require-inline: specifies that the moduleId, 'jquery.slideshow' should be loaded synchronously at this point in the page -->
  <script src="require-inline.js" type="text/javascript" data-require="jquery.slideshow"></script>
  
  <!-- slideshow attachment code -->
  <script type="text/javascript">
    //callback fires instantly (after 3ms to be exact), creating optimal user-experience.
    require(['jquery.slideshow'], function($) {
      $('.slideshow').slideshow();
    });
  </script>
  
  <!-- html after the slideshow... -->
  <h2>This only displays in the browser once jQuery, jQuery.slideshow and the slideshow have all loaded (or at least only 3ms before)</h2>
```

This allows progressive enhancement of the page to be instant when necessary, before displaying the page any further.

No longer do 'dead plugins' have to display to the user while they load. If a button says it can be clicked, the user can most likely click it.

##### Caveats:

Some thought does need to be made as to what dependencies load when.

For example:

* If jQuery maps to a build layer, that layer will be downloaded synchronously, blocking the page for an unnecessary length of time.
  So layers need to be carefully built with this in mind.
* If that same build layer had already been requested asynchronously, only the dependencies not in the build layer or already requested
  would be loaded synchronously. Thus there can still be a significant delay for enhancement, but nothing is lost.
* Any loader plugins that only fire callbacks on the next event loop will also stop the synchronous require from completing synchronously,
  again, this isn't critical as other dependencies will still be loaded synchronously, but the timing can't be guaranteed.

### Mechanism

The loading mechanism hitches on RequireJS's load hook making it fully compatible with RequireJS.

It respects configuration, dependencies and plugins.

`document.write` is used to insert the `<script>` tags so no `eval` is necessary.

### General Use

```html
  <script src="require-inline.js" data-context="contextName" data-require="depId"></script>
```

* **contextName** (optional): The context name to load the module in. Defaults to '_'.
* **depId**: The RequireJS moduleId to be loaded synchronously.

**The script can be embedded in the page as many times as necessary to load any synchronous dependencies.**

#### Note:
* Any loader plugins or dependencies using a local require, will be passed a `require` method that is also synchronous,
  which means there is a good chance loader plugins can remain synchronous themselves. Loader plugins can also check if it
  is a synchronous require by evaluating `requirejs.inlineRequire`, allowing them to use to synchronous AJAX where suitable.
* If a dependency has already been requested using an asynchronous require call, it won't be re-requested synchronously.

#### Completely synchronous require - Defined require calls (not recommended)

A 'defined require' that is completely synchronous can also be made after this script, using the natural RequireJS syntax:

```javascript
  var definition = require('defId');
```

This works only if the inline require call successfully defined the module and all its dependencies, and will throw an error otherwise.
Thus it is advised not to use this form.
  
