// Util class for downloading the png
export default class Map
{
    width    = 1024
    height   = 1024
    shift    = 10  // power of two: 2^10 = 1024
    altitude = new Uint8Array (1024*1024) // 1024 * 1024 byte array: heights
    color    = new Uint32Array(1024*1024) // 1024 * 1024 int array: RGB colors
    
    constructor()
    {
        this.Init();
    }
    
    Init()
    {
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
                    var tempcanvas = document.createElement("canvas");
                    var tempcontext = tempcanvas.getContext("2d");
                    tempcanvas.width = this.width;
                    tempcanvas.height = this.height;
                    tempcontext.drawImage(image, 0, 0, this.width, this.height);
                    result[i] = tempcontext.getImageData(0, 0, this.width, this.height).data;
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

    OnLoadedImages(result)
    {
        // console.log(this);
        // console.log(result);
        var datac = result[0];
        var datah = result[1];
        for(var i=0; i<this.width*this.height; i++)
        {
            this.color[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
            this.altitude[i] = datah[i<<2];
        }
        //Draw();
    }
}