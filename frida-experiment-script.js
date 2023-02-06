/*
Original author: Daniele Linguaglossa
28/07/2021 -    Edited by Simone Quatrini
                Code amended to correctly run on the latest frida version
        		Added controls to exclude Magisk Manager
*/

Java.perform(function() {
    antiroot1();
    antiADB();
    universalSSLpinning();  
    emulatur_anti_detect();    //only on emulator 
    androidpinningwithoutca1();
    auxiliary_android_pinning_hooks();
    webvieu();


    function emulatur_anti_detect(){
        if (Java.available) {
            Java.perform(function() {
                try {
                    var Activity = Java.use("com.learnium.RNDeviceInfo.RNDeviceModule");
                    Activity.isEmulator.implementation = function() {
                        Promise.resolve(false)
                    }
                } catch (error) {
                    console.log("[-] Error Detected");
                    console.log((error.stack));
                }
            });
        } else {
            console.log("")
            console.log("[-] Java is Not available");
        }
    }


    function universalSSLpinning(){
      /* 
   Android SSL Re-pinning frida script v0.2 030417-pier 

   $ adb push burpca-cert-der.crt /data/local/tmp/cert-der.crt
   $ frida -U -f it.app.mobile -l frida-android-repinning.js --no-pause

   https://techblog.mediaservice.net/2017/07/universal-android-ssl-pinning-bypass-with-frida/
   
   UPDATE 20191605: Fixed undeclared var. Thanks to @oleavr and @ehsanpc9999 !
*/

setTimeout(function(){
    Java.perform(function (){
    	console.log("");
	    console.log("[.] Cert Pinning Bypass/Re-Pinning");

	    var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
	    var FileInputStream = Java.use("java.io.FileInputStream");
	    var BufferedInputStream = Java.use("java.io.BufferedInputStream");
	    var X509Certificate = Java.use("java.security.cert.X509Certificate");
	    var KeyStore = Java.use("java.security.KeyStore");
	    var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
	    var SSLContext = Java.use("javax.net.ssl.SSLContext");

	    // Load CAs from an InputStream
	    console.log("[+] Loading our CA...")
	    var cf = CertificateFactory.getInstance("X.509");
	    
	    try {
	    	var fileInputStream = FileInputStream.$new("/data/local/tmp/cert-der.crt");
	    }
	    catch(err) {
	    	console.log("[o] " + err);
	    }
	    
	    var bufferedInputStream = BufferedInputStream.$new(fileInputStream);
	  	var ca = cf.generateCertificate(bufferedInputStream);
	    bufferedInputStream.close();

		var certInfo = Java.cast(ca, X509Certificate);
	    console.log("[o] Our CA Info: " + certInfo.getSubjectDN());

	    // Create a KeyStore containing our trusted CAs
	    console.log("[+] Creating a KeyStore for our CA...");
	    var keyStoreType = KeyStore.getDefaultType();
	    var keyStore = KeyStore.getInstance(keyStoreType);
	    keyStore.load(null, null);
	    keyStore.setCertificateEntry("ca", ca);
	    
	    // Create a TrustManager that trusts the CAs in our KeyStore
	    console.log("[+] Creating a TrustManager that trusts the CA in our KeyStore...");
	    var tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
	    var tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
	    tmf.init(keyStore);
	    console.log("[+] Our TrustManager is ready...");

	    console.log("[+] Hijacking SSLContext methods now...")
	    console.log("[-] Waiting for the app to invoke SSLContext.init()...")

	   	SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function(a,b,c) {
	   		console.log("[o] App invoked javax.net.ssl.SSLContext.init...");
	   		SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").call(this, a, tmf.getTrustManagers(), c);
	   		console.log("[+] SSLContext initialized with our custom TrustManager!");
	   	}
    });
},0);
    }

    function antiADB(){
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
    }


    function webvieu(){
        var Webview = Java.use("android.webkit.WebView")
        Webview.loadUrl.overload("java.lang.String").implementation = function(url) {
            console.log("\n[+]Loading URL from", url);
            console.log("[+]Setting the value of setWebContentsDebuggingEnabled() to TRUE");
            this.setWebContentsDebuggingEnabled(true);
            this.loadUrl.overload("java.lang.String").call(this, url);
            console.log("Its work");
        }
    }


    function auxiliary_android_pinning_hooks() {

        var okhttp3_CertificatePinner_class = null;
        try {
            okhttp3_CertificatePinner_class = Java.use('okhttp3.CertificatePinner');
        } catch (err) {
            console.log('[-] OkHTTPv3 CertificatePinner class not found. Skipping.');
            okhttp3_CertificatePinner_class = null;
        }

        if(okhttp3_CertificatePinner_class != null) {

            try{
                okhttp3_CertificatePinner_class.check.overload('java.lang.String', 'java.util.List').implementation = function (str,list) {
                    console.log('[+] Bypassing OkHTTPv3 1: ' + str);
                    return true;
                };
                console.log('[+] Loaded OkHTTPv3 hook 1');
            } catch(err) {
                console.log('[-] Skipping OkHTTPv3 hook 1');
            }

            try{
                okhttp3_CertificatePinner_class.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (str,cert) {
                    console.log('[+] Bypassing OkHTTPv3 2: ' + str);
                    return true;
                };
                console.log('[+] Loaded OkHTTPv3 hook 2');
            } catch(err) {
                console.log('[-] Skipping OkHTTPv3 hook 2');
            }

            try {
                okhttp3_CertificatePinner_class.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (str,cert_array) {
                    console.log('[+] Bypassing OkHTTPv3 3: ' + str);
                    return true;
                };
                console.log('[+] Loaded OkHTTPv3 hook 3');
            } catch(err) {
                console.log('[-] Skipping OkHTTPv3 hook 3');
            }

            try {
                okhttp3_CertificatePinner_class['check$okhttp'].implementation = function (str,obj) {
                    console.log('[+] Bypassing OkHTTPv3 4 (4.2+): ' + str);
                };
                console.log('[+] Loaded OkHTTPv3 hook 4 (4.2+)');
            } catch(err) {
                console.log('[-] Skipping OkHTTPv3 hook 4 (4.2+)');
            }

        }

        // Trustkit (triple bypass)
        var trustkit_Activity = null;
        try {
            trustkit_Activity = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
            console.log('[+] Setup Trustkit pinning (first class)')
        } catch (err) {
            console.log('[-] Trustkit first class not found. Skipping.');
            trustkit_Activity = null;
        }

        if(trustkit_Activity != null) {

            try {
                trustkit_Activity.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (str,b) {
                    console.log('[+] Intercepted Trustkit {1}: ' + str);
                    return true;
                };
            } catch(err) {
                console.log('[-] Skipping Trustkit {1}');
            }

            try {
                trustkit_Activity.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (str,b) {
                    console.log('[+] Intercepted Trustkit {2}: ' + str);
                    return true;
                };
            } catch(err) {
                console.log('[-] Skipping Trustkit {2}');
            }

        }

        try {
            var trustkit_PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
            trustkit_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('[+] Intercepted Trustkit {3}');
            }
            console.log('[+] Setup Trustkit pinning (second class)')
        } catch (err) {
            console.log('[-] Trustkit second class not found. Skipping.');
        }

        // TrustManagerImpl (Android > 7)
        try {
            var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log('[+] Intercepted TrustManagerImpl (Android > 7): ' + host);
                return untrustedChain;
            }

            console.log('[+] Setup TrustManagerImpl (Android > 7) pinning')
        } catch (err) {
            console.log('[-] TrustManagerImpl (Android > 7) pinner not found')
        }

        // Appcelerator Titanium
        try {
            var appcelerator_PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
            appcelerator_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('[+] Intercepted Appcelerator');
            }

            console.log('[+] Setup Appcelerator pinning')
        } catch (err) {
            console.log('[-] Appcelerator pinner not found')
        }

        // OpenSSLSocketImpl
        try {
            var OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
            OpenSSLSocketImpl.verifyCertificateChain.implementation = function (certRefs, authMethod) {
                console.log('[+] Intercepted OpenSSLSocketImpl');
            }

            console.log('[+] Setup OpenSSLSocketImpl pinning')
        } catch (err) {
            console.log('[-] OpenSSLSocketImpl pinner not found');

        }

        // PhoneGap sslCertificateChecker (https://github.com/EddyVerbruggen/)
        try {
            var phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
            phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (str) {
                console.log('[+] Intercepted PhoneGap sslCertificateChecker: ' + str);
                return true;
            };

            console.log('[+] Setup PhoneGap sslCertificateChecker pinning')
        } catch (err) {
            console.log('[-] PhoneGap sslCertificateChecker pinner not found')
        }

        // IBM MobileFirst pinTrustedCertificatePublicKey
        try {
            var WLClient = Java.use('com.worklight.wlclient.api.WLClient');
            // if above does not works try with this
            //var WLClient = Java.use('com.worklight.wlclient.api.WLClient.getInstance()');
            WLClient.pinTrustedCertificatePublicKey.implementation = function (cert) {
                console.log('[+] Intercepted IBM MobileFirst pinTrustedCertificatePublicKey');
                return;
            }

            console.log('[+] Setup IBM MobileFirst pinTrustedCertificatePublicKey pinning')
        } catch (err) {
            console.log('[-] IBM MobileFirst pinTrustedCertificatePublicKey pinner not found')
        }

        // IBM WorkLight (ancestor of MobileFirst) HostNameVerifierWithCertificatePinning (quadruple bypass)
        var worklight_Activity = null;
        try {
            worklight_Activity = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
        } catch (err) {
            console.log('[-] IBM WorkLight HostNameVerifierWithCertificatePinning class not found. Skipping.');
            worklight_Activity = null;
        }

        if(worklight_Activity != null) {

            try {
                worklight_Activity.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function (str,b) {
                    console.log('[+] Intercepted IBM WorkLight HostNameVerifierWithCertificatePinning {1}: ' + str);
                    return;
                };
            } catch(err) {
                console.log('[-] Skipping IBM WorkLight hook 1');
            }

            try {
                worklight_Activity.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (str,b) {
                    console.log('[+] Intercepted IBM WorkLight HostNameVerifierWithCertificatePinning {2}: ' + str);
                    return;
                };
            } catch(err) {
                console.log('[-] Skipping IBM WorkLight hook 2');
            }

            try {
                worklight_Activity.verify.overload('java.lang.String', 'java.util.List', 'java.util.List').implementation = function (str,b,c) {
                    console.log('[+] Intercepted IBM WorkLight HostNameVerifierWithCertificatePinning {3}: ' + str);
                    return;
                };
            } catch(err) {
                console.log('[-] Skipping IBM WorkLight hook 3');
            }

            try {
                worklight_Activity.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (str,b) {
                    console.log('[+] Intercepted IBM WorkLight HostNameVerifierWithCertificatePinning {4}: ' + str);
                    return true;
                };
            } catch(err) {
                console.log('[-] Skipping IBM WorkLight hook 4');
            }

            console.log('[+] Setup IBM WorkLight HostNameVerifierWithCertificatePinning pinning')

        }

    }

    function androidpinningwithoutca1() {

        Java.perform(function () {

            var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
            var SSLContext = Java.use('javax.net.ssl.SSLContext');

            // TrustManager (Android < 7)
            var TrustManager = Java.registerClass({
                // Implement a custom TrustManager
                name: 'com.sensepost.test.TrustManager',
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function (chain, authType) {},
                    checkServerTrusted: function (chain, authType) {},
                    getAcceptedIssuers: function () {return []; }
                }
            });

            // Prepare the TrustManager array to pass to SSLContext.init()
            var TrustManagers = [TrustManager.$new()];
            // Get a handle on the init() on the SSLContext class
            var SSLContext_init = SSLContext.init.overload(
                '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');
            try {
                // Override the init method, specifying the custom TrustManager
                SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
                    console.log('[+] Intercepted Trustmanager (Android < 7) request');
                    SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
                };

                console.log('[+] Setup custom TrustManager (Android < 7)');
            } catch (err) {
                console.log('[-] TrustManager (Android < 7) pinner not found');
            }

            auxiliary_android_pinning_hooks();

        });
    }
 

   function antiroot1(){

    var RootPackages = ["com.noshufou.android.su", "com.noshufou.android.su.elite", "eu.chainfire.supersu",
        "com.koushikdutta.superuser", "com.thirdparty.superuser", "com.yellowes.su", "com.koushikdutta.rommanager",
        "com.koushikdutta.rommanager.license", "com.dimonvideo.luckypatcher", "com.chelpus.lackypatch",
        "com.ramdroid.appquarantine", "com.ramdroid.appquarantinepro", "com.devadvance.rootcloak", "com.devadvance.rootcloakplus",
        "de.robv.android.xposed.installer", "com.saurik.substrate", "com.zachspong.temprootremovejb", "com.amphoras.hidemyroot",
        "com.amphoras.hidemyrootadfree", "com.formyhm.hiderootPremium", "com.formyhm.hideroot", "me.phh.superuser",
        "eu.chainfire.supersu.pro", "com.kingouser.com", "com.topjohnwu.magisk"
    ];

    var RootBinaries = ["su", "busybox", "supersu", "Superuser.apk", "KingoUser.apk", "SuperSu.apk", "magisk"];

    var RootProperties = {
        "ro.build.selinux": "1",
        "ro.debuggable": "0",
        "service.adb.root": "0",
        "ro.secure": "1"
    };

    var RootPropertiesKeys = [];

    for (var k in RootProperties) RootPropertiesKeys.push(k);

    var PackageManager = Java.use("android.app.ApplicationPackageManager");

    var Runtime = Java.use('java.lang.Runtime');

    var NativeFile = Java.use('java.io.File');

    var String = Java.use('java.lang.String');

    var SystemProperties = Java.use('android.os.SystemProperties');

    var BufferedReader = Java.use('java.io.BufferedReader');

    var ProcessBuilder = Java.use('java.lang.ProcessBuilder');

    var StringBuffer = Java.use('java.lang.StringBuffer');

    var loaded_classes = Java.enumerateLoadedClassesSync();

    send("Loaded " + loaded_classes.length + " classes!");

    var useKeyInfo = false;

    var useProcessManager = false;

    send("loaded: " + loaded_classes.indexOf('java.lang.ProcessManager'));

    if (loaded_classes.indexOf('java.lang.ProcessManager') != -1) {
        try {
            //useProcessManager = true;
            //var ProcessManager = Java.use('java.lang.ProcessManager');
        } catch (err) {
            send("ProcessManager Hook failed: " + err);
        }
    } else {
        send("ProcessManager hook not loaded");
    }

    var KeyInfo = null;

    if (loaded_classes.indexOf('android.security.keystore.KeyInfo') != -1) {
        try {
            //useKeyInfo = true;
            //var KeyInfo = Java.use('android.security.keystore.KeyInfo');
        } catch (err) {
            send("KeyInfo Hook failed: " + err);
        }
    } else {
        send("KeyInfo hook not loaded");
    }

    PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function(pname, flags) {
        var shouldFakePackage = (RootPackages.indexOf(pname) > -1);
        if (shouldFakePackage) {
            send("Bypass root check for package: " + pname);
            pname = "set.package.name.to.a.fake.one.so.we.can.bypass.it";
        }
        return this.getPackageInfo.overload('java.lang.String', 'int').call(this, pname, flags);
    };

    NativeFile.exists.implementation = function() {
        var name = NativeFile.getName.call(this);
        var shouldFakeReturn = (RootBinaries.indexOf(name) > -1);
        if (shouldFakeReturn) {
            send("Bypass return value for binary: " + name);
            return false;
        } else {
            return this.exists.call(this);
        }
    };

    var exec = Runtime.exec.overload('[Ljava.lang.String;');
    var exec1 = Runtime.exec.overload('java.lang.String');
    var exec2 = Runtime.exec.overload('java.lang.String', '[Ljava.lang.String;');
    var exec3 = Runtime.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;');
    var exec4 = Runtime.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.io.File');
    var exec5 = Runtime.exec.overload('java.lang.String', '[Ljava.lang.String;', 'java.io.File');

    exec5.implementation = function(cmd, env, dir) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        return exec5.call(this, cmd, env, dir);
    };

    exec4.implementation = function(cmdarr, env, file) {
        for (var i = 0; i < cmdarr.length; i = i + 1) {
            var tmp_cmd = cmdarr[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }
        }
        return exec4.call(this, cmdarr, env, file);
    };

    exec3.implementation = function(cmdarr, envp) {
        for (var i = 0; i < cmdarr.length; i = i + 1) {
            var tmp_cmd = cmdarr[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }
        }
        return exec3.call(this, cmdarr, envp);
    };

    exec2.implementation = function(cmd, env) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        return exec2.call(this, cmd, env);
    };

    exec.implementation = function(cmd) {
        for (var i = 0; i < cmd.length; i = i + 1) {
            var tmp_cmd = cmd[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmd + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmd + " command");
                return exec1.call(this, fakeCmd);
            }
        }

        return exec.call(this, cmd);
    };

    exec1.implementation = function(cmd) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        return exec1.call(this, cmd);
    };

    String.contains.implementation = function(name) {
        if (name == "test-keys") {
            send("Bypass test-keys check");
            return false;
        }
        return this.contains.call(this, name);
    };

    var get = SystemProperties.get.overload('java.lang.String');

    get.implementation = function(name) {
        if (RootPropertiesKeys.indexOf(name) != -1) {
            send("Bypass " + name);
            return RootProperties[name];
        }
        return this.get.call(this, name);
    };

    Interceptor.attach(Module.findExportByName("libc.so", "fopen"), {
        onEnter: function(args) {
            var path = Memory.readCString(args[0]);
            path = path.split("/");
            var executable = path[path.length - 1];
            var shouldFakeReturn = (RootBinaries.indexOf(executable) > -1)
            if (shouldFakeReturn) {
                Memory.writeUtf8String(args[0], "/notexists");
                send("Bypass native fopen");
            }
        },
        onLeave: function(retval) {

        }
    });

    Interceptor.attach(Module.findExportByName("libc.so", "system"), {
        onEnter: function(args) {
            var cmd = Memory.readCString(args[0]);
            send("SYSTEM CMD: " + cmd);
            if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id") {
                send("Bypass native system: " + cmd);
                Memory.writeUtf8String(args[0], "grep");
            }
            if (cmd == "su") {
                send("Bypass native system: " + cmd);
                Memory.writeUtf8String(args[0], "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled");
            }
        },
        onLeave: function(retval) {

        }
    });

    /*

    TO IMPLEMENT:

    Exec Family

    int execl(const char *path, const char *arg0, ..., const char *argn, (char *)0);
    int execle(const char *path, const char *arg0, ..., const char *argn, (char *)0, char *const envp[]);
    int execlp(const char *file, const char *arg0, ..., const char *argn, (char *)0);
    int execlpe(const char *file, const char *arg0, ..., const char *argn, (char *)0, char *const envp[]);
    int execv(const char *path, char *const argv[]);
    int execve(const char *path, char *const argv[], char *const envp[]);
    int execvp(const char *file, char *const argv[]);
    int execvpe(const char *file, char *const argv[], char *const envp[]);

    */


    BufferedReader.readLine.overload('boolean').implementation = function() {
        var text = this.readLine.overload('boolean').call(this);
        if (text === null) {
            // just pass , i know it's ugly as hell but test != null won't work :(
        } else {
            var shouldFakeRead = (text.indexOf("ro.build.tags=test-keys") > -1);
            if (shouldFakeRead) {
                send("Bypass build.prop file read");
                text = text.replace("ro.build.tags=test-keys", "ro.build.tags=release-keys");
            }
        }
        return text;
    };

    var executeCommand = ProcessBuilder.command.overload('java.util.List');

    ProcessBuilder.start.implementation = function() {
        var cmd = this.command.call(this);
        var shouldModifyCommand = false;
        for (var i = 0; i < cmd.size(); i = i + 1) {
            var tmp_cmd = cmd.get(i).toString();
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd.indexOf("mount") != -1 || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd.indexOf("id") != -1) {
                shouldModifyCommand = true;
            }
        }
        if (shouldModifyCommand) {
            send("Bypass ProcessBuilder " + cmd);
            this.command.call(this, ["grep"]);
            return this.start.call(this);
        }
        if (cmd.indexOf("su") != -1) {
            send("Bypass ProcessBuilder " + cmd);
            this.command.call(this, ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"]);
            return this.start.call(this);
        }

        return this.start.call(this);
    };

    if (useProcessManager) {
        var ProcManExec = ProcessManager.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.io.File', 'boolean');
        var ProcManExecVariant = ProcessManager.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.lang.String', 'java.io.FileDescriptor', 'java.io.FileDescriptor', 'java.io.FileDescriptor', 'boolean');

        ProcManExec.implementation = function(cmd, env, workdir, redirectstderr) {
            var fake_cmd = cmd;
            for (var i = 0; i < cmd.length; i = i + 1) {
                var tmp_cmd = cmd[i];
                if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id") {
                    var fake_cmd = ["grep"];
                    send("Bypass " + cmdarr + " command");
                }

                if (tmp_cmd == "su") {
                    var fake_cmd = ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"];
                    send("Bypass " + cmdarr + " command");
                }
            }
            return ProcManExec.call(this, fake_cmd, env, workdir, redirectstderr);
        };

        ProcManExecVariant.implementation = function(cmd, env, directory, stdin, stdout, stderr, redirect) {
            var fake_cmd = cmd;
            for (var i = 0; i < cmd.length; i = i + 1) {
                var tmp_cmd = cmd[i];
                if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id") {
                    var fake_cmd = ["grep"];
                    send("Bypass " + cmdarr + " command");
                }

                if (tmp_cmd == "su") {
                    var fake_cmd = ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"];
                    send("Bypass " + cmdarr + " command");
                }
            }
            return ProcManExecVariant.call(this, fake_cmd, env, directory, stdin, stdout, stderr, redirect);
        };
    }

    if (useKeyInfo) {
        KeyInfo.isInsideSecureHardware.implementation = function() {
            send("Bypass isInsideSecureHardware");
            return true;
        }
    }
   }


});
