//frida -U com.xx.xx  -l fridaPrint-all-in-one.js
function main() {
    Java.perform(function (){
        console.log("=============");
        //objection: public static java.lang.String com.xx.xx(java.lang.String)
        Java.use("com.xx.xx").aaa.overload('java.lang.String','java.lang.String').implementation = function (str1,str2){
        console.log(">>>加密前:" + "\n" +str1);
        var result = this.aaa(str1,str2);
        console.log(">>> 加密后:" + "\n" +result);
        return result;
        }
    })
}


function main1() {
    Java.perform(function (){
        //objection: public staticad java.lang.String cn.com.spdb.mobilebank.per.t.o.a(java.lang.String)
        Java.use("cn.com.spdb.mobilebank.per.t.o").a.overload('java.lang.String').implementation = function (str){
        console.log(">>>加密前:" + "\n" +str);
        var result = this.a(str);
        console.log(">>> 加密后:" + "\n" +result);
        return result;
        }
    })
}

function main2() {
    Java.perform(function (){
        //objection: public static byte[] cn.com.spdb.mobilebank.per.t.o.a(java.lang.String)
        Java.use("cn.com.spdb.mobilebank.per.t.o").a.overload('[B').implementation = function (str){
        console.log(">>>加密前:" + "\n" +str);
        var result = this.a(str);
        console.log(">>> 加密后:" + "\n" +result);
        var result = "wq"; //修改结果
        return result;
        }
    })
}

function main3(){
    Java.perform(function(){
        //objection: public static java.lang.String android.util.Base64(byte[],int)
        Java.use("android.util.Base64").encodeToString.overload('[B', 'int').implementation = function(bytearray,int){
            var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            console.log("IMAGE DATA:bytearray,int=>",ByteString.of(bytearray).hex(),int)  //打印Bytes
            var result = this.encodeToString(bytearray,int)
            return result;
        }
    })
}

function getImage(){
    Java.perform(function(){
        Java.use("android.graphics.BitmapFactory").decodeByteArray.overload('[B', 'int', 'int', 'android.graphics.BitmapFactory$Options') .implementation = function(data, offset, length, opts){
            var result = this.decodeByteArray(data, offset, length, opts);
            var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            var gson = Java.use('com.google.gson.Gson')
            send(gson.$new().toJson(data))
            console.log("data, offset, length, opts=>",data, offset, length, opts)
            console.log("IMAGE DATA:bytearray,int=>",ByteString.of(data).hex())
            var path = "/sdcard/Download/tmp/"+guid()+".jpg"
            console.log("path=> ",path)
            var file = Java.use("java.io.File").$new(path)
            var fos = Java.use("java.io.FileOutputStream").$new(file);
            fos.write(data);
            fos.close();
            fos.close();
            return result;
        }
    })
}


setImmediate(main,0)
