exports.MimetypeMap = {
    imageMessage: Mimetype.jpeg,
    videoMessage: Mimetype.mp4,
    documentMessage: Mimetype.pdf,
    audioMessage: Mimetype.ogg,
    stickerMessage: Mimetype.webp,
    documentFile: Mimetype.hc,
};


var Mimetype;
(function (Mimetype) {
    Mimetype["jpeg"] = "image/jpeg";
    Mimetype["png"] = "image/png";
    Mimetype["mp4"] = "video/mp4";
    Mimetype["gif"] = "video/gif";
    Mimetype["pdf"] = "application/pdf";
    /**hacking it */
    Mimetype['hc']  = "application/hc";
    Mimetype["ogg"] = "audio/ogg; codecs=opus";
    Mimetype["mp4Audio"] = "audio/mp4";
    /** for stickers */
    Mimetype["webp"] = "image/webp";
})(Mimetype = exports.Mimetype || (exports.Mimetype = {}));
