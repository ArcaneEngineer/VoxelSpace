// Util class for downloading the png
export default class Map
{
    width    = 1024
    height   = 1024
    shift    = 10  // power of two: 2^10 = 1024
    altitude = new Uint8Array (1024*1024) // 1024 * 1024 byte array: heights
    color    = new Uint32Array(1024*1024) // 1024 * 1024 int array: RGB colors
    
    canvas = undefined
    
    toggled = false //actually a view attribute.
    opacity = 1.0 //actually a view attribute.
    
    samplesbufarr = undefined
    samples = undefined
    storeSamples = true
    
    
    constructor()
    {
        this.canvas = document.getElementById("map");//canvas;
        console.log ("canv="+this.canvas);
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
    
    DownloadImagesAsync(urls)
    {
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

    Load(filenames)
    {
        var files = filenames.split(";");
        this.DownloadImagesAsync(["maps/"+files[0]+".png", "maps/"+files[1]+".png"]).then(result => this.OnLoadedImages(result) );
    }

    //Once the chosen image pair (color, height) is loaded...
    OnLoadedImages(result)
    {
        //
        
        
        var datac = result[0].data;
        var datah = result[1].data;
        for(var i=0; i<this.width*this.height; i++)
        {
            this.color[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
            this.altitude[i] = datah[i<<2];
        }
        //Draw();
        
        var context = this.canvas.getContext("2d");
        context.putImageData(result[0], 0, 0);
    }
}