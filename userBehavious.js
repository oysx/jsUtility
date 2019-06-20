/*
    calculate some feature for user behavious
*/

// function locateMousePosition(x, y, width, height) {
//     var locater = document.createElement("div");
//     locater.className = "locate";
//     locater.style.position = "absolute";
//     locater.style.width = width + "px";
//     locater.style.height = height + "px";
//     document.body.appendChild(locater);

//     locater.style.top = y + "px";
//     locater.style.left = x + "px";
//     setTimeout(function(){
//         var result = window.getComputedStyle(locater).color;
//         viLog("on: "+result+","+window.getComputedStyle(locater).fontFamily);
//     }, 100);
//     // var result = window.getComputedStyle(locater).color;
//     // viLog("on: "+result);
//     // if(result != "violet")
//     //     return false;

//     // locater.style.top = y+height + "px";
//     // locater.style.left = x+width + "px";
//     // result = window.getComputedStyle(locater).color;
//     // viLog("off: "+result);
//     // if(result == "violet")
//     //     return false;
    
//     // return true;
// }

function locateMousePosition(x,y,width, height) {
    var locater = document.createElement("div");
    locater.className = "locate";
    locater.style.position = "absolute";
    locater.style.width = width + "px";
    locater.style.height = height + "px";

    locater.style.top = y + "px";
    locater.style.left = x + "px";

    var onit = false;
    viAddEventListener(locater, "mouseover", function(e){
        var time=new Date().getTime();
        viLog("mouseover-time:"+time);
        onit = true;
    })
    document.body.appendChild(locater);
    var time=new Date().getTime();
    viLog("start-time:"+time);

    setTimeout(function(){
        viLog("on: "+onit);
        document.body.removeChild(locater);
    }, 100);
}

function viGetTimestamp() {
    return new Date().getTime();
}

function MathMedian(numbers) {
    // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
    var median = 0,
        numsLen = numbers.length;
    var data = numbers.slice(0, numbers.length);

    data.sort();
    if (numsLen % 2 === 0) { // is even
        // average of two middle numbers
        median = (data[numsLen / 2 - 1] + data[numsLen / 2]) / 2;
    } else { // is odd
        // middle number only
        median = data[(numsLen - 1) / 2];
    }
    return median;
}

function MathOutlierDetectorByMedian(signal, threshold) {
    var result = []
    var median = MathMedian(signal);
    var difference = [];
    for(var i=0; i<signal.length; i++){
        difference[i] = Math.abs(signal[i] - median);
    }

    var median_difference = MathMedian(difference);
    median_difference = median_difference == 0 ? 1.0 : median_difference;

    for(var i=0; i<difference.length; i++){
        if (difference[i] / median_difference > threshold){
            result.push(i);
        }
    }
    return result;
}

function MathUniq(data){
    var hash = {},
     len = data.length,
    result = [];

    for (var i = 0; i < len; i++){
        if (!hash[data[i]]){
            hash[data[i]] = true;
            result.push(data[i]);
        } 
    }
    return result;
}

function MathVarietyRatio(data) {
    result = MathUniq(data);
    return result.length / data.length;
}

function AnalyzerDeltaData(data, field) {
    var result = []
    for(var i=0; i<data.length; i++){
        result[i] = i==0 ? 0 : data[i][field]-data[i-1][field];
    }
    return result;
}

function AnalyzerShortCount(data) {
    return data.length <= 3;
}

function AnalyzerSplitData(data) {
    if (AnalyzerShortCount(data)){
        return [];
    }

    var result = [];
    var outlier = MathOutlierDetectorByMedian(AnalyzerDeltaData(data, "t"), 30);
    var prev = 0;
    for(var i=0; i<=outlier.length; i++){
        var seg = data.slice(prev, i==outlier.length ? data.length : outlier[i]);
        if(seg.length < 3){
            prev = outlier[i];
            viDebug("too short segments");
            continue;
        }
        result.push(seg);
        prev = outlier[i];
    }
    return result;
}

function AnalyzerGetList(data, field){
    var result = [];
    for(var i=0; i<data.length; i++){
        result.push(data[i][field]);
    }
    return result;
}

function AnalyzerShortMovement(data, threshold){
    var x = AnalyzerGetList(data, "x");
    var y = AnalyzerGetList(data, "y");
    x = Math.max.apply(null, x) - Math.min.apply(null, x);
    y = Math.max.apply(null, y) - Math.min.apply(null, y);
    return Math.sqrt(x*x + y*y) / threshold;
}

function AnalyzerFrequency(data){
    var real = AnalyzerGetList(data, "distance");
    var imag=[]
    for(var i=0; i<real.length; i++){
        imag[i] = 0.0;
    }

    FFT_Transform(real, imag);
    var result=[]
    for(var i=1;i<real.length/2;i++){
        var abs = real[i]*real[i] + imag[i]*imag[i];
        abs = Math.sqrt(abs);
        result.push(abs);
    }

    var maxI=-1, maxV=null;
    for(var i=0; i<result.length; i++){
        if(maxV == null || maxV < result[i]){
            maxV = result[i];
            maxI = i;
        }
    }
    return maxI;
}

function Analyzer(data, count){
    var result = [];
    var recordCount = data.length;
    var browserPower = AnalyzerCheckBrowserPower();
    var seg = AnalyzerSplitData(data);
    count = count < seg.length ? seg.length - count : 0;
    for(var i=count; i<seg.length; i++){
        data = seg[i];
        var shortRatio = AnalyzerShortMovement(seg[i], 15);
        data = PhysVelocity(data);
        MathVectorTheta(data);
        var freqMaxIdx = -2;
        if(!AnalyzerIsIEBrowser()){
            freqMaxIdx = AnalyzerFrequency(data);
        }
        var varietyRatio = MathVarietyRatio(AnalyzerGetList(data, "distance"));
        result.push({
                "shortRatio": parseFloat(shortRatio.toFixed(3)),
                "varietyRatio": parseFloat(varietyRatio.toFixed(3)),
                "freqMaxIdx": freqMaxIdx,
            });
    }
    return {
        "recordCount": recordCount,
        "browserPower": browserPower,
        "segmentCount": seg.length,
        "segments": result};
}

function AnalyzerCheckBrowserPower(){
    var calculateFunction = function(n){
        var cosTable = new Array(n);
        var sinTable = new Array(n);
        for (var i = 0; i < n; i++) {
            var j = i * i % (n * 2);
            cosTable[i] = Math.cos(Math.PI * j / n);
            sinTable[i] = Math.sin(Math.PI * j / n);
        }

        var real = []; for (var i = 0; i < n; i++) real.push(Math.random());
        var imag = []; for (var i = 0; i < n; i++) imag.push(Math.random());

        var result = 0;
        for (var i = 0; i < n; i++) {
            result +=  real[i] * cosTable[i] + imag[i] * sinTable[i];
            result += -real[i] * sinTable[i] + imag[i] * cosTable[i];
        }
        return result;
    }

    var duration = viGetTimestamp();
    calculateFunction(1024);
    duration = viGetTimestamp() - duration;
    return duration;
}

function MathVectorTheta(group) {
    for(var i=0; i<group.length; i++){
        if(group[i].x == 0){
            group[i].theta = group[i].y > 0 ? 90 : -90;
        }else{
            group[i].theta = Math.atan(group[i].y / group[i].x);
            group[i].theta = group[i].theta * 180 / Math.PI;
            if(group[i].y < 0 && group[i].x < 0){
                group[i].theta -= 180;
            }else if(group[i].y > 0 && group[i].x < 0){
                group[i].theta += 180;
            }
        }
        group[i].distance = Math.sqrt(group[i].x * group[i].x + group[i].y * group[i].y);

        group[i].distance = Math.round(group[i].distance * 10000);
        group[i].theta = Math.round(group[i].theta);
    }
}

function PhysForce(displacement, mass) {
    var acceleration = PhysAcceleration(displacement);
    for(var i=0; i<acceleration.length; i++){
        acceleration[i].x *= mass;
        acceleration[i].y *= mass;
    }
    return acceleration;
}

function PhysAcceleration(displacement) {
    displacement = MathDerivativeMatrix(displacement);
    return MathDerivativeMatrix(displacement);
}

function PhysVelocity(displacement) {
    return MathDerivativeMatrix(displacement);
}

function MathDerivativeMatrix(group) {
    var result = [];
    for(var i=1, pre=0; i<group.length; i++){
        var rec = MathDerivativeDimension(group[pre], group[i]);
        if (rec == null) continue;
        pre = i;
        result.push(rec);
    }

    return result;
}

function MathDerivativeDimension(preElement, curElement) {
    var result = {};
    var deltaTime = curElement.t - preElement.t;
    if (deltaTime <= 0) {
        return null;
    }

    result.t = curElement.t;
    result.x = (curElement.x - preElement.x) / deltaTime;
    result.y = (curElement.y - preElement.y) / deltaTime;
    return result;
}

function pointLocation(e) {
    var obj = null;

    // check whether it is mouse or touch event
    if(e.touches && e.touches.length >= 1){
        obj = e.touches[0];
    }else if(e.screenX != undefined){
        obj = e;
    }

    for(var i in this){
        this[i] = obj ? obj[i] : null;
    }
}

function MovementTracer(){}
(function (func) {
    var records = [];

    function _mouseOrTouchMoveChecker(e){
        var timeStamp = e.timeStamp ? e.timeStamp : new Date().getTime();
        timeStamp = Math.round(timeStamp);
        var screenLocation = {
            screenX : 0,
            screenY : 0,
        };

        pointLocation.call(screenLocation, e);
        var rec = {"t":timeStamp, "x":Math.round(screenLocation.screenX), "y":Math.round(screenLocation.screenY)};

        records.push(rec);
    }

    function _showRecords(obj){
        for(var i=0; i<obj.length; i++){
            viDebug("idx="+i+": o="+obj[i].theta+", r="+obj[i].distance);
        }
    }

    function _shortenRecords(obj){
        prev = null;
        for(var i=0; i<obj.length; i++){
            if(prev == null){
                prev = obj[i].t;
                obj[i].t = 0;
                continue;
            }

            obj[i].t -= prev;
        }
    }

    function _cutdownRecords(obj, count, func){
        _shortenRecords(obj);

        var result = [];
        var rec = {};
        var start = obj.length > count ? obj.length - count : 0;
        var max = obj.length > count ? count : obj.length;
        for(var i=0; i<max; i++){
            rec = obj[start+i];
            result.push(func(rec));
        }
        return result;
    }

    func.calculate = function(){
        if(records.length >= 3){
            var para = Analyzer(records, 5);
            viStorage.add("analyzer", para);
            // var acceleration = PhysAcceleration(records);
            // MathVectorTheta(acceleration);
            // _showRecords(acceleration);
            // viStorage.add("accelerationRecords", _cutdownRecords(acceleration, 100, function(rec){
            //     return {"o": rec.theta, "r": rec.distance};
            // }));
            // viStorage.add("pointRecords", _cutdownRecords(records, 50, function(rec){
            //     return {"x": rec.x, "y": rec.y, "t": Math.round(rec.t)};
            // }));
            // viStorage.add("screen", {"height":window.screen.height, "width":window.screen.width});
        }
    }

    viAddEventListener(document, "mousemove", _mouseOrTouchMoveChecker);
    viAddEventListener(document, "touchmove", _mouseOrTouchMoveChecker);
})(MovementTracer);

function HandleIssueMouseMove(count) {
    var totalMouseMove = 0;
    var previousX = 0, previousY = 0;
    var start = false;

    function _mouseOrTouchMoveChecker(e){
        var screenLocation = {
            screenX : 0,
            screenY : 0,
        };

        pointLocation.call(screenLocation, e);

        previousX = screenLocation.screenX; previousY = screenLocation.screenY;
        start = true;

        // viLog("move: " + 
        // e.screenX+","+e.screenY+":"+
        // e.layerX+","+e.layerY+":"+
        // e.clientX+","+e.clientY+":"+
        // e.pageX+","+e.pageY+":"+

        // e.movementX+","+e.movementY+":"+
        // e.offsetX+","+e.offsetY+":"+
        // ""
        // );
    }

    viAddEventListener(document, "mousemove", _mouseOrTouchMoveChecker);
    viAddEventListener(document, "touchmove", _mouseOrTouchMoveChecker);

    var preventCount = 0;
    viFilter.register(function(e){
        if(preventCount < count && totalMouseMove == 0){
            preventCount++;
            viLog("no mouse movement, prevent");
            return true;
        }

        viLog("move count " + totalMouseMove);
        return false;
    }, null, null);
}
HandleIssueMouseMove(1);

function setFlashMode(group, checker) {
    var iSelect = 0;
    var interval = [1, 1000];
    var toggle = function(){
        var opacityShow = [1, 0];
        var opacityHidden = [0, 1];
        for(var key in group){
            var value = group[key];
            var opacity;
            if(checker(value)){
                opacity = opacityShow;
            }else{
                opacity = opacityHidden;
            }
            viCss.call(value, {opacity: opacity[iSelect]});
            viOpacity.call(value, opacity[iSelect]);
        }

        iSelect = (iSelect + 1) % 2;
        setTimeout(toggle, interval[iSelect]);
    };

    setTimeout(toggle, interval[iSelect]);
}
/*
        setFlashMode(group, function(element){
            if(element.id == "guess_"+{{ select_id }}){
                return true;
            }
            return false;
        });
*/

