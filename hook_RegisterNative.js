/*
仅在Android 8.1下测试成功，其他版本可能需要重新修改适配
*/

var ArtMethod_PrettyMethod
function readStdString(str) {
    if ((str.readU8() & 1) === 1) { // size LSB (=1) indicates if it's a long string
        return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
    }
    return str.add(1).readUtf8String();
}
function attach(addr) {
    Interceptor.attach(addr, {
        onEnter: function (args) {
            this.arg0 = args[0]
        }, 
        onLeave: function (retval) {
            var modulemap = new ModuleMap()
            modulemap.update()
            var module = modulemap.find(retval)
            var string = Memory.alloc(0x100)
            ArtMethod_PrettyMethod(string, this.arg0, 1)
            if (module != null) {
                console.log('<' + module.name + '> method_name =>', readStdString(string), ',offset=>', ptr(retval).sub(module.base), ',module_name=>', module.name)
            }else{
                console.log('<anonymous> method_name =>', readStdString(string), ', addr =>', ptr(retval))
            }
        }
    });
}

function hook_RegisterNative() {
    var libart = Process.findModuleByName('libart.so')
    var symbols = libart.enumerateSymbols()
    for (var i = 0; i < symbols.length; i++) {
        if (symbols[i].name.indexOf('PrettyMethod') > -1 && symbols[i].name.indexOf('ArtMethod') > -1 && symbols[i].name.indexOf("Eb") >= 0) {
            ArtMethod_PrettyMethod = new NativeFunction(symbols[i].address, "void", ['pointer', "pointer", "bool"])
        }
        if (symbols[i].name.indexOf('RegisterNative') > -1 && symbols[i].name.indexOf('ArtMethod') > -1 && symbols[i].name.indexOf('RuntimeCallbacks') < 0) {
            attach(symbols[i].address)
        }
        
    }

}
function main() {
    hook_RegisterNative()
}
setImmediate(main)