var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');
var _ = require('underscore');
var gzip = (require('zlib')).createGzip();

var downloads = {};

exports.clear = function (req, res) {
    function removeDirForce(dirPath, ext, cb) {
        fs.readdir(dirPath, function (err, files) {
            if (err) {
                cb(JSON.stringify(err));
            } else {
                if (files.length > 0) {
                    _.each(files, function (file) {
                        var filePath = path.resolve(dirPath, file);
                        fs.stat(filePath, function (err, stats) {
                            if (err) {
                                cb(JSON.stringify(err));
                            } else {
                                if (stats.isFile() && (!ext || file.indexOf(ext) >= 0)) {
                                    fs.unlink(filePath, function (err) {
                                        if (err) {
                                            cb(JSON.stringify(err));
                                        }
                                    });
                                }
                                if (stats.isDirectory()) {
                                    removeDirForce(filePath + '/', ext, cb);
                                }
                            }
                        });
                    });
                }
                cb("ok");
            }
        });
    }

    removeDirForce(path.resolve(__dirname, "client/downloads"), undefined, function(data){
        res.send(data);
    });
};

function getDownloadObject(fn) {
    var link = new Buffer(fn, 'base64').toString('ascii');
    var filename = path.basename(url.parse(link).pathname);
    var isMsiExe = filename.indexOf(".msi") >= 0 || filename.indexOf(".exe") >= 0;
    var outlink = 'client/downloads/' + filename;
    if (isMsiExe) {
        outlink = outlink.replace(".exe", ".gz").replace(".msi", ".gz");
        filename = filename.replace(".exe", ".gz").replace(".msi", ".gz");
    }

    return {
        link: link,
        outlink: outlink,
        filename: filename,
        stream: fs.createWriteStream(outlink),
        useGzip: isMsiExe
    };
}

exports.src = function (req, res) {
    var obj = downloads[req.params.fn] = getDownloadObject(req.params.fn);

    obj.stream.on('finish', function () {
        obj.state = {state: 'finished', lnk: "/" + obj.outlink.replace("client/", "")};
        console.log("Finished downloading " + obj.link);
    });

    obj.stream.on('error', function () {
        obj.state = {state: 'error'};
    });

    if (obj.useGzip)
        request(obj.link).pipe(gzip).pipe(obj.stream);
    else
        request(obj.link).pipe(obj.stream);

    obj.state = {state: 'started'};
    res.send(obj.state);
};

exports.filestate = function (req, res) {
    var obj = downloads[req.params.fn];

    if (!obj || !obj.state)
        res.send("");
    else {
        res.send(obj.state);
    }
};

exports.ls = function (req, res) {
    res.send(fs.readDirSync('/client/downloads'));
};

exports.href = function (req, res) {
    var obj = downloads[req.params.fn] = getDownloadObject(req.params.fn);

    obj.stream.on('finish', function () {
        console.log("Finished downloading " + obj.link);
        res.download(path.resolve(__dirname, obj.outlink), obj.filename, function (err) {
            if (err) {
                console.log("Error sending file: " + err);
            }
        });
    });

    obj.stream.on('error', function () {
        res.send('file download error');
    });

    if (obj.useGzip)
        request(obj.link).pipe(gzip).pipe(obj.stream);
    else
        request(obj.link).pipe(obj.stream);
};

exports.fp = function(req, res) {

};