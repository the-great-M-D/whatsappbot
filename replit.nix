{pkgs}: {
  deps = [
    pkgs.ffmpeg
    pkgs.yt-dlp
    pkgs.pkg-config
    pkgs.pixman
    pkgs.librsvg
    pkgs.giflib
    pkgs.libjpeg
    pkgs.pango
    pkgs.cairo
  ];
}
