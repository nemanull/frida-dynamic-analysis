Java.perform(function() {

    setTimeout(function() {
        Java.perform(function() {
            console.log("");
            console.log("[.] Debug check bypass");
    
            var Debug = Java.use('android.os.Debug');
            Debug.isDebuggerConnected.implementation = function() {
                console.log('isDebuggerConnected Bypassed !');
                return false;
            }
    
    
        });
    }, 0);

});
