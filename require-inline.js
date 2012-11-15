/*
 * Require-inline
 *
 * Used for sync inline requires while the document is being written only.
 *
 * For example, useful for loading jquery inline.
 *
 * There is no good use case to use a sync require after the document is closed,
 * and if this was implemented it would have to use eval, which is not worthwhile.
 *
 * Usage:
 * 
 *   <script src="require-inline.js" data-context="_" data-require="depId"></script>
 *   <script>
 *     //dep is now defined along with all subdependencies
 *     var dep = require('depId');
 *   </script>
 *
 *   - Loads the dep synchronously at that point in the document.
 *   - A subsequent inline script can rely on the fact that dep and all its
 *     sub-dependencies will have been loaded already
 *   - If the dependency maps to a layer, the entire layer will be downloaded and defined synchronously.
 *   - If the dependency or a subdependency uses a loader plugin, it can check require.inlineRequire
 *     to tell if it should be sync.
 *     If a loader plugin doesn't run the callback synchronously the dependency won't be defined
 *   - By default, the context is '_'
 *
 * To load multiple dependencies, use:
 *
 * <script src="require-inline.js" data-require="depId,depId2"></script>
 *
 * If you have any dependencies that actually need commas, simply escape the comma with a '\,'.
 * 
 */

//make volo think this is an amd module
if (false) define(null);

(function() {

  //get the script tag for this script
  var scriptTag = Array.prototype.pop.call(document.getElementsByTagName('script'));
  
  // override the load and nextTick methods for the context
  // we temporarily change to a sync load putting it back after
  // - the beauty of sync is that we can do things like this without conflict
  // (as long as we put them back in the same process)
  var enableSyncLoad = function(contextName) {
    var context = requirejs.s.contexts[contextName]
    // marker to check if this is an inline require
    requirejs.inlineRequire = contextName;
    
    var _contextLoad = context.load;
    var _contextTick = context.nextTick;
    
    context.nextTick = function(callback) { callback(); }
    
    var lt = '<';
    
    context.load = function(id, url) {
      //two scripts - first is loading script, second is this script again, but with data attributes for callback triggering
      document.write(lt + 'script type="text/javascript" src="' + url + '">' + lt + '/script>');
      document.write(lt + 'script type="text/javascript" src="' + scriptTag.src + '" ' +
        'data-requiremodule="' + id + '" data-requirecontext="' + contextName + '">' + lt + '/script>');
    }
    
    // immediately return the disable function
    // must be run in the same cycle to revert the load and tick apis
    return function() {
      delete requirejs.inlineRequire;
      context.nextTick = _contextTick;
      context.load = _contextLoad;
    }
  }  
  
  // check for data-attribute indicating to do a load
  var requireDep = scriptTag.getAttribute('data-require');
  
  // do a load
  if (requireDep) {
    // split with a comma for multiple dependencies
    var deps = requireDep.split(',');
    // join back any items that were actually escaped (\,)
    for (var i = 0; i < deps.length; i++)
      if (deps[i].substr(deps[i].length - 1) == '\\') {
        deps[i] = deps[i] + ',' + deps[i + 1];
        deps.splice(i + 1, 1);
      }
    
    var requireContext = scriptTag.getAttribute('data-context') || '_';
    var disableSyncLoad = enableSyncLoad(requireContext);
    // do the require, if it hasn't fully required, so be it
    requirejs.s.contexts[requireContext].require(deps);
    disableSyncLoad();
    //remove this script tag
    scriptTag.parentNode.removeChild(scriptTag);
  }
  else {
    // check for data-attributes indicating a load callback
    var requireModule = scriptTag.getAttribute('data-requiremodule');
    var requireContext = scriptTag.getAttribute('data-requirecontext');
    
    //if so - this load is a loaded callback -> trigger
    if (requireModule && requireContext) {
      
      var disableSyncLoad = enableSyncLoad(requireContext);
      
      requirejs.s.contexts[requireContext].completeLoad(requireModule);
      
      disableSyncLoad();
      
      //remove this script tag and the one before it used for the load
      var prevScript = scriptTag.previousSibling;
      prevScript.parentNode.removeChild(prevScript);
      scriptTag.parentNode.removeChild(scriptTag);
    }
  }
})();