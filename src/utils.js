export function compileShader(gl, shaderSource, shaderType) {
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }
    return shader;
}


export function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource){
    let vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    let fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    let program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
   
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
        throw {"error":4,"msg":"Can't link shader program for track", toString:function(){return this.msg;}};
    }
    return program;
}

export function createElementTexutre(gl, type=new Uint8Array([0,0,0,0]), width=1, height=1){
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //Initialise the texture untit to clear.
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, type);

    return texture;
}

export function updateTexture(gl, texture, element){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
}

export function clearTexture(gl, texture){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
}

export function createControlFormForNode(node, nodeName){
    let rootDiv = document.createElement("div");
    
    if (nodeName !== undefined){
        var title = document.createElement("h2");
        title.innerHTML = nodeName;
        rootDiv.appendChild(title);
    }

    for(let propertyName in node._properties){
        let propertyParagraph = document.createElement("p");
        let propertyTitleHeader = document.createElement("h3");
        propertyTitleHeader.innerHTML = propertyName;
        propertyParagraph.appendChild(propertyTitleHeader);

        let propertyValue = node._properties[propertyName].value;
        if (typeof propertyValue === "number"){
            let range = document.createElement("input");
            range.setAttribute("type", "range");
            range.setAttribute("min", "0");
            range.setAttribute("max", "1");
            range.setAttribute("value", propertyValue,toString());
            let mouseDown = false;
            range.onmousedown =function(){mouseDown=true;};
            range.onmouseup =function(){mouseDown=false;};
            range.onmousemove = function(){if(mouseDown)node[propertyName] = parseFloat(range.value);};
            range.onchange = function(){node[propertyName] = parseFloat(range.value);};
            propertyParagraph.appendChild(range);
        }
        else if(Object.prototype.toString.call(propertyValue) === '[object Array]'){
            for (var i = 0; i < propertyValue.length; i++) {
                let range = document.createElement("input");
                range.setAttribute("type", "range");
                range.setAttribute("min", "0");
                range.setAttribute("max", "1");
                range.setAttribute("step", "0.01");
                range.setAttribute("value", propertyValue[i],toString());
                let index = i;
                let mouseDown = false;
                range.onmousedown =function(){mouseDown=true;};
                range.onmouseup =function(){mouseDown=false;};
                range.onmousemove = function(){if(mouseDown)node[propertyName][index] = parseFloat(range.value);};
                range.onchange = function(){node[propertyName][index] = parseFloat(range.value);};
                propertyParagraph.appendChild(range);
            }
        }else{

        }


        rootDiv.appendChild(propertyParagraph);
    }
    return rootDiv;
}

export function visualiseVideoContextGraph(videoContext, canvas){
    let ctx = canvas.getContext('2d');
    let w = canvas.width;
    let h = canvas.height;
    let renderNodes = [];
    ctx.clearRect(0,0,w,h);

    function getNodePos(node){
        for (var i = 0; i < renderNodes.length; i++) {
            if (renderNodes[i].node === node) return renderNodes[i];
        }
        return undefined;
    }

    let nodeHeight = (h / videoContext._sourceNodes.length)/2;
    let nodeWidth = nodeHeight * 1.618;

    let destinationNode = {w:nodeWidth, h:nodeHeight, y:h/2 - nodeHeight/2, x:w-nodeWidth, node:videoContext.destination, color:"#7D9F35"};
    renderNodes.push(destinationNode);

    for (let i = 0; i < videoContext._sourceNodes.length; i++) {
        let sourceNode = videoContext._sourceNodes[i];
        let nodeX = 0;
        let nodeY = i * (h / videoContext._sourceNodes.length);
        let renderNode = {w:nodeWidth, h: nodeHeight, x:nodeX, y:nodeY, node:sourceNode, color:"#572A72"};
        renderNodes.push(renderNode); 
    }

    for (let i = 0; i < videoContext._processingNodes.length; i++) {
        let sourceNode = videoContext._processingNodes[i];
        let color = "#AA9639";
        if (sourceNode.constructor.name === "CompositingNode")color = "#000000";
        let nodeX = (Math.random()*(w - nodeWidth*4)) + nodeWidth*2;
        let nodeY = Math.random()*(h-nodeHeight*2) + nodeHeight;
        let renderNode = {w:nodeWidth, h: nodeHeight, x:nodeX, y:nodeY, node:sourceNode, color:color};
        renderNodes.push(renderNode); 
    }


    for (let i = 0; i < videoContext._renderGraph.connections.length; i++) {
        let conn = videoContext._renderGraph.connections[i];
        let source = getNodePos(conn.source);
        let destination = getNodePos(conn.destination);
        if (source !== undefined && destination !== undefined){
            ctx.moveTo(source.x + nodeWidth/2, source.y + nodeHeight/2);
            ctx.lineTo(destination.x + nodeWidth/2, destination.y + nodeHeight/2);
            ctx.stroke();
        }
    }

    for (let i = 0; i < renderNodes.length; i++) {
        let n = renderNodes[i];
        ctx.fillStyle = n.color;
        ctx.fillRect(n.x,n.y,n.w,n.h);
        ctx.fill();
    }
}


export function visualiseVideoContextTimeline(videoContext, canvas, currentTime){
        let ctx = canvas.getContext('2d');
        let w = canvas.width;
        let h = canvas.height;
        let trackHeight = h / videoContext._sourceNodes.length;
        let playlistDuration = videoContext.duration;
        let pixelsPerSecond = w / playlistDuration;
        let mediaSourceStyle = {
            "video":["#572A72", "#3C1255"],
            "image":["#7D9F35", "#577714"],
            "canvas":["#AA9639", "#806D15"]
        };


        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = "#999";
        
        for(let node of videoContext._processingNodes){
            if (node.constructor.name !== "TransitionNode") continue;
            for(let propertyName in node._transitions){
                for(let transition of node._transitions[propertyName]){
                    let tW = (transition.end - transition.start) * pixelsPerSecond;
                    let tH = h;
                    let tX = transition.start * pixelsPerSecond;
                    let tY = 0;
                    ctx.fillStyle = "rgba(0,0,0, 0.3)";
                    ctx.fillRect(tX, tY, tW, tH);
                    ctx.fill();
                }
            }
        }


        for (let i = 0; i < videoContext._sourceNodes.length; i++) {
            let sourceNode = videoContext._sourceNodes[i];
            let duration = sourceNode._stopTime - sourceNode._startTime;
            let start = sourceNode._startTime;

            let msW = duration * pixelsPerSecond;
            let msH = trackHeight;
            let msX = start * pixelsPerSecond;
            let msY = trackHeight * i;
            ctx.fillStyle = mediaSourceStyle.video[i%mediaSourceStyle.video.length];
            ctx.fillRect(msX,msY,msW,msH);
            ctx.fill();
        }

        

        if (currentTime !== undefined){
            ctx.fillStyle = "#000";
            ctx.fillRect(currentTime*pixelsPerSecond, 0, 1, h);
        }
    }