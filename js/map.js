// Util class for downloading the png
export default class Map
{
    width    = 1024
    height   = 1024
    shift    = 10  // power of two: 2^10 = 1024
    altitude = new Uint8Array (1024*1024) // 1024 * 1024 byte array: heights
    color    = new Uint32Array(1024*1024) // 1024 * 1024 int array: RGB colors
    
    //view related
    
    samplesbufarr = undefined
    samples = undefined
    storeSamples = true
    
    toggled = false //map view
    opacity = 1.0 //map view
    
    constructor()
    {
        this.Init();
    }
    
    Init()
    {
        this.samplesbufarr = new ArrayBuffer(1024 * 1024 * 4);
        this.samples = new Uint32Array (this.samplesbufarr);
        this.samples8 = new Uint8Array (this.samplesbufarr);
        console.log("len=", this.samples.length);
        
        for (let i = 0; i < this.width * this.height; i++)
        {
            this.color[i] = 0xFF007050;
            this.altitude[i] = 0;
        }
    }
    
    Load(filenames)
    {
        let files = filenames.split(";");
        let urls = ["maps/"+files[0]+".png", "maps/"+files[1]+".png"];
        
        return new Promise(function(resolve, reject)
        {
            var pending = urls.length;
            var result = [];
            if (pending === 0) {
                resolve([]);
                return;
            }
            urls.forEach(function(url, i) {
                var image = new Image();
                //image.addEventListener("load", function() {
                image.onload = function() {
                    var canvas = document.createElement("canvas");
                    var context = canvas.getContext("2d");
                    canvas.width = this.width;
                    canvas.height = this.height;
                    context.drawImage(image, 0, 0, this.width, this.height);
                    result[i] = context.getImageData(0, 0, this.width, this.height);
                    pending--;
                    if (pending === 0) {
                        resolve(result);
                    }
                };
                image.src = url;
            });
        });
    }
    
    //Once the chosen image pair (color, height) is loaded...
    OnLoadedColorHeightPair(result)
    {
        var datac = result[0].data;
        var datah = result[1].data;
        for(var i=0; i<this.width*this.height; i++)
        {
            this.color[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
            this.altitude[i] = datah[i<<2];
        }
        
        let canvas = document.getElementById("map");//canvas;
        let context = canvas.getContext("2d");
        context.putImageData(result[0], 0, 0);
        
        console.log("LOADED COLOR & HEIGHT IMAGES", result);
    }
}