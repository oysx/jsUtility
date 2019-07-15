function getLocalStorages(){
    console.log("{");
    for(var i=0;i<localStorage.length;i++){
        console.log(localStorage.key(i)+":\""+localStorage[localStorage.key(i)]+"\"")
    }
    console.log("{");
}

function getCookies(){
    var result = document.cookie.split(";");
    console.log("{");
    for(var i=0; i<result.length; i++){
        result[i] = result[i].trim();
        result[i] = result[i].split("=");
        console.log(result[i][0]+":\""+result[i][1]+"\"");
    }
    console.log("}");
}
