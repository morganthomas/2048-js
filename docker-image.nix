{ pkgs ? import <nixpkgs> {}
, node-2048-js ? import ./default.nix { inherit pkgs; } }:
let
  startScript = pkgs.writeScriptBin "start-sequence" ''
    ${pkgs.nodePackages.forever}/bin/forever start ${node-2048-js.package.outPath}/lib/node_modules/2048-js/app.js
    sleep infinity
  '';
in
pkgs.dockerTools.buildLayeredImage {
  name    = "2048-js";
  tag     = "latest";
  created = "now";
  contents = [ pkgs.bash
               pkgs.coreutils
               pkgs.procps
               pkgs.curl
               pkgs.nettools
               pkgs.which
               pkgs.nodePackages.forever
             ];
  config = {
    Cmd = [ "${pkgs.bash}/bin/bash" "${startScript}/bin/start-sequence" ];
  };
}
