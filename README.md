# Frida dynamic analysis

- Frida official repository: https://github.com/frida

- This repository is a small collection of scripts for monitoring traffic on android devices using terminal


# Part 1 - How to setup for Linux os 

## Installing frida 

```bash
  1. sudo pip install frida-tools --break-system-packages
```
```bash
  2. frida-ps           #will show you the running process name and its PID
```
-----

# Android device

Before using frida you need a rooted device or you can use virtual machines that emulate Android but they must be rooted and can only be used for performance testing

For installation, you need an ADB tool which you can use from Android SDK (Software Development Kit), or use Android studio tool which will have an inbuilt ADB in Android studio SDK path. 

Now let's prepare your device. You need to install an Android frida-server that will correspond to the bit system on your device with Github - https://github.com/frida/frida/releases 



Make sure that the version of Frida on your computer must match the version of the frida-server
You can check your frida version if you use the command:
```bash 
$ frida --version
```
---

When you install the archive you need to unzip it (and you can rename the file you get to #frida-server for convenience)

You need to copy the frida-server file to your android phone's tmp directory using the adb push command.

```bash
adb push { frida-server } /data/local/tmp/frida-server
```

Then go to adb shell
```bash
$ adb shell

$ su

$ cd /data/local/tmp
```

Change the permission of the frida-server.

```bash
$ chmod 755 ./frida-server
```

Now let’s start frida-server

```bash
$ ./frida-server
```

Frida is running, do not close or use this terminal window when the server is running

Let's see all running programs on the device

```bash
$ frida-ps -Ua
```

To view a list of all programs on the device use

```bash
$ frida-ps -Uai
```


# Part 2 - listening traffic 



To listen to traffic, we will use the Burp Suite tool, it can be installed from the official site. You can use Burp Suite Professional or Community Edition.

  1. When you install Burp you need to go to tab "Proxy"
  2. You need to click on Edith and change the base proxy
  3. Now go to your device in the Wi-Fi settings. In your network settings, select the Advanced options and set the proxy we chose in Burp Suite
  4. Now we can view unencrypted traffic. In order for us to track secure traffic, we need a certificate. In order to export the certificate, we need to go to the tab:
 
Proxy > Import / Export CA sertificate > Sertificate in DER fromat
And export it to the location we need on the computer, after naming it cacert.der 

  5. Now let's move this certificate to your phone in the downloads folder using adb.
For that use this command:
```bash
$ adb push cacert.der /storage/emulated/0/Download 
```

  6. When you are done, go to the download folder on your device and rename the certificate from cacert.der to cacert.cer so that it looks like in the screenshot
  7. Now on your device go to:
Settings > Security > Encryption & credentials > Install sertificates > select the certificate that we transferred

Click OK and set the protection on the device in the form of a password or pincode
To verify the certificate go to Trusted credentials > USER , there you should see your certificate.

Now if you go to the Proxy tab in the Burp Suite and select HTTP history there, you will see all the traffic that passes through your device. 

# Part 3 - scripts

Frida is a constructor for which you can use both your own scripts and scripts written by other people. How to create your own script can be read on the official website. - https://frida.re/docs/examples/javascript/

For dynamic analysis, we will use a script that will mask our root rights, do SSL pinning and send webview to chrome inspectop you can use scripts from this repository. 

To run this script you need to use this command -
```bash
$ frida -U - f { identifier your app } -l main-skript.js –no-paus
```

You can see identifier your app if you use:
```bash
$ frida-ps -Uai
```

When you run the script, you can see all the information that the application sends

In order for everything to work for you, do not exit the application (if it does not work in the background) and do not touch the console where the frida and the script are running
In the same way, you can run your scripts and also modify them


# Part 4 - Multiple virtual machines

You can use multiple virtual machines if you want. 
In order to find out which devices are connected via adb, you can use the command

```bash
$ adb devices
```
Or 

```bash
$ frida-ls-devices
```

Go to the shell of the device you want to use
```bash
$ adb -s { name your devices } shell
```

And use standard command for start frida-server

To connect each of these devices, there must be a Frida server and all the necessary certificates must be installed. Also, to connect them to Burp Suite, you need to create additional proxy connections with different ports

To run your scripts you need to use a slightly modified command
```bash 
$ frida -D {name your device}  -f {Identifier your app} -l {your-script.js} –no-paus
```



