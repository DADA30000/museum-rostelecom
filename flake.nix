{
  description = "Цифровой филиал Музея связи ПАО Ростелеком (Липецк)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            python3
            ffmpeg
          ];

          shellHook = ''
            echo "═══════════════════════════════════════════════════════════════"
            echo " Цифровой филиал Музея связи ПАО «Ростелеком» (Липецк)"
            echo " Окружение Nix готово."
            echo " Запуск сервера:  python3 -m http.server 8900 --bind 0.0.0.0"
            echo "═══════════════════════════════════════════════════════════════"
          '';
        };
      }
    );
}
