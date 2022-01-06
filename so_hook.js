//frida -U  com.gdufs.xman -l hook.js
function hook_java() {
    Java.perform(function () {
        var MyApp = Java.use("com.gdufs.xman.MyApp");
        // Hook Java层的JNI函数
        MyApp.saveSN.implementation = function (sn) {
            console.log("MyApp.saveSN:", sn);
            this.saveSN(sn);
        }

        var Process = Java.use("android.os.Process");
        Process.killProcess.implementation = function (pid) {
            console.log("Process.killProcess:", pid);
        }
    });
}
function hook_libart() {
  
  var module_libart = Process.findModuleByName("libart.so");
  console.log(module_libart);
  var addr_RegisterNatives = null;
  //枚举模块的符号
  var symbols = module_libart.enumerateSymbols();
  for (var i = 0; i < symbols.length; i++) {
      var name = symbols[i].name;
      //去除掉checkjni
      if (name.indexOf("CheckJNI") == -1 && name.indexOf("JNI") > 0) {
          if (name.indexOf("RegisterNatives") > 0) {
              console.log(name);
              addr_RegisterNatives = symbols[i].address;
          }

      }
  }

//
  if (addr_RegisterNatives) {
    Interceptor.attach(addr_RegisterNatives, {
        onEnter: function (args) {
            var java_class = Java.vm.tryGetEnv().getClassName(args[1]);
            var methods = args[2];
            var method_count = parseInt(args[3]);
            console.log("addr_RegisterNatives java_class:", java_class, "method_count:", method_count);
            for (var i = 0; i < method_count; i++) {
                //console.log(hexdump(methods));  //hexdump 打印内存函数
                //指针偏移
                console.log(methods.add(i * Process.pointerSize * 3).readPointer().readCString());
                console.log(methods.add(i * Process.pointerSize * 3 + Process.pointerSize).readPointer().readCString());
                var fnPtr = methods.add(i * Process.pointerSize * 3 + Process.pointerSize * 2).readPointer();
                console.log(fnPtr);

            }
        }, onLeave: function (retval) {

        }
    })
}
}
function hook_native() {
  
    var base_libmyjni = Module.findBaseAddress("libmyjni.so");

    //n2就是saveSN
    Interceptor.attach(Module.findExportByName("libmyjni.so", "n2"), {
        onEnter: function (args) {
            //console.log("n2:",); //Java.vm.tryGetEnv().getStringChars(args[3]) 打印不出来，frida BUG？
        }, onLeave: function (retval) {

        }
    })
    console.log("setValue:", Module.findExportByName("libmyjni.so", "setValue"));
    Interceptor.attach(Module.findExportByName("libmyjni.so", "setValue"), {
        onEnter: function (args) {
            console.log("setValue:", args[1]);
            console.log('setValue called from:\n' +
                Thread.backtrace(this.context, Backtracer.ACCURATE)
                    .map(DebugSymbol.fromAddress).join('\n') + '\n');
        }, onLeave: function (retval) {

        }
    })
}
function hook_android_dlopen_ext() {
    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"), {
        onEnter: function (args) {
            this.name = args[0].readCString();
            console.log("android_dlopen_ext:", this.name);
        }, onLeave: function (retval) {
            if (this.name.indexOf("libmyjni.so") > 0) {
                hook_native();
            }
        }
    })
}

function frida_file() {
    var file = new File("/sdcard/reg.dat", "r+");
    file.write("EoPAoY62@ElRD");
    file.flush();
    file.close();
}

//用frida调用c函数
function c_read_file() {
    //fopen
    //fseek
    //ftell
    //fread
    //fclose
    var fopen = new NativeFunction(Module.findExportByName("libc.so", "fopen"), "pointer", ["pointer", "pointer"]);
    var fseek = new NativeFunction(Module.findExportByName("libc.so", "fseek"), "int", ["pointer", "int", "int"]);
    var ftell = new NativeFunction(Module.findExportByName("libc.so", "ftell"), "long", ["pointer"]);
    var fread = new NativeFunction(Module.findExportByName("libc.so", "fread"), "int", ["pointer", "int", "int", "pointer"]);
    var fclose = new NativeFunction(Module.findExportByName("libc.so", "fclose"), "int", ["pointer"]);

    var file = fopen(Memory.allocUtf8String("/sdcard/reg.dat"), Memory.allocUtf8String("r+"));
    fseek(file, 0, 2);
    var size = ftell(file);
    var buffer = Memory.alloc(size + 1);
    fseek(file, 0, 0);
    fread(buffer, size, 1, file);
    console.log("buffer:", buffer, buffer.readCString());
    fclose(file);

}

function main() {
    hook_java();
    hook_libart();
    //hook_android_dlopen_ext();
}

setImmediate(main);
